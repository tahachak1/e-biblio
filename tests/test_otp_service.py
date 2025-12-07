import importlib.util
import os
from pathlib import Path

import bcrypt
import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

# Configure l'environnement de test avant d'importer le service.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
os.environ["MONGO_URI"] = "mongodb://localhost:27017/ebiblio_test"
os.environ["JWT_SECRET"] = "test-secret"
os.environ.pop("EMAIL_USER", None)
os.environ.pop("EMAIL_PASS", None)

otp_spec = importlib.util.spec_from_file_location("otp_service_main", PROJECT_ROOT / "otp-service" / "main.py")
otp_main = importlib.util.module_from_spec(otp_spec)
assert otp_spec and otp_spec.loader
otp_spec.loader.exec_module(otp_main)  # type: ignore

client = TestClient(otp_main.app)
users = otp_main.users_collection
otps = otp_main.otps_collection


@pytest.fixture(autouse=True)
def clear_collections():
    users.delete_many({})
    otps.delete_many({})
    yield
    users.delete_many({})
    otps.delete_many({})


def test_healthcheck():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "otp-service ok"


def test_register_and_verify_flow():
    register = client.post(
        "/otp/register",
        json={"nom": "Doe", "prenom": "John", "email": "john@example.com", "password": "Secret123"},
    )
    assert register.status_code == 200
    user_id = register.json()["userId"]

    otp_entry = otps.find_one({"userId": ObjectId(user_id)})
    assert otp_entry is not None

    verify = client.post("/otp/verify", json={"userId": user_id, "otp": otp_entry["code"]})
    assert verify.status_code == 200
    assert verify.json()["success"] is True

    user = users.find_one({"_id": ObjectId(user_id)})
    assert user["isActive"] is True
    assert user["firstLoginCompleted"] is True


def test_login_and_resend_flow():
    user_id = users.insert_one(
        {
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "jane@example.com",
            "password": bcrypt.hashpw(b"Secret123", bcrypt.gensalt()).decode(),
            "isActive": True,
            "firstLoginCompleted": True,
        }
    ).inserted_id

    login = client.post("/otp/login", json={"identifier": "jane@example.com"})
    assert login.status_code == 200
    otp_entry = otps.find_one({"userId": user_id, "type": "login"})
    assert otp_entry is not None

    verify = client.post(
        "/otp/verify", json={"userId": str(user_id), "otp": otp_entry["code"], "otpType": "login"}
    )
    assert verify.status_code == 200

    resend = client.post("/otp/resend", json={"userId": str(user_id), "otpType": "login"})
    assert resend.status_code == 200
    resent = otps.find_one({"userId": user_id, "type": "login"})
    assert resent is not None
    assert resent["code"] != otp_entry["code"]


def test_password_reset_flow():
    user_id = users.insert_one(
        {
            "firstName": "Paul",
            "lastName": "Smith",
            "email": "paul@example.com",
            "password": bcrypt.hashpw(b"OldPass123", bcrypt.gensalt()).decode(),
            "isActive": True,
            "firstLoginCompleted": True,
        }
    ).inserted_id

    request_reset = client.post("/otp/password-reset/request", json={"identifier": "paul@example.com"})
    assert request_reset.status_code == 200

    otp_entry = otps.find_one({"userId": user_id, "type": "password-reset"})
    assert otp_entry is not None

    verify = client.post(
        "/otp/password-reset/verify",
        json={"userId": str(user_id), "otp": otp_entry["code"]},
    )
    assert verify.status_code == 200
    reset_token = verify.json()["resetToken"]

    complete = client.post(
        "/otp/password-reset/complete",
        json={"resetToken": reset_token, "newPassword": "NewSecret987"},
    )
    assert complete.status_code == 200

    updated_user = users.find_one({"_id": user_id})
    assert bcrypt.checkpw(b"NewSecret987", updated_user["password"].encode())
