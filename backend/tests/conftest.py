import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app

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
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_passenger(client):
    """Create a test passenger user"""
    response = client.post("/auth/register", json={
        "email": "passenger@test.com",
        "password": "testpassword123",
        "full_name": "Test Passenger",
        "phone": "+1234567890",
        "role": "passenger"
    })
    return response.json()


@pytest.fixture
def test_driver(client):
    """Create a test driver user with vehicle"""
    response = client.post("/auth/register", json={
        "email": "driver@test.com",
        "password": "testpassword123",
        "full_name": "Test Driver",
        "phone": "+1234567891",
        "role": "driver",
        "license_number": "DL123456",
        "vehicle_make": "Toyota",
        "vehicle_model": "Camry",
        "vehicle_plate": "ABC123",
        "vehicle_capacity": 4
    })
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
    response = client.post("/rides/request", json={
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
        "date": "2025-12-31",
        "time": "14:00",
        "seats_requested": 2
    }, headers=auth_headers_passenger)
    return response.json()
