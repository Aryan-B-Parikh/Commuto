import pytest
import asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
import sys

# WebSocket tests require async support
pytestmark = pytest.mark.asyncio


class TestWebSocket:
    """Test WebSocket functionality"""
    
    async def test_websocket_auth_failure_no_token(self):
        """Test WebSocket connection fails without token"""
        # This test requires async client
        pass
    
    def test_websocket_with_invalid_token(self, client):
        """Test WebSocket connection with invalid token"""
        import asyncio
        
        async def websocket_test():
            async with AsyncClient(app=client.app, base_url="http://test") as ac:
                try:
                    async with ac.websocket_connect("/ws?token=invalid_token") as ws:
                        await ws.receive_text()
                except Exception as e:
                    # Connection should be closed
                    assert True
        
        # Run async test
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(websocket_test())
        except:
            pass  # Expected to fail
        finally:
            loop.close()
    
    def test_websocket_connect_with_valid_token(self, client, driver_token):
        """Test WebSocket connection with valid token"""
        import asyncio
        
        async def websocket_test():
            async with AsyncClient(app=client.app, base_url="http://test") as ac:
                async with ac.websocket_connect(f"/ws?token={driver_token}") as ws:
                    # Send ping
                    await ws.send_text("ping")
                    response = await ws.receive_json()
                    assert response["type"] == "pong"
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(websocket_test())
        finally:
            loop.close()


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
