import pytest


class TestOTP:
    """Test OTP verification and trip completion"""
    
    def test_verify_otp_success(self, client, auth_headers_passenger, auth_headers_driver, test_trip):
        """Test successful OTP verification"""
        trip_id = test_trip["id"]
        
        # Driver places a bid
        bid_response = client.post(f"/bids/{trip_id}", json={
            "amount": 25.50
        }, headers=auth_headers_driver)
        bid_id = bid_response.json()["id"]
        
        # Passenger accepts the bid and gets OTP
        accept_response = client.post(f"/bids/{bid_id}/accept", headers=auth_headers_passenger)
        otp = accept_response.json()["otp"]
        
        # Driver verifies OTP
        response = client.post(f"/rides/{trip_id}/verify-otp", json={
            "otp": otp
        }, headers=auth_headers_driver)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Ride started successfully"
        assert data["trip_id"] == trip_id
        assert "started_at" in data
    
    def test_verify_otp_invalid(self, client, auth_headers_passenger, auth_headers_driver, test_trip):
        """Test OTP verification with wrong OTP"""
        trip_id = test_trip["id"]
        
        # Driver places a bid
        bid_response = client.post(f"/bids/{trip_id}", json={
            "amount": 25.50
        }, headers=auth_headers_driver)
        bid_id = bid_response.json()["id"]
        
        # Passenger accepts the bid
        client.post(f"/bids/{bid_id}/accept", headers=auth_headers_passenger)
        
        # Driver tries wrong OTP
        response = client.post(f"/rides/{trip_id}/verify-otp", json={
            "otp": "000000"
        }, headers=auth_headers_driver)
        
        assert response.status_code == 400
        assert "Invalid OTP" in response.json()["detail"]
    
    def test_verify_otp_already_verified(self, client, auth_headers_passenger, auth_headers_driver, test_trip):
        """Test verifying OTP twice fails"""
        trip_id = test_trip["id"]
        
        # Driver places a bid
        bid_response = client.post(f"/bids/{trip_id}", json={
            "amount": 25.50
        }, headers=auth_headers_driver)
        bid_id = bid_response.json()["id"]
        
        # Passenger accepts the bid
        accept_response = client.post(f"/bids/{bid_id}/accept", headers=auth_headers_passenger)
        otp = accept_response.json()["otp"]
        
        # Driver verifies OTP
        client.post(f"/rides/{trip_id}/verify-otp", json={
            "otp": otp
        }, headers=auth_headers_driver)
        
        # Try to verify again
        response = client.post(f"/rides/{trip_id}/verify-otp", json={
            "otp": otp
        }, headers=auth_headers_driver)
        
        assert response.status_code == 400
        assert "already verified" in response.json()["detail"]
    
    def test_verify_otp_unauthorized(self, client, auth_headers_passenger, auth_headers_driver, test_trip):
        """Test only assigned driver can verify OTP"""
        trip_id = test_trip["id"]
        
        # Driver places a bid
        bid_response = client.post(f"/bids/{trip_id}", json={
            "amount": 25.50
        }, headers=auth_headers_driver)
        bid_id = bid_response.json()["id"]
        
        # Passenger accepts the bid
        accept_response = client.post(f"/bids/{bid_id}/accept", headers=auth_headers_passenger)
        otp = accept_response.json()["otp"]
        
        # Passenger tries to verify OTP (should fail)
        response = client.post(f"/rides/{trip_id}/verify-otp", json={
            "otp": otp
        }, headers=auth_headers_passenger)
        
        assert response.status_code == 403
    
    def test_complete_trip_success(self, client, auth_headers_passenger, auth_headers_driver, test_trip):
        """Test successful trip completion"""
        trip_id = test_trip["id"]
        
        # Driver places a bid
        bid_response = client.post(f"/bids/{trip_id}", json={
            "amount": 25.50
        }, headers=auth_headers_driver)
        bid_id = bid_response.json()["id"]
        
        # Passenger accepts the bid
        accept_response = client.post(f"/bids/{bid_id}/accept", headers=auth_headers_passenger)
        otp = accept_response.json()["otp"]
        
        # Driver verifies OTP
        client.post(f"/rides/{trip_id}/verify-otp", json={
            "otp": otp
        }, headers=auth_headers_driver)
        
        # Driver completes the trip
        response = client.post(f"/rides/{trip_id}/complete", headers=auth_headers_driver)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Ride completed successfully"
        assert data["trip_id"] == trip_id
        assert "completed_at" in data
    
    def test_complete_trip_without_otp(self, client, auth_headers_passenger, auth_headers_driver, test_trip):
        """Test cannot complete trip without OTP verification"""
        trip_id = test_trip["id"]
        
        # Driver places a bid
        bid_response = client.post(f"/bids/{trip_id}", json={
            "amount": 25.50
        }, headers=auth_headers_driver)
        bid_id = bid_response.json()["id"]
        
        # Passenger accepts the bid
        client.post(f"/bids/{bid_id}/accept", headers=auth_headers_passenger)
        
        # Driver tries to complete without verifying OTP
        response = client.post(f"/rides/{trip_id}/complete", headers=auth_headers_driver)
        
        assert response.status_code == 400
        assert "OTP verification" in response.json()["detail"]
    
    def test_complete_trip_unauthorized(self, client, auth_headers_passenger, auth_headers_driver, test_trip):
        """Test only assigned driver can complete trip"""
        trip_id = test_trip["id"]
        
        # Driver places a bid
        bid_response = client.post(f"/bids/{trip_id}", json={
            "amount": 25.50
        }, headers=auth_headers_driver)
        bid_id = bid_response.json()["id"]
        
        # Passenger accepts the bid
        accept_response = client.post(f"/bids/{bid_id}/accept", headers=auth_headers_passenger)
        otp = accept_response.json()["otp"]
        
        # Driver verifies OTP
        client.post(f"/rides/{trip_id}/verify-otp", json={
            "otp": otp
        }, headers=auth_headers_driver)
        
        # Passenger tries to complete trip
        response = client.post(f"/rides/{trip_id}/complete", headers=auth_headers_passenger)
        
        assert response.status_code == 403


class TestOTPRateLimiting:
    """Test OTP rate limiting"""
    
    def test_verify_otp_rate_limit(self, client, auth_headers_passenger, auth_headers_driver, test_trip):
        """Test OTP verification rate limiting"""
        trip_id = test_trip["id"]
        
        # Driver places a bid
        bid_response = client.post(f"/bids/{trip_id}", json={
            "amount": 25.50
        }, headers=auth_headers_driver)
        bid_id = bid_response.json()["id"]
        
        # Passenger accepts the bid
        accept_response = client.post(f"/bids/{bid_id}/accept", headers=auth_headers_passenger)
        otp = accept_response.json()["otp"]
        
        # Make 6 OTP verification attempts (limit is 5/minute)
        for i in range(6):
            response = client.post(f"/rides/{trip_id}/verify-otp", json={
                "otp": otp if i == 0 else "000000"  # First is correct, rest are wrong
            }, headers=auth_headers_driver)
        
        # The 6th request should be rate limited
        assert response.status_code == 429
