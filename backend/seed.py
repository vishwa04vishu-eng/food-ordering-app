"""
seed.py
-------
Run this once after your tables are created to get sample data to demo with:
    python seed.py

Creates:
  - an admin account: admin@food.com / admin123
  - a sample customer: customer@food.com / customer123
  - a handful of food items across a few categories
"""
from database import SessionLocal, Base, engine
import models
from auth import hash_password
from menu_catalog import FOOD_CATALOG

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if not db.query(models.User).filter(models.User.email == "admin@food.com").first():
    admin = models.User(
        name="Admin",
        email="admin@food.com",
        password_hash=hash_password("admin123"),
        role=models.RoleEnum.admin,
    )
    db.add(admin)
    db.flush()
    db.add(models.Cart(user_id=admin.id))
    print("Created admin@food.com / admin123")

if not db.query(models.User).filter(models.User.email == "customer@food.com").first():
    cust = models.User(
        name="Test Customer",
        email="customer@food.com",
        password_hash=hash_password("customer123"),
        role=models.RoleEnum.customer,
    )
    db.add(cust)
    db.flush()
    db.add(models.Cart(user_id=cust.id))
    print("Created customer@food.com / customer123")

if db.query(models.FoodItem).count() == 0:
    for item_data in FOOD_CATALOG:
        db.add(models.FoodItem(**item_data, is_available=item_data["stock_quantity"] > 0))
    print(f"Added {len(FOOD_CATALOG)} sample food items")

catalog_by_name = {item["name"]: item for item in FOOD_CATALOG}
for food_item in db.query(models.FoodItem).all():
    catalog_item = catalog_by_name.get(food_item.name)
    if catalog_item and not food_item.image_url:
        food_item.image_url = catalog_item["image_url"]

db.commit()
db.close()
print("Seeding complete.")
