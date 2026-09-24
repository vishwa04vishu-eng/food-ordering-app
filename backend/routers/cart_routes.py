"""
routers/cart_routes.py
------------------------
All routes require a logged-in customer (any authenticated user, really).
GET    /cart              -> view cart with computed subtotal/total
POST   /cart/items         -> add item (or bump quantity if already in cart)
PUT    /cart/items/{id}    -> update quantity of a cart line
DELETE /cart/items/{id}    -> remove a line from the cart
DELETE /cart                -> clear the whole cart (used after placing an order)
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])


def _get_or_create_cart(db: Session, user: models.User) -> models.Cart:
    if not user.cart:
        cart = models.Cart(user_id=user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        return cart
    return user.cart


def _serialize_cart(cart: models.Cart) -> schemas.CartOut:
    items_out = []
    total = Decimal("0.00")
    for ci in cart.items:
        subtotal = ci.food_item.price * ci.quantity
        total += subtotal
        items_out.append(schemas.CartItemOut(
            id=ci.id, food_item=ci.food_item, quantity=ci.quantity, subtotal=subtotal
        ))
    return schemas.CartOut(items=items_out, total=total)


@router.get("", response_model=schemas.CartOut)
def view_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart = _get_or_create_cart(db, current_user)
    return _serialize_cart(cart)


@router.post("/items", response_model=schemas.CartOut, status_code=201)
def add_to_cart(
    payload: schemas.CartItemAdd,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    food_item = db.query(models.FoodItem).filter(models.FoodItem.id == payload.food_item_id).first()
    if not food_item or not food_item.is_available:
        raise HTTPException(status_code=404, detail="Food item not available")

    cart = _get_or_create_cart(db, current_user)

    existing_line = next((ci for ci in cart.items if ci.food_item_id == payload.food_item_id), None)
    if existing_line:
        existing_line.quantity += payload.quantity
    else:
        db.add(models.CartItem(cart_id=cart.id, food_item_id=payload.food_item_id, quantity=payload.quantity))

    db.commit()
    db.refresh(cart)
    return _serialize_cart(cart)


@router.put("/items/{cart_item_id}", response_model=schemas.CartOut)
def update_cart_item(
    cart_item_id: int,
    payload: schemas.CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cart = _get_or_create_cart(db, current_user)
    line = next((ci for ci in cart.items if ci.id == cart_item_id), None)
    if not line:
        raise HTTPException(status_code=404, detail="Cart item not found")

    line.quantity = payload.quantity
    db.commit()
    db.refresh(cart)
    return _serialize_cart(cart)


@router.delete("/items/{cart_item_id}", response_model=schemas.CartOut)
def remove_cart_item(
    cart_item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cart = _get_or_create_cart(db, current_user)
    line = next((ci for ci in cart.items if ci.id == cart_item_id), None)
    if not line:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(line)
    db.commit()
    db.refresh(cart)
    return _serialize_cart(cart)


@router.delete("", status_code=204)
def clear_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart = _get_or_create_cart(db, current_user)
    for line in list(cart.items):
        db.delete(line)
    db.commit()
    return None
