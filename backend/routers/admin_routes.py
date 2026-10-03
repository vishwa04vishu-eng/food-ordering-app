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
    if order.status == models.OrderStatusEnum.pending or payload.status == models.OrderStatusEnum.pending:
        raise HTTPException(status_code=409, detail="Use Accept or Reject to decide a pending order")

    if payload.status == models.OrderStatusEnum.cancelled and order.status != models.OrderStatusEnum.cancelled:
        quantities_by_food = {}
        for order_line in order.items:
            quantities_by_food[order_line.food_item_id] = quantities_by_food.get(order_line.food_item_id, 0) + order_line.quantity

        for food_item_id, quantity in sorted(quantities_by_food.items()):
            food_item = (
                db.query(models.FoodItem)
                .filter(models.FoodItem.id == food_item_id)
                .with_for_update()
                .populate_existing()
                .first()
            )
            if food_item:
                food_item.stock_quantity += quantity
                food_item.is_available = food_item.stock_quantity > 0

    order.status = payload.status
    db.commit()
    db.refresh(order)
    return _serialize_order(order)


@router.post("/orders/{order_id}/accept", response_model=schemas.OrderOut)
def accept_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != models.OrderStatusEnum.pending:
        raise HTTPException(status_code=409, detail="Only pending orders can be accepted")

    order.status = models.OrderStatusEnum.confirmed
    db.commit()
    db.refresh(order)
    return _serialize_order(order)


@router.post("/orders/{order_id}/reject", response_model=schemas.OrderOut)
def reject_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != models.OrderStatusEnum.pending:
        raise HTTPException(status_code=409, detail="Only pending orders can be rejected")

    quantities_by_food = {}
    for order_line in order.items:
        quantities_by_food[order_line.food_item_id] = quantities_by_food.get(order_line.food_item_id, 0) + order_line.quantity

    for food_item_id, quantity in sorted(quantities_by_food.items()):
        food_item = (
            db.query(models.FoodItem)
            .filter(models.FoodItem.id == food_item_id)
            .with_for_update()
            .populate_existing()
            .first()
        )
        if food_item:
            food_item.stock_quantity += quantity
            food_item.is_available = food_item.stock_quantity > 0

    order.status = models.OrderStatusEnum.cancelled
    db.commit()
    db.refresh(order)
    return _serialize_order(order)


@router.get("/customers", response_model=List[schemas.UserOut])
def all_customers(db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.role == models.RoleEnum.customer).all()
