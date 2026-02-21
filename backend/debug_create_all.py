import logging
from database import engine, Base
import models # Ensure all models are loaded

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("Starting schema creation...")
try:
    Base.metadata.create_all(bind=engine)
    print("Schema creation successful!")
except Exception as e:
    print(f"Schema creation failed: {e}")
