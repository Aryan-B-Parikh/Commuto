import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from datetime import datetime, timedelta
import models

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db():
    """Create a fresh database session for each test"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with a fresh database"""
    Base.metadata.create_all(bind=engine)
    import rate_limiter as _rate_limiter
    # Clear any existing in-memory rate limit state to isolate tests
    _rate_limiter._rate_limit_storage.clear()
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_passenger(client, db):
    """Create a test passenger user"""
    response = client.post("/auth/register", json={
        "email": "passenger@test.com",
        "password": "testpassword123",
        "full_name": "Test Passenger",
        "phone": "+919876543210",
        "role": "passenger"
    })

    user = db.query(models.User).filter(models.User.email == "passenger@test.com").first()
    if user:
        wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user.id).first()
        if not wallet:
            db.add(models.Wallet(user_id=user.id, balance=1000.0))
        else:
            wallet.balance = 1000.0
        db.commit()

    return response.json()


@pytest.fixture
def test_driver(client, db):
    """Create a test driver user with vehicle"""
    response = client.post("/auth/register", json={
        "email": "driver@test.com",
        "password": "testpassword123",
        "full_name": "Test Driver",
        "phone": "+919876543211",
        "role": "driver",
        "license_number": "DL123456",
        "vehicle_make": "Toyota",
        "vehicle_model": "Camry",
        "vehicle_plate": "ABC123",
        "vehicle_capacity": 4
    })

    user = db.query(models.User).filter(models.User.email == "driver@test.com").first()
    if user:
        wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user.id).first()
        if not wallet:
            db.add(models.Wallet(user_id=user.id, balance=0.0))
        else:
            wallet.balance = 0.0
        db.commit()

    return response.json()


@pytest.fixture
def passenger_token(client, test_passenger):
    """Get auth token for passenger"""
    response = client.post("/auth/login", json={
        "email": "passenger@test.com",
        "password": "testpassword123"
    })
    return response.json()["access_token"]


@pytest.fixture
def driver_token(client, test_driver):
    """Get auth token for driver"""
    response = client.post("/auth/login", json={
        "email": "driver@test.com",
        "password": "testpassword123"
    })
    return response.json()["access_token"]


@pytest.fixture
def auth_headers_passenger(passenger_token):
    """Get auth headers for passenger requests"""
    return {"Authorization": f"Bearer {passenger_token}"}


@pytest.fixture
def auth_headers_driver(driver_token):
    """Get auth headers for driver requests"""
    return {"Authorization": f"Bearer {driver_token}"}


@pytest.fixture
def test_trip(client, auth_headers_passenger):
    """Create a test trip"""
    # Use a date in the future so tests remain valid regardless of current date
    future_date = (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d")
    response = client.post("/rides/create-shared", json={
        "from_location": {
            "address": "123 Start St, City",
            "lat": 40.7128,
            "lng": -74.0060
        },
        "to_location": {
            "address": "456 End Ave, City",
            "lat": 40.7589,
            "lng": -73.9851
        },
        "date": future_date,
        "time": "14:00",
        "total_seats": 2,
        "total_price": 200.0
    }, headers=auth_headers_passenger)
    assert response.status_code == 201, response.text
    return response.json()
