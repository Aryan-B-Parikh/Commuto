import uuid
from decimal import Decimal
from database import SessionLocal
from models import Wallet, Transaction

def add_test_money(email: str, amount: float):
    db = SessionLocal()
    from models import User
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"User {email} not found")
        return
    
    wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    if not wallet:
        wallet = Wallet(
            id=uuid.uuid4(),
            user_id=user.id,
            balance=Decimal("0")
        )
        db.add(wallet)
        db.flush()
    
    add_amount = Decimal(str(amount))
    wallet.balance = Decimal(str(wallet.balance)) + add_amount
    
    db.add(Transaction(
        id=uuid.uuid4(),
        wallet_id=wallet.id,
        amount=add_amount,
        type="credit",
        description="Manual test credit",
        status="completed"
    ))
    db.commit()
    print(f"Added {amount} to {email}. New balance: {wallet.balance}")

if __name__ == "__main__":
    add_test_money("abc@gmail.com", 5000)
