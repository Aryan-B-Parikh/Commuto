from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from websocket_manager import manager
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
import logging
from database import get_db
from sqlalchemy.orm import Session
import models
import json

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter()
logger = logging.getLogger(__name__)

async def get_token_payload(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

@router.websocket("/ws/trips/{trip_id}")
async def trip_websocket(
    websocket: WebSocket,
    trip_id: str,
    token: str = Query(..., description="JWT authentication token")
):
    # 1. Authenticate JWT
    payload = await get_token_payload(token)
    if not payload:
        await websocket.close(code=1008)
        return
    
    user_id = payload.get("sub")
    role = payload.get("role")
    
    # 2. Verify Trip Access
    db = next(get_db())
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    
    if not trip:
        logger.warning(f"WebSocket attempt for non-existent trip {trip_id}")
        await websocket.close(code=1007)
        return
    
    # Security: Only passenger or driver can join
    is_driver = str(trip.driver_id) == user_id
    is_passenger = False
    
    # Check if user is a passenger in this trip's bookings
    booking = db.query(models.Booking).filter(
        models.Booking.trip_id == trip_id,
        models.Booking.passenger_id == user_id
    ).first()
    if booking:
        is_passenger = True

    if not (is_driver or is_passenger):
        logger.warning(f"Unauthorized WebSocket access to trip {trip_id} by user {user_id}")
        await websocket.close(code=1008)
        return

    # 3. Connect
    await manager.connect(websocket, user_id)
    await manager.join_trip(websocket, trip_id)
    logger.info(f"User {user_id} joined trip room {trip_id}")
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "location_update":
                # Only driver can update location
                if not is_driver:
                    continue
                
                lat = message.get("lat")
                lng = message.get("lng")
                
                # Update LiveLocation in DB (Latest only)
                live_loc = db.query(models.LiveLocation).filter(models.LiveLocation.trip_id == trip_id).first()
                if live_loc:
                    live_loc.latitude = lat
                    live_loc.longitude = lng
                else:
                    live_loc = models.LiveLocation(trip_id=trip_id, latitude=lat, longitude=lng)
                    db.add(live_loc)
                db.commit()
                
                # Broadcast location update to the trip room
                await manager.broadcast_to_trip(trip_id, {
                    "type": "location_update",
                    "trip_id": trip_id,
                    "lat": lat,
                    "lng": lng,
                    "timestamp": __import__('time').time()
                })
                
            elif message.get("type") == "trip_status_update":
                # Handle status updates (Arrived, Started, Completed)
                # This could also be done via REST API, but WebSocket is faster for UI sync
                new_status = message.get("status")
                if is_driver:
                    trip.status = new_status
                    db.commit()
                    await manager.broadcast_to_trip(trip_id, {
                        "type": "trip_status_update",
                        "status": new_status,
                        "trip_id": trip_id
                    })

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"User {user_id} disconnected from trip {trip_id}")
    except Exception as e:
        logger.error(f"WebSocket error in trip {trip_id}: {str(e)}")
        manager.disconnect(websocket, user_id)
