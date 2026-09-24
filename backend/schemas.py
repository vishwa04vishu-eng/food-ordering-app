"""
schemas.py
----------
Pydantic models used for request validation and response shaping.
These are DIFFERENT from the SQLAlchemy models in models.py:
  - models.py   -> how data is stored in MySQL
  - schemas.py  -> how data looks in JSON requests/responses (and validation rules)
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from models import RoleEnum, OrderStatusEnum


# ---------- Auth / Users ----------
class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    role: RoleEnum = RoleEnum.customer  # in a real app you'd restrict who can register as admin


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    role: RoleEnum
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Food Items ----------
class FoodItemCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: Optional[str] = None
    category: str = Field(min_length=2, max_length=80)
    price: Decimal = Field(gt=0)
    image_url: Optional[str] = None
    is_available: bool = True


class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, gt=0)
    image_url: Optional[str] = None
    is_available: Optional[bool] = None


class FoodItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str]
    category: str
    price: Decimal
    image_url: Optional[str]
    is_available: bool


# ---------- Cart ----------
class CartItemAdd(BaseModel):
    food_item_id: int
    quantity: int = Field(default=1, gt=0)


class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0)


class CartItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    food_item: FoodItemOut
    quantity: int
    subtotal: Decimal


class CartOut(BaseModel):
    items: List[CartItemOut]
    total: Decimal


# ---------- Orders ----------
class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    food_item_id: int
    food_name: str
    quantity: int
    price_at_order: Decimal


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    total_amount: Decimal
    status: OrderStatusEnum
    created_at: datetime
    items: List[OrderItemOut]


class OrderStatusUpdate(BaseModel):
    status: OrderStatusEnum
