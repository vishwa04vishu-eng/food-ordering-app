"""
routers/admin_routes.py
--------------------------
Everything here requires require_admin (see auth.py).
GET /admin/orders               -> all orders, across all customers
PUT /admin/orders/{id}/status    -> change an order's status
GET /admin/customers             -> list all customer accounts
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import require_admin
from routers.order_routes import _serialize_order

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"], dependencies=[Depends(require_admin)])


@router.get("/orders", response_model=List[schemas.OrderOut])
def all_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    return [_serialize_order(o) for o in orders]


@router.put("/orders/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(order_id: int, payload: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return _serialize_order(order)


@router.get("/customers", response_model=List[schemas.UserOut])
def all_customers(db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.role == models.RoleEnum.customer).all()
