import pytest


class TestAuth:
    """Test authentication endpoints"""
    
    def test_register_passenger(self, client):
        """Test passenger registration"""
        response = client.post("/auth/register", json={
            "email": "newpassenger@test.com",
            "password": "testpassword123",
            "full_name": "New Passenger",
            "phone": "+919876543212",
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
            "phone": "+919876543213",
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
            "phone": "+919876543214",
            "role": "passenger"
        })
        assert response.status_code == 409
        assert "already registered" in response.json()["detail"]
    
    def test_register_invalid_role(self, client):
        """Test registration with invalid role"""
        response = client.post("/auth/register", json={
            "email": "invalid@test.com",
            "password": "testpassword123",
            "full_name": "Invalid User",
            "phone": "+919876543215",
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


    def test_profile_completeness_flow(self, client, auth_headers_passenger):
        """Test complete profile flow: register -> profile_completed is False -> update -> profile_completed is True"""
        # Initially False
        response = client.get("/auth/me", headers=auth_headers_passenger)
        assert response.status_code == 200
        assert response.json()["profile_completed"] is False

        # Update with partial fields (gender only)
        response = client.patch("/auth/me", json={
            "gender": "male"
        }, headers=auth_headers_passenger)
        assert response.status_code == 200
        assert response.json()["profile_completed"] is False

        # Update with required fields (gender, dob, emergency_contact)
        response = client.patch("/auth/me", json={
            "gender": "male",
            "date_of_birth": "1990-01-01",
            "emergency_contact": {
                "name": "Jane Doe",
                "phone": "+919876543216",
                "relationship": "Sister"
            }
        }, headers=auth_headers_passenger)
        assert response.status_code == 200
        assert response.json()["profile_completed"] is True

    def test_driver_profile_completeness_flow(self, client, auth_headers_driver):
        """Test driver profile completeness: needs license + vehicle"""
        # Initially False (test_driver doesn't have personal info yet)
        response = client.get("/auth/me", headers=auth_headers_driver)
        assert response.status_code == 200
        assert response.json()["profile_completed"] is False

        # Update with shared info. The test_driver fixture already has license + vehicle.
        response = client.patch("/auth/me", json={
            "gender": "male",
            "date_of_birth": "1985-05-05",
            "emergency_contact": {
                "name": "Emergency Contact",
                "phone": "+919876543217",
                "relationship": "Family"
            }
        }, headers=auth_headers_driver)
        assert response.status_code == 200
        assert response.json()["profile_completed"] is True


class TestAuthRateLimiting:
    """Test authentication rate limiting"""
    
    def test_login_rate_limit(self, client):
        """Test that login is rate limited"""
        # Make 12 rapid login attempts (limit is 11/minute)
        for i in range(12):
            response = client.post("/auth/login", json={
                "email": f"user{i}@test.com",
                "password": "wrongpassword"
            })
        
        # The 12th request should be rate limited
        assert response.status_code == 429
