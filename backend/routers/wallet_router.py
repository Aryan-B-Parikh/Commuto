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
import requests

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
    try:
        import razorpay
    except ImportError as exc:
        logger.error("Razorpay SDK is not installed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service dependency is missing on the server"
        ) from exc
    
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
            "receipt": f"w_{str(current_user.id)[:30]}",
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
            "key": key_id
        }
    except requests.exceptions.RequestException as exc:
        db.rollback()
        logger.error(f"Network error while creating Razorpay order: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach Razorpay from the backend. Check internet or DNS on the server and try again."
        ) from exc
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
            "status": "success",
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment failed"
        )


@router.post("/transfer")
@rate_limit(max_requests=10, window_seconds=60, key_suffix="wallet_transfer")
def transfer_money(
    request: Request,
    transfer_data: schemas.TransferRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Transfer money to another user by email"""
    from decimal import Decimal
    
    # 1. Validate self-transfer
    if transfer_data.recipient_email == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer to yourself"
        )
    
    # 2. Find recipient
    recipient = db.query(models.User).filter(models.User.email == transfer_data.recipient_email).first()
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    # 3. Check sender balance
    sender_wallet = get_or_create_wallet(current_user.id, db)
    
    if Decimal(str(sender_wallet.balance)) < Decimal(str(transfer_data.amount)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient wallet balance"
        )
    
    try:
        # 4. Perform Transfer (Atomic)
        recipient_wallet = get_or_create_wallet(recipient.id, db)
        
        # Update balances
        amount_decimal = Decimal(str(transfer_data.amount))
        sender_wallet.balance = Decimal(str(sender_wallet.balance)) - amount_decimal
        recipient_wallet.balance = Decimal(str(recipient_wallet.balance)) + amount_decimal
        
        # Create Sender Transaction (Debit)
        sender_tx = models.Transaction(
            wallet_id=sender_wallet.id,
            amount=transfer_data.amount,
            type="payment",  # Debit
            description=f"Sent to {recipient.full_name}",
            status="completed"
        )
        
        # Create Recipient Transaction (Credit)
        recipient_tx = models.Transaction(
            wallet_id=recipient_wallet.id,
            amount=transfer_data.amount,
            type="credit",   # Credit
            description=f"Received from {current_user.full_name}",
            status="completed"
        )
        
        db.add(sender_tx)
        db.add(recipient_tx)
        db.commit()
        
        logger.info(f"Transfer successful: ₹{transfer_data.amount} from {current_user.email} to {recipient.email}")
        
        return {
            "message": "Transfer successful",
            "new_balance": float(sender_wallet.balance),
            "amount": transfer_data.amount,
            "recipient": recipient.full_name
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error processing transfer: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Transfer failed"
        )
