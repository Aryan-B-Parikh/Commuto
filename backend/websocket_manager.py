from typing import Dict, Set
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Map of user_id -> websocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Map of trip_id -> websocket connections
        self.trip_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        # Also clean up from trip connections
        for trip_id in list(self.trip_connections.keys()):
            if websocket in self.trip_connections[trip_id]:
                self.trip_connections[trip_id].discard(websocket)
                if not self.trip_connections[trip_id]:
                    del self.trip_connections[trip_id]
    
    async def join_trip(self, websocket: WebSocket, trip_id: str):
        """Join a specific trip room for broadcasting updates"""
        if trip_id not in self.trip_connections:
            self.trip_connections[trip_id] = set()
        self.trip_connections[trip_id].add(websocket)
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to a specific user (all their connections)"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast_to_trip(self, trip_id: str, message: dict):
        """Send message to all participants in a trip"""
        if trip_id in self.trip_connections:
            for connection in self.trip_connections[trip_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

    async def send_to_drivers(self, message: dict, exclude_user_id: str = None):
        """Broadcast message to all connected drivers (for new ride requests)"""
        # Note: This logic depends on knowing which user_id belongs to a driver.
        # Currently we don't store role in the manager, but websocket_router uses this.
        # We can implement a more robust role-based broadcast if needed.
        for user_id, connections in self.active_connections.items():
            if user_id != exclude_user_id:
                for connection in connections:
                    try:
                        await connection.send_json(message)
                    except:
                        pass

manager = ConnectionManager()
