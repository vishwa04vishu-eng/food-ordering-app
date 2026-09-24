"""
routers/order_routes.py
--------------------------
POST /orders          -> place an order from the current cart contents, then empty the cart
GET  /orders/my        -> the logged-in customer's own order history ("My Orders" page)
GET  /orders/{id}      -> a single order's detail (owner or admin only)
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


def _serialize_order(order: models.Order) -> schemas.OrderOut:
    return schemas.OrderOut(
        id=order.id,
        user_id=order.user_id,
        total_amount=order.total_amount,
        status=order.status,
        created_at=order.created_at,
        items=[
            schemas.OrderItemOut(
                food_item_id=oi.food_item_id,
                food_name=oi.food_item.name,
                quantity=oi.quantity,
                price_at_order=oi.price_at_order,
            )
            for oi in order.items
        ],
    )


@router.post("", response_model=schemas.OrderOut, status_code=201)
def place_order(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart = current_user.cart
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Your cart is empty")

    total = Decimal("0.00")
    order = models.Order(user_id=current_user.id, total_amount=Decimal("0.00"))
    db.add(order)
    db.flush()  # so order.id is available for order_items

    for line in cart.items:
        if not line.food_item.is_available:
            raise HTTPException(status_code=400, detail=f"'{line.food_item.name}' is no longer available")
        line_total = line.food_item.price * line.quantity
        total += line_total
        db.add(models.OrderItem(
            order_id=order.id,
            food_item_id=line.food_item_id,
            quantity=line.quantity,
            price_at_order=line.food_item.price,  # snapshot price at time of order
        ))

    order.total_amount = total

    # empty the cart now that the order has been placed
    for line in list(cart.items):
        db.delete(line)

    db.commit()
    db.refresh(order)
    return _serialize_order(order)


@router.get("/my", response_model=list[schemas.OrderOut])
def my_orders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [_serialize_order(o) for o in orders]


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and current_user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
    return _serialize_order(order)
