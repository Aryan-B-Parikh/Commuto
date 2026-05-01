from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import asyncio
import os
import logging

from database import engine, get_db, Base
import models

load_dotenv()
from rate_limiter import rate_limit

from routers import auth_router, rides_router, bids_router, otp_router, websocket_router, payment_methods_router, wallet_router, websocket_trips, geofence_router, notifications_router

# Configure logging to console (Render handles log capture)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
logger.info("Logging initialized to stdout.")

# Create tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern lifespan handler replacing deprecated on_event('startup')."""
    app.state.notification_loop = asyncio.get_running_loop()
    yield


app = FastAPI(title="Commuto API", version="1.0.0", lifespan=lifespan)

@app.get("/api/where-am-i")
def where_am_i():
    import os
    return {"cwd": os.getcwd(), "file": __file__}

# 1. Diagnostic Error & Header Logging Middleware
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    method = request.method
    url = str(request.url)
    origin = request.headers.get("origin")
    
    # Preflight special log
    if method == "OPTIONS":
        logger.info(f"PREFLIGHT: OPTIONS {url} from origin {origin}")
        
    try:
        response = await call_next(request)
        
        # Log outgoing CORS headers for debugging
        if origin:
            logger.info(f"RESPONSE: {method} {url} -> {response.status_code}")
            logger.info(f"CORS Check: Origin={origin} Header={response.headers.get('access-control-allow-origin')}")
            
        return response
    except HTTPException as http_exc:
        logger.warning(f"HTTP Exception {http_exc.status_code}: {http_exc.detail}")
        return JSONResponse(
            status_code=http_exc.status_code,
            content={"detail": http_exc.detail, "type": "http_error"}
        )
    except Exception as exc:
        logger.error(f"CRITICAL: Unhandled exception during {method} {url}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc), "type": "internal_error"}
        )

# 2. CORS Middleware (Outermost to wrap all responses including errors)
# Specific origins and headers required when allow_credentials=True
allow_origins = os.getenv(
    "CORS_ALLOW_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
).split(",")
allow_origins = [origin.strip() for origin in allow_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

@app.get("/api/debug-cors")
def debug_cors(request: Request):
    return {
        "origins": allow_origins,
        "request_origin": request.headers.get("origin"),
        "method": request.method,
        "headers": dict(request.headers)
    }

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors and return a consistent format"""
    errors = exc.errors()
    # Format the error message to be more readable for the frontend
    # Pydantic errors are often deeply nested; we simplify it here
    detail = []
    for error in errors:
        loc = ".".join([str(p) for p in error.get("loc", [])])
        msg = error.get("msg", "Validation error")
        detail.append(f"{loc}: {msg}")
    
    logger.warning(f"Validation error: {detail}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": detail if len(detail) > 1 else detail[0] if detail else "Validation failed",
            "type": "validation_error"
        }
    )

# Include routers
app.include_router(auth_router.router)
app.include_router(rides_router.router)
app.include_router(bids_router.router)
app.include_router(otp_router.router)
app.include_router(websocket_router.router)
app.include_router(payment_methods_router.router)
app.include_router(wallet_router.router)
app.include_router(websocket_trips.router)
app.include_router(geofence_router.router)
app.include_router(notifications_router.router)

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
        return {"status": "healthy", "database": "connected", "api": "active"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
