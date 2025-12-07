import importlib.util
import os
from pathlib import Path

import jwt
import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

# Point vers le service et isole la base utilisée pendant les tests.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
os.environ["MONGO_URI"] = "mongodb://localhost:27017/ebiblio_test"
os.environ["JWT_SECRET"] = "test-secret"

payment_spec = importlib.util.spec_from_file_location(
    "payment_service_main", PROJECT_ROOT / "payment-service" / "main.py"
)
payment_main = importlib.util.module_from_spec(payment_spec)
assert payment_spec and payment_spec.loader
payment_spec.loader.exec_module(payment_main)  # type: ignore

client = TestClient(payment_main.app)
collection = payment_main.payments_collection


@pytest.fixture(autouse=True)
def clear_collection():
    collection.delete_many({})
    yield
    collection.delete_many({})


def make_auth(user_id=None):
    uid = user_id or ObjectId()
    token = jwt.encode({"userId": str(uid)}, os.environ["JWT_SECRET"], algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}, uid


def test_list_payment_methods_empty_returns_array():
    headers, _ = make_auth()
    response = client.get("/payment-methods", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


def test_create_payment_method_sets_brand_last4_and_default_flag():
    headers, _ = make_auth()
    payload = {
        "cardNumber": "4111 1111 1111 1111",
        "cardName": "Jane Doe",
        "cardExpiry": "12/28",
        "type": "carte",
    }
    response = client.post("/payment-methods", json=payload, headers=headers)
    body = response.json()

    assert response.status_code == 200
    assert body["brand"] == "VISA"
    assert body["last4"] == "1111"
    assert body["isDefault"] is True


def test_set_default_switches_flags():
    headers, _ = make_auth()
    first = client.post(
        "/payment-methods",
        json={
            "cardNumber": "4111111111111111",
            "cardName": "User One",
            "cardExpiry": "10/27",
            "type": "carte",
        },
        headers=headers,
    ).json()
    second = client.post(
        "/payment-methods",
        json={
            "cardNumber": "5500000000000004",
            "cardName": "User Two",
            "cardExpiry": "09/28",
            "type": "carte",
        },
        headers=headers,
    ).json()

    set_default = client.patch(f"/payment-methods/{first['_id']}/default", headers=headers)
    assert set_default.status_code == 200
    assert set_default.json()["isDefault"] is True

    methods = client.get("/payment-methods", headers=headers).json()
    defaults = {m["_id"]: m["isDefault"] for m in methods}
    assert defaults[first["_id"]] is True
    assert defaults[second["_id"]] is False


def test_delete_one_and_delete_all():
    headers, _ = make_auth()
    created = []
    for num in ["4111111111111111", "5555555555554444"]:
        resp = client.post(
            "/payment-methods",
            json={
                "cardNumber": num,
                "cardName": "User",
                "cardExpiry": "11/29",
                "type": "carte",
            },
            headers=headers,
        )
        assert resp.status_code == 200
        created.append(resp.json()["_id"])

    delete_one = client.delete(f"/payment-methods/{created[0]}", headers=headers)
    assert delete_one.status_code == 200
    remaining = client.get("/payment-methods", headers=headers).json()
    assert len(remaining) == 1

    delete_all = client.delete("/payment-methods", headers=headers)
    assert delete_all.status_code == 200
    assert client.get("/payment-methods", headers=headers).json() == []
