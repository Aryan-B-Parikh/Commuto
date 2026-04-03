from database import SessionLocal
import models

def delete_user(email: str):
    print(f"Connecting to database via SQLAlchemy to delete '{email}'...")
    db = SessionLocal()
    try:
        email_lower = email.lower()
        user = db.query(models.User).filter(models.User.email == email_lower).first()
        
        if not user:
            print(f"User '{email}' not found in database.")
            return
            
        print(f"Found User ID: {user.id}. Proceeding with cascading delete...")
        
        # Delete dependent profile data
        if user.driver_profile:
            print(f"Deleting driver profile...")
            db.delete(user.driver_profile)
        
        if user.passenger_profile:
            print(f"Deleting passenger profile...")
            db.delete(user.passenger_profile)
            
        # Delete wallets, payment methods etc. if they exist
        # (Assuming your models have relationships set up correctly)
        
        # Final delete from users table
        db.delete(user)
        
        db.commit()
        print(f"Successfully deleted user '{email}' and all associated data.")
        
    except Exception as e:
        db.rollback()
        print(f"Cleanup error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    delete_user("jaggu1@gmail.com")
