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