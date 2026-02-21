import pytest


class TestAuth:
    """Test authentication endpoints"""
    
    def test_register_passenger(self, client):
        """Test passenger registration"""
        response = client.post("/auth/register", json={
            "email": "newpassenger@test.com",
            "password": "testpassword123",
            "full_name": "New Passenger",
            "phone": "+1234567890",
            "role": "passenger"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newpassenger@test.com"
        assert data["role"] == "passenger"
        assert "id" in data
    
    def test_register_driver(self, client):
        """Test driver registration with vehicle"""
        response = client.post("/auth/register", json={
            "email": "newdriver@test.com",
            "password": "testpassword123",
            "full_name": "New Driver",
            "phone": "+1234567891",
            "role": "driver",
            "license_number": "DL123456",
            "vehicle_make": "Toyota",
            "vehicle_model": "Camry",
            "vehicle_plate": "ABC123",
            "vehicle_capacity": 4
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newdriver@test.com"
        assert data["role"] == "driver"
        assert data["license_number"] == "DL123456"
    
    def test_register_duplicate_email(self, client, test_passenger):
        """Test registration with duplicate email"""
        response = client.post("/auth/register", json={
            "email": "passenger@test.com",  # Already exists
            "password": "testpassword123",
            "full_name": "Another User",
            "phone": "+1234567892",
            "role": "passenger"
        })
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]
    
    def test_register_invalid_role(self, client):
        """Test registration with invalid role"""
        response = client.post("/auth/register", json={
            "email": "invalid@test.com",
            "password": "testpassword123",
            "full_name": "Invalid User",
            "phone": "+1234567893",
            "role": "invalid_role"
        })
        assert response.status_code == 400
        assert "passenger' or 'driver'" in response.json()["detail"]
    
    def test_login_success(self, client, test_passenger):
        """Test successful login"""
        response = client.post("/auth/login", json={
            "email": "passenger@test.com",
            "password": "testpassword123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client):
        """Test login with wrong password"""
        response = client.post("/auth/login", json={
            "email": "passenger@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    def test_get_current_user(self, client, auth_headers_passenger, test_passenger):
        """Test getting current user info"""
        response = client.get("/auth/me", headers=auth_headers_passenger)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "passenger@test.com"
        assert data["role"] == "passenger"
    
    def test_get_current_user_no_auth(self, client):
        """Test getting current user without authentication"""
        response = client.get("/auth/me")
        assert response.status_code == 401


class TestAuthRateLimiting:
    """Test authentication rate limiting"""
    
    def test_login_rate_limit(self, client):
        """Test that login is rate limited"""
        # Make 11 rapid login attempts (limit is 10/minute)
        for i in range(11):
            response = client.post("/auth/login", json={
                "email": f"user{i}@test.com",
                "password": "wrongpassword"
            })
        
        # The 11th request should be rate limited
        assert response.status_code == 429
