import pytest


class TestRides:
    """Test ride endpoints"""
    
    def test_create_trip(self, client, auth_headers_passenger):
        """Test creating a ride request"""
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
        
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "pending"
        assert data["total_seats"] == 2
        assert "id" in data
    
    def test_create_trip_past_date(self, client, auth_headers_passenger):
        """Test creating a trip with past date fails"""
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
            "date": "2020-01-01",  # Past date
            "time": "14:00",
            "seats_requested": 2
        }, headers=auth_headers_passenger)
        
        assert response.status_code == 400
        assert "future" in response.json()["detail"].lower()
    
    def test_create_trip_invalid_datetime(self, client, auth_headers_passenger):
        """Test creating a trip with invalid datetime format"""
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
            "date": "invalid-date",
            "time": "14:00",
            "seats_requested": 2
        }, headers=auth_headers_passenger)
        
        assert response.status_code == 400
        assert "Invalid date/time" in response.json()["detail"]
    
    def test_create_trip_unauthorized(self, client, auth_headers_driver):
        """Test that drivers cannot create trips"""
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
        }, headers=auth_headers_driver)
        
        assert response.status_code == 403
    
    def test_get_my_trips(self, client, auth_headers_passenger, test_trip):
        """Test getting passenger's trips"""
        response = client.get("/rides/my-trips", headers=auth_headers_passenger)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    def test_get_open_rides(self, client, auth_headers_driver, test_trip):
        """Test getting open rides as driver"""
        response = client.get("/rides/open", headers=auth_headers_driver)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should include the test trip
        assert len(data) >= 1
    
    def test_get_open_rides_unauthorized(self, client, auth_headers_passenger):
        """Test that passengers cannot view open rides"""
        response = client.get("/rides/open", headers=auth_headers_passenger)
        
        assert response.status_code == 403
    
    def test_cancel_trip_passenger(self, client, auth_headers_passenger, test_trip):
        """Test passenger cancelling their own trip"""
        trip_id = test_trip["id"]
        response = client.post(f"/rides/{trip_id}/cancel", json={
            "reason": "Changed my mind"
        }, headers=auth_headers_passenger)
        
        assert response.status_code == 200
        data = response.json()
        assert data["trip_id"] == trip_id
        assert "penalty_amount" in data
    
    def test_cancel_trip_not_found(self, client, auth_headers_passenger):
        """Test cancelling non-existent trip"""
        response = client.post("/rides/00000000-0000-0000-0000-000000000000/cancel", json={
            "reason": "Test"
        }, headers=auth_headers_passenger)
        
        assert response.status_code == 404
    
    def test_cancel_trip_unauthorized(self, client, auth_headers_driver, test_trip):
        """Test driver cannot cancel passenger's trip"""
        trip_id = test_trip["id"]
        response = client.post(f"/rides/{trip_id}/cancel", json={
            "reason": "Test"
        }, headers=auth_headers_driver)
        
        assert response.status_code == 403


class TestLocationTracking:
    """Test location tracking endpoints"""
    
    def test_update_location(self, client, auth_headers_driver, test_trip):
        """Test driver updating location for assigned trip"""
        # First accept a bid to assign driver
        # For now, just test that the endpoint requires driver assignment
        trip_id = test_trip["id"]
        
        response = client.post(f"/rides/{trip_id}/location", json={
            "lat": 40.7500,
            "lng": -73.9900
        }, headers=auth_headers_driver)
        
        # Should fail because driver is not assigned yet
        assert response.status_code == 403
    
    def test_update_location_unauthorized(self, client, auth_headers_passenger, test_trip):
        """Test passenger cannot update location"""
        trip_id = test_trip["id"]
        
        response = client.post(f"/rides/{trip_id}/location", json={
            "lat": 40.7500,
            "lng": -73.9900
        }, headers=auth_headers_passenger)
        
        assert response.status_code == 403
    
    def test_get_locations(self, client, auth_headers_passenger, test_trip):
        """Test getting trip locations"""
        trip_id = test_trip["id"]
        
        response = client.get(f"/rides/{trip_id}/locations", headers=auth_headers_passenger)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestRidesRateLimiting:
    """Test rides rate limiting"""
    
    def test_create_trip_rate_limit(self, client, auth_headers_passenger):
        """Test trip creation rate limiting"""
        # Make 6 requests (limit is 5/minute)
        for i in range(6):
            response = client.post("/rides/request", json={
                "from_location": {
                    "address": f"{i} Start St, City",
                    "lat": 40.7128,
                    "lng": -74.0060
                },
                "to_location": {
                    "address": f"{i} End Ave, City",
                    "lat": 40.7589,
                    "lng": -73.9851
                },
                "date": "2025-12-31",
                "time": "14:00",
                "seats_requested": 1
            }, headers=auth_headers_passenger)
        
        # The 6th request should be rate limited
        assert response.status_code == 429
