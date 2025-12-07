import os
from datetime import datetime

import jwt
import stripe
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from dotenv import load_dotenv

# Charger l'env depuis le dossier du service pour éviter les problèmes de cwd
SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(SERVICE_DIR, '.env'))

PORT = int(os.getenv('PORT', '8003'))
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/ebiblio')
JWT_SECRET = os.getenv('JWT_SECRET', 'supersecretkey')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
STRIPE_DEFAULT_CURRENCY = os.getenv('STRIPE_DEFAULT_CURRENCY', 'usd')

client = MongoClient(MONGO_URI)
db = client.get_default_database()
if db is None:
    db = client['ebiblio']
payments_collection = db['payment_methods']
payment_intents_collection = db['payment_intents']

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

app = FastAPI(title='Payment Service')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

class PaymentMethodPayload(BaseModel):
  cardNumber: str
  cardName: str
  cardExpiry: str
  type: str | None = 'carte'

class PaymentIntentPayload(BaseModel):
  amount: float
  currency: str | None = None
  description: str | None = None
  paymentMethodId: str | None = None
  metadata: dict | None = None
  confirm: bool | None = False


def get_user_id(request: Request) -> ObjectId:
  header = request.headers.get('Authorization')
  if not header or not header.startswith('Bearer '):
    raise HTTPException(status_code=401, detail='Token manquant')
  token = header.replace('Bearer ', '')
  try:
    payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
  except Exception:
    raise HTTPException(status_code=401, detail='Token invalide')
  user_id = payload.get('userId')
  if not user_id:
    raise HTTPException(status_code=401, detail='Token invalide')
  try:
    return ObjectId(user_id)
  except Exception:
    return user_id


def serialize_method(doc):
  if not doc:
    return None
  doc['_id'] = str(doc['_id'])
  doc['userId'] = str(doc.get('userId'))
  return doc


def serialize_intent(doc):
  if not doc:
    return None
  doc['_id'] = str(doc['_id'])
  doc['userId'] = str(doc.get('userId'))
  if isinstance(doc.get('createdAt'), datetime):
    doc['createdAt'] = doc['createdAt'].isoformat()
  return doc


def to_cents(amount: float) -> int:
  try:
    cents = round(float(amount) * 100)
  except Exception:
    raise HTTPException(status_code=400, detail='Montant invalide')
  if cents <= 0:
    raise HTTPException(status_code=400, detail='Montant doit être > 0')
  return int(cents)


def ensure_stripe():
  if not STRIPE_SECRET_KEY:
    raise HTTPException(status_code=500, detail='STRIPE_SECRET_KEY manquant')


def detect_brand(number: str) -> str:
  digits = ''.join(ch for ch in number if ch.isdigit())
  if digits.startswith('4'):
    return 'VISA'
  if digits[:2] in {'51','52','53','54','55'}:
    return 'Mastercard'
  return 'Carte'

@app.get('/payment-methods')
async def list_methods(request: Request):
  user_id = get_user_id(request)
  methods = [serialize_method(m) for m in payments_collection.find({'userId': user_id})]
  return methods

@app.post('/payment-methods')
async def create_method(payload: PaymentMethodPayload, request: Request):
  user_id = get_user_id(request)
  digits = ''.join(ch for ch in payload.cardNumber if ch.isdigit())
  if len(digits) < 4:
    raise HTTPException(status_code=400, detail='Numéro de carte invalide')
  last4 = digits[-4:]
  brand = detect_brand(digits)
  doc = {
    'userId': user_id,
    'type': payload.type or 'carte',
    'brand': brand,
    'last4': last4,
    'cardholderName': payload.cardName,
    'expiresAt': payload.cardExpiry,
    'isDefault': False,
    'status': 'valid',
    'createdAt': datetime.utcnow()
  }
  if payments_collection.count_documents({'userId': user_id}) == 0:
    doc['isDefault'] = True
  inserted = payments_collection.insert_one(doc)
  return serialize_method({ **doc, '_id': inserted.inserted_id })

@app.delete('/payment-methods/{method_id}')
async def delete_method(method_id: str, request: Request):
  user_id = get_user_id(request)
  payments_collection.delete_one({'_id': ObjectId(method_id), 'userId': user_id})
  return {'message': 'Moyen de paiement supprimé'}

@app.delete('/payment-methods')
async def delete_methods(request: Request):
  user_id = get_user_id(request)
  payments_collection.delete_many({'userId': user_id})
  return {'message': 'Moyens de paiement supprimés'}

@app.patch('/payment-methods/{method_id}/default')
async def set_default(method_id: str, request: Request):
  user_id = get_user_id(request)
  payments_collection.update_many({'userId': user_id}, {'$set': {'isDefault': False}})
  result = payments_collection.find_one_and_update({'_id': ObjectId(method_id), 'userId': user_id}, {'$set': {'isDefault': True}}, return_document=True)
  if not result:
    raise HTTPException(status_code=404, detail='Moyen de paiement introuvable')
  return serialize_method(result)

@app.post('/payments/intent')
async def create_payment_intent(payload: PaymentIntentPayload, request: Request):
  ensure_stripe()
  user_id = get_user_id(request)
  amount_cents = to_cents(payload.amount)
  currency = (payload.currency or STRIPE_DEFAULT_CURRENCY or 'usd').lower()
  if len(currency) != 3:
    raise HTTPException(status_code=400, detail='Devise invalide (ex: usd, eur)')

  metadata = payload.metadata or {}
  metadata = {k: str(v) for k, v in metadata.items()}
  metadata['userId'] = str(user_id)

  try:
    intent = stripe.PaymentIntent.create(
      amount=amount_cents,
      currency=currency,
      description=payload.description,
      payment_method=payload.paymentMethodId,
      confirm=bool(payload.confirm) if payload.paymentMethodId else False,
      metadata=metadata,
      automatic_payment_methods={'enabled': True},
    )
  except stripe.error.StripeError as err:
    detail = getattr(err, 'user_message', None) or str(err)
    raise HTTPException(status_code=400, detail=detail)

  payment_intents_collection.insert_one({
    'userId': user_id,
    'paymentIntentId': intent.id,
    'amount': amount_cents,
    'currency': currency,
    'status': intent.status,
    'description': payload.description,
    'createdAt': datetime.utcnow(),
  })

  return {
    'paymentIntentId': intent.id,
    'clientSecret': intent.client_secret,
    'status': intent.status,
    'amount': amount_cents,
    'currency': currency,
  }

@app.get('/payments/intent/{intent_id}')
async def get_payment_intent(intent_id: str, request: Request):
  ensure_stripe()
  get_user_id(request)  # only check auth
  try:
    intent = stripe.PaymentIntent.retrieve(intent_id)
  except stripe.error.StripeError as err:
    detail = getattr(err, 'user_message', None) or str(err)
    raise HTTPException(status_code=400, detail=detail)
  return {
    'id': intent.id,
    'status': intent.status,
    'amount': intent.amount,
    'currency': intent.currency,
    'description': intent.description,
  }

@app.get('/payments/history')
async def list_payment_intents(request: Request):
  user_id = get_user_id(request)
  intents = [serialize_intent(doc) for doc in payment_intents_collection.find({'userId': user_id}).sort('createdAt', -1)]
  return {'items': intents}

@app.get('/')
async def root():
  return {'status': 'payment-service ok'}

if __name__ == '__main__':
  import uvicorn
  uvicorn.run(app, host='0.0.0.0', port=PORT)
