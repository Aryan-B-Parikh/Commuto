from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from rate_limiter import rate_limit
import models
import schemas
import auth
import os
import hmac
import hashlib
import logging

router = APIRouter(prefix="/wallet", tags=["Wallet"])
logger = logging.getLogger(__name__)


def get_or_create_wallet(user_id, db: Session):
    """Get user's wallet or create one if it doesn't exist"""
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
    if not wallet:
        wallet = models.Wallet(user_id=user_id)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


@router.get("", response_model=schemas.WalletResponse)
@rate_limit(max_requests=30, window_seconds=60, key_suffix="get_wallet")
def get_wallet(
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's wallet"""
    wallet = get_or_create_wallet(current_user.id, db)
    return wallet


@router.get("/transactions", response_model=list[schemas.TransactionResponse])
@rate_limit(max_requests=30, window_seconds=60, key_suffix="list_transactions")
def list_transactions(
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get transaction history for current user"""
    wallet = get_or_create_wallet(current_user.id, db)
    transactions = db.query(models.Transaction).filter(
        models.Transaction.wallet_id == wallet.id
    ).order_by(models.Transaction.created_at.desc()).limit(50).all()
    return transactions


@router.post("/add-money", response_model=schemas.RazorpayOrderResponse)
@rate_limit(max_requests=10, window_seconds=60, key_suffix="add_money")
def create_add_money_order(
    request: Request,
    add_money: schemas.AddMoneyRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Razorpay order for adding money to wallet"""
    import razorpay
    
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service not configured"
        )
    
    try:
        client = razorpay.Client(auth=(key_id, key_secret))
        
        amount_paise = int(add_money.amount * 100)  # Convert to paise
        
        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"wallet_{current_user.id}",
            "notes": {
                "user_id": str(current_user.id),
                "purpose": "wallet_topup"
            }
        }
        
        order = client.order.create(data=order_data)
        
        # Create pending transaction
        wallet = get_or_create_wallet(current_user.id, db)
        transaction = models.Transaction(
            wallet_id=wallet.id,
            amount=add_money.amount,
            type="credit",
            description=f"Wallet Top Up - ₹{add_money.amount}",
            status="pending",
            razorpay_order_id=order["id"]
        )
        db.add(transaction)
        db.commit()
        
        logger.info(f"Razorpay order created: {order['id']} for user {current_user.id}")
        
        return {
            "order_id": order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": key_id
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating Razorpay order: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment order"
        )


@router.post("/verify-payment")
@rate_limit(max_requests=10, window_seconds=60, key_suffix="verify_payment")
def verify_payment(
    request: Request,
    payment_data: schemas.VerifyPaymentRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Verify Razorpay payment and credit wallet"""
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    if not key_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service not configured"
        )
    
    try:
        # Verify signature
        message = f"{payment_data.razorpay_order_id}|{payment_data.razorpay_payment_id}"
        expected_signature = hmac.new(
            key_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if expected_signature != payment_data.razorpay_signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature"
            )
        
        # Find the pending transaction
        wallet = get_or_create_wallet(current_user.id, db)
        transaction = db.query(models.Transaction).filter(
            models.Transaction.wallet_id == wallet.id,
            models.Transaction.razorpay_order_id == payment_data.razorpay_order_id,
            models.Transaction.status == "pending"
        ).first()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        # Credit wallet
        from decimal import Decimal
        wallet.balance = Decimal(str(wallet.balance)) + Decimal(str(transaction.amount))
        transaction.status = "completed"
        transaction.razorpay_payment_id = payment_data.razorpay_payment_id
        
        db.commit()
        
        logger.info(f"Payment verified. Wallet credited: ₹{transaction.amount} for user {current_user.id}")
        
        return {
            "message": "Payment verified successfully",
            "new_balance": float(wallet.balance),
            "amount_credited": float(transaction.amount)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error verifying payment: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify payment"
        )


@router.post("/pay")
@rate_limit(max_requests=10, window_seconds=60, key_suffix="wallet_pay")
def pay_from_wallet(
    request: Request,
    amount: float,
    description: str = "Ride Payment",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Pay from wallet balance (for ride payments)"""
    from decimal import Decimal
    
    wallet = get_or_create_wallet(current_user.id, db)
    
    if Decimal(str(wallet.balance)) < Decimal(str(amount)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient wallet balance"
        )
    
    try:
        wallet.balance = Decimal(str(wallet.balance)) - Decimal(str(amount))
        
        transaction = models.Transaction(
            wallet_id=wallet.id,
            amount=amount,
            type="payment",
            description=description,
            status="completed"
        )
        db.add(transaction)
        db.commit()
        
        logger.info(f"Wallet payment: ₹{amount} by user {current_user.id}")
        
        return {
            "message": "Payment successful",
            "new_balance": float(wallet.balance),
            "amount_deducted": amount
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error processing wallet payment: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment failed"
        )
