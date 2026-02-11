from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
import logging

from database import engine, get_db, Base
import models
from routers import auth_router, rides_router, bids_router, otp_router, websocket_router
from rate_limiter import rate_limit

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Commuto API", version="1.0.0")

# CORS Configuration from environment
allow_origins = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000").split(",")
allow_origins = [origin.strip() for origin in allow_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

# Centralized error handling middleware
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except HTTPException as http_exc:
        logger.warning(f"HTTP Exception: {http_exc.detail}")
        return JSONResponse(
            status_code=http_exc.status_code,
            content={"detail": http_exc.detail, "type": "http_error"}
        )
    except Exception as exc:
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error", "type": "internal_error"}
        )

# Include routers
app.include_router(auth_router.router)
app.include_router(rides_router.router)
app.include_router(bids_router.router)
app.include_router(otp_router.router)
app.include_router(websocket_router.router)

@app.get("/")
def root():
    return {"message": "Commuto API is running"}

@app.get("/health")
@rate_limit(max_requests=10, window_seconds=60)
def health_check(request: Request, db: Session = Depends(get_db)):
    try:
        # Test database connection
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
