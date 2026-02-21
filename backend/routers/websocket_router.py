from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from websocket_manager import manager
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
import logging

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT authentication token")
):
    """
    WebSocket endpoint with JWT authentication via query parameter.
    
    Connect using: ws://localhost:8000/ws?token=<your_jwt_token>
    
    Using query parameter instead of path parameter prevents the token
    from being logged in server access logs.
    """
    # Verify token and extract user_id
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.warning("WebSocket connection attempt with no user_id in token")
            await websocket.close(code=1008)  # Policy violation
            return
        
        # Validate role
        role = payload.get("role")
        if role not in ["driver", "passenger"]:
            logger.warning(f"WebSocket connection attempt with invalid role: {role}")
            await websocket.close(code=1008)
            return
            
    except JWTError as e:
        logger.warning(f"WebSocket JWT validation failed: {str(e)}")
        await websocket.close(code=1008)
        return
    except Exception as e:
        logger.error(f"WebSocket unexpected error during auth: {str(e)}")
        await websocket.close(code=1011)  # Internal error
        return
    
    # Connect to manager
    await manager.connect(websocket, user_id)
    logger.info(f"User {user_id} connected via WebSocket")
    
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            
            # Handle ping/pong for connection health
            if data == "ping":
                await websocket.send_json({"type": "pong", "timestamp": __import__('time').time()})
            else:
                # Echo back with acknowledgment
                await websocket.send_json({
                    "type": "ack",
                    "received": data,
                    "user_id": user_id
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"User {user_id} disconnected from WebSocket")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {str(e)}")
        manager.disconnect(websocket, user_id)


# Helper functions to send events
async def notify_new_ride(trip_id: str, trip_data: dict):
    """Notify all drivers about a new ride request"""
    await manager.send_to_drivers({
        "type": "new_ride_request",
        "trip_id": trip_id,
        "data": trip_data
    })
    logger.info(f"Notified drivers about new ride: {trip_id}")


async def notify_new_bid(passenger_id: str, bid_data: dict):
    """Notify passenger about a new bid"""
    await manager.send_personal_message({
        "type": "new_bid",
        "data": bid_data
    }, passenger_id)
    logger.debug(f"Notified passenger {passenger_id} about new bid")


async def notify_bid_status_update(driver_id: str, bid_data: dict):
    """Notify driver about bid status change"""
    await manager.send_personal_message({
        "type": "bid_status_update",
        "data": bid_data
    }, driver_id)
    logger.debug(f"Notified driver {driver_id} about bid status update")


async def notify_ride_status(user_id: str, trip_data: dict):
    """Notify user about ride status change"""
    await manager.send_personal_message({
        "type": "ride_status",
        "data": trip_data
    }, user_id)
    logger.debug(f"Notified user {user_id} about ride status change")


async def notify_trip_started(trip_id: str, user_ids: list):
    """Notify all parties that trip has started"""
    message = {
        "type": "trip_started",
        "trip_id": trip_id,
        "timestamp": __import__('time').time()
    }
    for user_id in user_ids:
        await manager.send_personal_message(message, user_id)
    logger.info(f"Notified about trip start: {trip_id}")


async def notify_trip_completed(trip_id: str, user_ids: list):
    """Notify all parties that trip has completed"""
    message = {
        "type": "trip_completed",
        "trip_id": trip_id,
        "timestamp": __import__('time').time()
    }
    for user_id in user_ids:
        await manager.send_personal_message(message, user_id)
    logger.info(f"Notified about trip completion: {trip_id}")
