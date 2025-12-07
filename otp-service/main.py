import os
import random
import smtplib
import string
from datetime import datetime, timedelta
from uuid import uuid4
from email.message import EmailMessage

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv('PORT', '8001'))
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/ebiblio')
JWT_SECRET = os.getenv('JWT_SECRET', 'supersecretkey')
OTP_EXPIRY_MINUTES = int(os.getenv('OTP_EXPIRY_MINUTES', '10'))
EMAIL_USER = os.getenv('EMAIL_USER')
EMAIL_PASS = (os.getenv('EMAIL_PASS') or '').replace(' ', '')  # Gmail app passwords often contain spaces
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_FROM = os.getenv('EMAIL_FROM', EMAIL_USER)

client = MongoClient(MONGO_URI)
db = client.get_default_database()
if db is None:
    db = client['ebiblio']
users_collection = db['users']
otps_collection = db['otps']

app = FastAPI(title='OTP Service')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

class RegisterPayload(BaseModel):
  nom: str | None = None
  prenom: str | None = None
  email: EmailStr
  password: str

class VerifyPayload(BaseModel):
  userId: str
  otp: str
  otpType: str | None = None

class LoginOtpPayload(BaseModel):
  identifier: str

class ResendPayload(BaseModel):
  userId: str
  otpType: str | None = None

class PasswordResetRequest(BaseModel):
  identifier: str

class PasswordResetVerify(BaseModel):
  userId: str
  otp: str

class PasswordResetComplete(BaseModel):
  resetToken: str
  newPassword: str

def hash_password(password: str) -> str:
  return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
  try:
    return bcrypt.checkpw(password.encode(), hashed.encode())
  except Exception:
    return False

def serialize_user(doc):
  if not doc:
    return None
  doc['_id'] = str(doc['_id'])
  doc.pop('password', None)
  return { **doc, 'id': doc['_id'] }

def generate_otp_code() -> str:
  return f"{random.randint(0, 999999):06d}"

def create_token(user):
  return jwt.encode({'userId': str(user['_id']), 'role': user.get('role', 'user'), 'email': user.get('email')}, JWT_SECRET, algorithm='HS256')

def send_email_otp(to_email: str, code: str, otp_type: str) -> bool:
  """
  Send the OTP code by email using SMTP (Gmail by default).
  Returns True on success, False otherwise.
  """
  if not EMAIL_USER or not EMAIL_PASS:
    print("[OTP][EMAIL] Skipping send: EMAIL_USER or EMAIL_PASS missing")
    return False

  subjects = {
    'register': 'Votre code de vérification e-Biblio',
    'login': 'Votre code de connexion e-Biblio',
    'password-reset': 'Votre code de réinitialisation e-Biblio'
  }
  subject = subjects.get(otp_type, 'Votre code e-Biblio')
  message = EmailMessage()
  message['From'] = EMAIL_FROM or EMAIL_USER
  message['To'] = to_email
  message['Subject'] = subject
  plain = f"""Bonjour,

Voici votre code e-Biblio: {code}
Il est valable pendant {OTP_EXPIRY_MINUTES} minutes.
Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.

e-Biblio"""
  html = f"""
  <div style="background:#f3f4f6;padding:20px;font-family:'Inter',system-ui,-apple-system,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#2563eb,#10b981);color:white;padding:18px 20px;">
        <div style="font-size:12px;letter-spacing:1px;opacity:0.85;text-transform:uppercase;">e-Biblio</div>
        <div style="font-size:22px;font-weight:700;margin-top:6px;">Votre code de vérification</div>
      </div>
      <div style="padding:22px;">
        <p style="margin:0 0 12px 0;color:#111827;font-size:15px;">Bonjour,</p>
        <p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;line-height:1.6;">
          Voici votre code de vérification pour e-Biblio. Il reste valide pendant {OTP_EXPIRY_MINUTES} minutes.
        </p>
        <div style="text-align:center;margin:18px 0;">
          <div style="display:inline-block;background:#111827;color:white;font-weight:700;font-size:20px;letter-spacing:4px;padding:12px 18px;border-radius:12px;">
            {code}
          </div>
        </div>
        <p style="margin:0;color:#6b7280;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 20px;color:#6b7280;font-size:12px;text-align:center;">
        e-Biblio — Sécurité et lecture en toute confiance.
      </div>
    </div>
  </div>
  """
  message.set_content(plain)
  message.add_alternative(html, subtype='html')

  try:
    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
      server.starttls()
      server.login(EMAIL_USER, EMAIL_PASS)
      server.send_message(message)
    print(f"[OTP][EMAIL] Sent OTP email to {to_email} ({otp_type})")
    return True
  except Exception as err:
    print(f"[OTP][EMAIL] Failed to send email to {to_email}: {err}")
    return False

