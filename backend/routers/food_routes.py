"""
routers/food_routes.py
------------------------
Public:            GET /food                (list + search + category filter)
                    GET /food/{id}
Admin-only:         POST   /food             (create)
                    PUT    /food/{id}        (edit)
                    DELETE /food/{id}
                    GET    /food/categories/list
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
import schemas
from database import get_db
from auth import require_admin

router = APIRouter(prefix="/food", tags=["Food Items"])


@router.get("", response_model=List[schemas.FoodItemOut])
def list_food_items(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Menu page calls this with ?search=...&category=... for live filtering."""
    query = db.query(models.FoodItem).filter(models.FoodItem.is_available == True)  # noqa: E712

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


@router.get("/{item_id}", response_model=schemas.FoodItemOut)
def get_food_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.FoodItem).filter(models.FoodItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    return item


@router.post("", response_model=schemas.FoodItemOut, status_code=201, dependencies=[Depends(require_admin)])
def create_food_item(payload: schemas.FoodItemCreate, db: Session = Depends(get_db)):
    item = models.FoodItem(**payload.model_dump())
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

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_food_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.FoodItem).filter(models.FoodItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    db.delete(item)
    db.commit()
    return None
