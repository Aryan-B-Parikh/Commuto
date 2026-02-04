from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from websocket_manager import manager
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter()

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    # Verify token and extract user_id
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")  # This is already a string (UUID converted in login)
        if user_id is None:
            await websocket.close(code=1008)  # Policy violation
            return
    except JWTError:
        await websocket.close(code=1008)
        return
    
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            # Echo back for now (can add custom logic)
            await websocket.send_json({"type": "ping", "message": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# Helper functions to send events
async def notify_new_ride(trip_id: str, trip_data: dict):
    """Notify all drivers about a new ride request"""
    await manager.send_to_drivers({
        "type": "new_ride_request",
        "trip_id": trip_id,
        "data": trip_data
    })

async def notify_new_bid(passenger_id: str, bid_data: dict):
    """Notify passenger about a new bid"""
    await manager.send_personal_message({
        "type": "new_bid",
        "data": bid_data
    }, passenger_id)

async def notify_bid_status_update(driver_id: str, bid_data: dict):
    """Notify driver about bid status change"""
    await manager.send_personal_message({
        "type": "bid_status_update",
        "data": bid_data
    }, driver_id)

async def notify_ride_status(user_id: str, trip_data: dict):
    """Notify user about ride status change"""
    await manager.send_personal_message({
        "type": "ride_status",
        "data": trip_data
    }, user_id)
