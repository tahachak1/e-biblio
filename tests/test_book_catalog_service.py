import importlib.util
import os
from datetime import datetime
from pathlib import Path

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

# Configure l'environnement de test avant l'import du service.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
os.environ["MONGO_URI"] = "mongodb://localhost:27017/ebiblio_test"

catalog_spec = importlib.util.spec_from_file_location(
    "book_catalog_main", PROJECT_ROOT / "book-catalog-service" / "main.py"
)
catalog_main = importlib.util.module_from_spec(catalog_spec)
assert catalog_spec and catalog_spec.loader
catalog_spec.loader.exec_module(catalog_main)  # type: ignore

client = TestClient(catalog_main.app)
books = catalog_main.books_collection
categories = catalog_main.categories_collection


@pytest.fixture(autouse=True)
def clear_collections():
    books.delete_many({})
    categories.delete_many({})
    yield
    books.delete_many({})
    categories.delete_many({})


def test_list_books_empty():
    response = client.get("/books")
    assert response.status_code == 200
    assert response.json()["books"] == []
    assert response.json()["total"] == 0


def test_list_books_with_search_and_filters():
    sci_fi = categories.insert_one(
        {"nom": "Sci-Fi", "slug": "sci-fi", "createdAt": datetime(2024, 1, 1)}
    ).inserted_id
    romance = categories.insert_one(
        {"nom": "Romance", "slug": "romance", "createdAt": datetime(2024, 1, 2)}
    ).inserted_id

    books.insert_many(
        [
            {
                "_id": ObjectId(),
                "title": "Solaris",
                "author": "Stanislaw Lem",
                "category": "Sci-Fi",
                "categorieId": sci_fi,
                "price": 18.5,
                "type": "papier",
            },
            {
                "_id": ObjectId(),
                "title": "Love in the Time",
                "author": "Author X",
                "category": "Romance",
                "categorieId": romance,
                "price": 10,
                "type": "numerique",
            },
        ]
    )

    search_resp = client.get("/books", params={"search": "Solar"})
    assert search_resp.status_code == 200
    assert len(search_resp.json()["books"]) == 1

    filter_resp = client.get("/books", params={"categorieId": str(romance), "type": "numerique"})
    assert filter_resp.status_code == 200
    assert len(filter_resp.json()["books"]) == 1
    assert filter_resp.json()["books"][0]["type"] == "numerique"


def test_get_book_by_id():
    inserted = books.insert_one(
        {
            "_id": ObjectId(),
            "title": "1984",
            "author": "George Orwell",
            "category": "Fiction",
            "price": 15,
            "type": "papier",
        }
    ).inserted_id

    response = client.get(f"/books/{inserted}")
    assert response.status_code == 200
    assert response.json()["_id"] == str(inserted)
    assert response.json()["title"] == "1984"


def test_list_categories_returns_all():
    categories.insert_many(
        [
            {"nom": "A", "slug": "a", "createdAt": datetime(2024, 1, 1)},
            {"nom": "B", "slug": "b", "createdAt": datetime(2024, 1, 2)},
        ]
    )
    response = client.get("/books/categories")
    assert response.status_code == 200
    body = response.json()
    assert "categories" in body
    assert len(body["categories"]) == 2
