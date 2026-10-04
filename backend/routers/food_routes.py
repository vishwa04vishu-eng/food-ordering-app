import os
from typing import List, Optional

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
import schemas
from database import get_db
from auth import require_admin
from menu_catalog import FOOD_CATALOG

router = APIRouter(prefix="/food", tags=["Food Items"])
MAX_IMAGE_SIZE = 5 * 1024 * 1024
IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


@router.post("/images", dependencies=[Depends(require_admin)])
async def upload_food_image(image: UploadFile = File(...)):
    if image.content_type not in IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Choose a JPG, PNG, WEBP, or GIF image")

    contents = await image.read(MAX_IMAGE_SIZE + 1)
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")

    result = cloudinary.uploader.upload(contents, folder="food-ordering-app")
    return {"image_url": result["secure_url"]}


@router.get("", response_model=List[schemas.FoodItemOut])
def list_food_items(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Menu page calls this with ?search=...&category=... for live filtering."""
    query = db.query(models.FoodItem)

    if search:
        like = f"%{search}%"
        query = query.filter(or_(models.FoodItem.name.ilike(like), models.FoodItem.description.ilike(like)))

    if category and category.lower() != "all":
        query = query.filter(models.FoodItem.category == category)

    return query.order_by(models.FoodItem.category, models.FoodItem.name).all()


@router.get("/categories/list", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(models.FoodItem.category).distinct().all()
    return [r[0] for r in rows]


@router.get("/catalog", response_model=List[schemas.FoodItemCreate])
def list_food_catalog():
    return FOOD_CATALOG


@router.get("/{item_id}", response_model=schemas.FoodItemOut)
def get_food_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.FoodItem).filter(models.FoodItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    return item


@router.post("", response_model=schemas.FoodItemOut, status_code=201, dependencies=[Depends(require_admin)])
def create_food_item(payload: schemas.FoodItemCreate, db: Session = Depends(get_db)):
    item_data = payload.model_dump()
    item_data["is_available"] = item_data.get("is_available", True) and (item_data.get("stock_quantity", 0) > 0)
    item = models.FoodItem(**item_data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=schemas.FoodItemOut, dependencies=[Depends(require_admin)])
def update_food_item(item_id: int, payload: schemas.FoodItemUpdate, db: Session = Depends(get_db)):
    item = db.query(models.FoodItem).filter(models.FoodItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    if item.stock_quantity is not None:
        item.is_available = item.is_available and item.stock_quantity > 0

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_food_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.FoodItem).filter(models.FoodItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")

    has_past_orders = db.query(models.OrderItem).filter(models.OrderItem.food_item_id == item_id).first()
    if has_past_orders:
        # Keep order history intact: hide it from the menu instead of deleting it outright.
        item.is_available = False
        item.stock_quantity = 0
        db.commit()
        raise HTTPException(
            status_code=409,
            detail="This item has past orders and can't be deleted, so it was marked unavailable instead.",
        )

    db.delete(item)
    db.commit()
    return None