def store_otp(user_id: ObjectId, email: str, otp_type: str, code: str | None = None):
  otp_code = code or generate_otp_code()
  credentials_configured = bool(EMAIL_USER and EMAIL_PASS)
  payload = {
    'userId': user_id,
    'email': email,
    'code': otp_code,
    'type': otp_type,
    'expiresAt': datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES),
    'attempts': 0,
    'maxAttempts': 5
  }
  otps_collection.update_one({'userId': user_id, 'type': otp_type}, {'$set': payload}, upsert=True)
  print(f"[OTP] {otp_type} for {email}: {otp_code}")
  if not send_email_otp(email, otp_code, otp_type):
    # En mode dev/sandbox (EMAIL_USER/PASS absents), on tolère l'absence d'envoi pour garder un flux testable.
    if credentials_configured:
      raise HTTPException(status_code=500, detail="Impossible d'envoyer le code, réessayez plus tard")
    print("[OTP] Email non envoyé (mode dev/sandbox)")
  return otp_code

@app.post('/otp/register')
async def otp_register(payload: RegisterPayload):
  user = users_collection.find_one({'email': payload.email})
  if user and user.get('isActive'):
    raise HTTPException(status_code=400, detail='Utilisateur déjà actif')

  hashed = hash_password(payload.password)
  if user:
    users_collection.update_one({'_id': user['_id']}, {'$set': {
      'firstName': payload.prenom,
      'lastName': payload.nom,
      'password': hashed,
      'isActive': False,
      'firstLoginCompleted': False,
      'status': 'pending'
    }})
    user_id = user['_id']
  else:
    user_id = users_collection.insert_one({
      'firstName': payload.prenom,
      'lastName': payload.nom,
      'email': payload.email,
      'password': hashed,
      'role': 'user',
      'status': 'pending',
      'isActive': False,
      'firstLoginCompleted': False,
      'createdAt': datetime.utcnow()
    }).inserted_id

  code = store_otp(user_id, payload.email, 'register')
  return {'success': True, 'message': 'Code OTP envoyé', 'userId': str(user_id)}

@app.post('/otp/verify')
async def otp_verify(payload: VerifyPayload):
  try:
    user_id = ObjectId(payload.userId)
  except Exception:
    raise HTTPException(status_code=400, detail='Utilisateur invalide')

  otp_query = {'userId': user_id}
  if payload.otpType:
    otp_query['type'] = payload.otpType

  otp = otps_collection.find_one(otp_query, sort=[('expiresAt', -1)])
  if not otp and not payload.otpType:
    otp = otps_collection.find_one({'userId': user_id}, sort=[('expiresAt', -1)])
  if not otp:
    raise HTTPException(status_code=400, detail='OTP invalide')
  if otp.get('attempts', 0) >= otp.get('maxAttempts', 5):
    raise HTTPException(status_code=429, detail='Trop de tentatives')
  if otp.get('expiresAt') and otp['expiresAt'] < datetime.utcnow():
    raise HTTPException(status_code=400, detail='OTP expiré')
  if otp.get('code') != payload.otp:
    otps_collection.update_one({'_id': otp['_id']}, {'$inc': {'attempts': 1}})
    raise HTTPException(status_code=400, detail='Code incorrect')

  user = users_collection.find_one({'_id': user_id})
  if not user:
    raise HTTPException(status_code=404, detail='Utilisateur introuvable')

  if otp.get('type') in ['register', 'login']:
    users_collection.update_one({'_id': user_id}, {'$set': {'isActive': True, 'firstLoginCompleted': True}})
  otps_collection.delete_one({'_id': otp['_id']})

  token = create_token(user)
  return {'success': True, 'message': 'Vérification réussie', 'token': token, 'user': serialize_user({**user, 'isActive': True, 'firstLoginCompleted': True})}

