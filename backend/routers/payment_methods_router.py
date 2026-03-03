from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from rate_limiter import rate_limit
import models
import schemas
import auth
from uuid import UUID
import logging

router = APIRouter(prefix="/auth/payment-methods", tags=["Payment Methods"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[schemas.PaymentMethodResponse])
@rate_limit(max_requests=30, window_seconds=60, key_suffix="list_payment_methods")
def list_payment_methods(
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all payment methods for current user"""
    methods = db.query(models.PaymentMethod).filter(
        models.PaymentMethod.user_id == current_user.id
    ).order_by(models.PaymentMethod.created_at.desc()).all()
    return methods


@router.post("", response_model=schemas.PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(max_requests=10, window_seconds=60, key_suffix="add_payment_method")
def add_payment_method(
    request: Request,
    method_data: schemas.PaymentMethodCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new payment method"""
    try:
        # If this is set as default, unset all others first
        if method_data.is_default:
            db.query(models.PaymentMethod).filter(
                models.PaymentMethod.user_id == current_user.id
            ).update({"is_default": False})
        
        new_method = models.PaymentMethod(
            user_id=current_user.id,
            type=method_data.type,
            provider=method_data.provider,
            last4=method_data.last4,
            is_default=method_data.is_default
        )
        db.add(new_method)
        db.commit()
        db.refresh(new_method)
        
        logger.info(f"Payment method added for user {current_user.id}: {method_data.provider}")
        return new_method
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding payment method: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add payment method"
        )


@router.delete("/{method_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit(max_requests=10, window_seconds=60, key_suffix="delete_payment_method")
def delete_payment_method(
    request: Request,
    method_id: UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a payment method"""
    method = db.query(models.PaymentMethod).filter(
        models.PaymentMethod.id == method_id,
        models.PaymentMethod.user_id == current_user.id
    ).first()
    
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    db.delete(method)
    db.commit()
    logger.info(f"Payment method deleted: {method_id}")


@router.patch("/{method_id}/default", response_model=schemas.PaymentMethodResponse)
@rate_limit(max_requests=10, window_seconds=60, key_suffix="set_default_payment")
def set_default_payment_method(
    request: Request,
    method_id: UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Set a payment method as default"""
    method = db.query(models.PaymentMethod).filter(
        models.PaymentMethod.id == method_id,
        models.PaymentMethod.user_id == current_user.id
    ).first()
    
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    # Unset all others
    db.query(models.PaymentMethod).filter(
        models.PaymentMethod.user_id == current_user.id
    ).update({"is_default": False})
    
    method.is_default = True
    db.commit()
    db.refresh(method)
    
    return method
