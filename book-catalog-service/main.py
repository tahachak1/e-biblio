import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv('PORT', '8002'))
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/ebiblio')

client = MongoClient(MONGO_URI)
db = client.get_default_database()
if db is None:
    db = client['ebiblio']
books_collection = db['books']
categories_collection = db['categories']

app = FastAPI(title='Book Catalog Service')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

def serialize_book(doc):
    if not doc:
        return None
    doc['_id'] = str(doc.get('_id'))
    if doc.get('categorieId'):
        doc['categorieId'] = str(doc['categorieId'])
    return doc

@app.get('/books')
async def list_books(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    categorieId: str | None = Query(default=None),
    type: str | None = Query(default=None),
    sort: str | None = Query(default=None),
    order: str | None = Query(default='asc'),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
):
    query = {}
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'author': {'$regex': search, '$options': 'i'}}
        ]

    # Filtre catégorie par ID prioritaire, sinon par nom/slug
    if categorieId:
        try:
            query['categorieId'] = ObjectId(categorieId)
        except Exception:
            query['category'] = {'$regex': categorieId, '$options': 'i'}
    elif category:
        query['category'] = {'$regex': category, '$options': 'i'}

    if type:
        query['type'] = type

    sort_field = None
    if sort == 'price':
        sort_field = 'price'
    elif sort == 'title':
        sort_field = 'title'
    elif sort == 'date':
        sort_field = 'createdAt'

    skip = (page - 1) * limit
    cursor = books_collection.find(query)
    total = cursor.count() if hasattr(cursor, 'count') else books_collection.count_documents(query)

    if sort_field:
        cursor = cursor.sort(sort_field, 1 if order == 'asc' else -1)
    cursor = cursor.skip(skip).limit(limit)
    books = [serialize_book(b) for b in cursor]
    return {'books': books, 'total': total, 'page': page}

@app.get('/books/categories')
async def list_categories():
    categories = []
    for cat in categories_collection.find({}).sort('createdAt', -1):
        cat['_id'] = str(cat['_id'])
        cat['nom'] = cat.get('nom') or cat.get('name') or cat.get('slug')
        categories.append(cat)
    return {'categories': categories}

@app.get('/books/{book_id}')
async def get_book(book_id: str):
    try:
        doc = books_collection.find_one({'_id': ObjectId(book_id)})
    except Exception:
        doc = books_collection.find_one({'_id': book_id})
    if not doc:
        raise HTTPException(status_code=404, detail='Livre introuvable')
    return serialize_book(doc)

@app.get('/')
async def root():
    return {'status': 'book-catalog ok'}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=PORT)