@app.post('/otp/login')
async def otp_login(payload: LoginOtpPayload):
  user = users_collection.find_one({'email': payload.identifier})
  if not user:
    raise HTTPException(status_code=404, detail='Utilisateur introuvable')
  if not user.get('isActive', False):
    raise HTTPException(status_code=403, detail='Compte inactif')
  store_otp(user['_id'], user.get('email'), 'login')
  return {'success': True, 'message': 'Code envoyé', 'userId': str(user['_id'])}

@app.post('/otp/resend')
async def otp_resend(payload: ResendPayload):
  try:
    user_id = ObjectId(payload.userId)
  except Exception:
    raise HTTPException(status_code=400, detail='Utilisateur invalide')
  user = users_collection.find_one({'_id': user_id})
  if not user:
    raise HTTPException(status_code=404, detail='Utilisateur introuvable')

  otp_type = payload.otpType
  if not otp_type:
    last = otps_collection.find_one({'userId': user_id}, sort=[('expiresAt', -1)])
    if last and last.get('type'):
      otp_type = last.get('type')
    else:
      otp_type = 'login' if user.get('isActive') else 'register'

  store_otp(user_id, user.get('email'), otp_type)
  return {'success': True, 'message': 'Nouveau code envoyé', 'userId': str(user_id)}

@app.post('/otp/password-reset/request')
async def password_reset_request(payload: PasswordResetRequest):
  user = users_collection.find_one({'email': payload.identifier})
  if not user:
    raise HTTPException(status_code=404, detail='Utilisateur introuvable')
  store_otp(user['_id'], user.get('email'), 'password-reset')
  return {'success': True, 'message': 'Code envoyé', 'userId': str(user['_id'])}

@app.post('/otp/password-reset/verify')
async def password_reset_verify(payload: PasswordResetVerify):
  try:
    user_id = ObjectId(payload.userId)
  except Exception:
    raise HTTPException(status_code=400, detail='Utilisateur invalide')
  otp = otps_collection.find_one({'userId': user_id, 'type': 'password-reset'})
  if not otp:
    raise HTTPException(status_code=400, detail='OTP invalide')
  if otp.get('expiresAt') and otp['expiresAt'] < datetime.utcnow():
    raise HTTPException(status_code=400, detail='OTP expiré')
  if otp.get('code') != payload.otp:
    otps_collection.update_one({'_id': otp['_id']}, {'$inc': {'attempts': 1}})
    raise HTTPException(status_code=400, detail='Code incorrect')
  reset_token = uuid4().hex
  otps_collection.update_one({'_id': otp['_id']}, {'$set': {'resetToken': reset_token}})
  return {'success': True, 'message': 'OTP vérifié', 'resetToken': reset_token}

@app.post('/otp/password-reset/complete')
async def password_reset_complete(payload: PasswordResetComplete):
  otp = otps_collection.find_one({'resetToken': payload.resetToken, 'type': 'password-reset'})
  if not otp:
    raise HTTPException(status_code=400, detail='Lien invalide')
  if otp.get('expiresAt') and otp['expiresAt'] < datetime.utcnow():
    raise HTTPException(status_code=400, detail='OTP expiré')
  user = users_collection.find_one({'_id': otp['userId']})
  if not user:
    raise HTTPException(status_code=404, detail='Utilisateur introuvable')
  users_collection.update_one({'_id': otp['userId']}, {'$set': {'password': hash_password(payload.newPassword), 'firstLoginCompleted': True, 'isActive': True}})
  otps_collection.delete_one({'_id': otp['_id']})
  return {'success': True, 'message': 'Mot de passe réinitialisé'}

@app.get('/')
async def root():
  return {'status': 'otp-service ok'}

if __name__ == '__main__':
  import uvicorn
  uvicorn.run(app, host='0.0.0.0', port=PORT)
