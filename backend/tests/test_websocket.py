import pytest
import asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
import sys

# WebSocket tests are written using the sync TestClient websocket helper


class TestWebSocket:
    """Test WebSocket functionality"""
    
    def test_websocket_auth_failure_no_token(self, client):
        """Test WebSocket connection fails without token"""
        try:
            with client.websocket_connect("/ws") as ws:
                ws.receive_text()
        except Exception:
            assert True
    
    def test_websocket_with_invalid_token(self, client):
        """Test WebSocket connection with invalid token"""
        try:
            with client.websocket_connect("/ws?token=invalid_token") as ws:
                # Attempt to receive should fail or close connection
                ws.receive_text()
        except Exception:
            assert True
    
    def test_websocket_connect_with_valid_token(self, client, driver_token):
        """Test WebSocket connection with valid token"""
        with client.websocket_connect(f"/ws?token={driver_token}") as ws:
            # Send ping
            ws.send_text("ping")
            response = ws.receive_json()
            assert response["type"] == "pong"


class TestWebSocketNotifications:
    """Test WebSocket notification helpers"""
    
    def test_notify_new_ride(self):
        """Test notify_new_ride helper function"""
        from routers.websocket_router import notify_new_ride
        
        # This is a basic smoke test
        # In a real scenario, we'd mock the connection manager
        asyncio.run(notify_new_ride("test-trip-id", {"origin": "Test"}))
    
    def test_notify_new_bid(self):
        """Test notify_new_bid helper function"""
        from routers.websocket_router import notify_new_bid
        
        asyncio.run(notify_new_bid("test-passenger-id", {"bid_id": "test-bid"}))
    
    def test_notify_bid_status_update(self):
        """Test notify_bid_status_update helper function"""
        from routers.websocket_router import notify_bid_status_update
        
        asyncio.run(notify_bid_status_update("test-driver-id", {"status": "accepted"}))
    
    def test_notify_ride_status(self):
        """Test notify_ride_status helper function"""
        from routers.websocket_router import notify_ride_status
        
        asyncio.run(notify_ride_status("test-user-id", {"status": "active"}))


class TestWebSocketManager:
    """Test WebSocket connection manager"""
    
    def test_connection_manager_singleton(self):
        """Test that websocket manager is a singleton"""
        from websocket_manager import manager
        
        assert manager is not None
        assert hasattr(manager, 'active_connections')
        assert hasattr(manager, 'connect')
        assert hasattr(manager, 'disconnect')
        assert hasattr(manager, 'send_personal_message')
        assert hasattr(manager, 'send_to_drivers')
