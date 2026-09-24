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

sample_items = [
    ("Margherita Pizza", "Classic cheese and tomato pizza", "Pizza", 249.00),
    ("Pepperoni Pizza", "Loaded with pepperoni", "Pizza", 299.00),
    ("Veg Burger", "Crispy veg patty burger", "Burgers", 129.00),
    ("Chicken Burger", "Grilled chicken burger", "Burgers", 159.00),
    ("Butter Chicken", "Creamy tomato chicken curry", "Main Course", 259.00),
    ("Paneer Tikka", "Grilled cottage cheese skewers", "Starters", 199.00),
    ("Cold Coffee", "Chilled coffee with ice cream", "Beverages", 99.00),
    ("Chocolate Brownie", "Warm brownie with fudge", "Desserts", 129.00),
]

if db.query(models.FoodItem).count() == 0:
    for name, desc, cat, price in sample_items:
        db.add(models.FoodItem(name=name, description=desc, category=cat, price=price))
    print(f"Added {len(sample_items)} sample food items")

db.commit()
db.close()
print("Seeding complete.")
