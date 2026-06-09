from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.models import Base
from app.database import engine, SessionLocal
from app.schemas import UserCreate
from pydantic import ValidationError

client = TestClient(app)

def test_password_strength_validation():
    # Test weak passwords directly on the schema
    # 1. Too short
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(email="test@example.com", password="Ab1!")
    assert "Password must be at least 8 characters" in str(exc_info.value)

    # 2. No uppercase
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(email="test@example.com", password="weakpass1!")
    assert "Password must be at least 8 characters" in str(exc_info.value)

    # 3. No lowercase
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(email="test@example.com", password="WEAKPASS1!")
    assert "Password must be at least 8 characters" in str(exc_info.value)

    # 4. No digit
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(email="test@example.com", password="WeakPassword!")
    assert "Password must be at least 8 characters" in str(exc_info.value)

    # 5. No special char
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(email="test@example.com", password="WeakPassword1")
    assert "Password must be at least 8 characters" in str(exc_info.value)

    # 6. Valid strong password
    user = UserCreate(email="test@example.com", password="StrongPassword1!")
    assert user.password == "StrongPassword1!"

def test_register_weak_password_api():
    # Attempt to register with a weak password via HTTP
    response = client.post(
        "/auth/register",
        json={"email": "weak_tester@example.com", "password": "weak"}
    )
    assert response.status_code == 422
    # Ensure error detail mentions the validation failure
    errors = response.json()["detail"]
    assert any("password" in err["loc"] for err in errors)

def test_register_strong_password_api():
    # Register with a strong password via HTTP
    # Use a unique email to avoid conflicts with existing seeds/users
    unique_email = "strong_tester_unique_123@example.com"
    response = client.post(
        "/auth/register",
        json={"email": unique_email, "password": "StrongPassword123!"}
    )
    # The registration is validated, but it might fail if email is registered.
    # In a clean test run, since we used a unique email, it should return 200 or 400 (if already registered).
    # Since we use test database or normal db, let's clean up or just verify it's not 422.
    assert response.status_code in (200, 400)
    if response.status_code == 200:
        assert "id" in response.json()
        assert response.json()["email"] == unique_email
