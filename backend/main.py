from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import auth_routes, food_routes, cart_routes, order_routes, admin_routes

# Creates tables automatically if they don't exist yet (handy for local dev;
# schema.sql is there if you'd rather run the DDL yourself / use migrations later).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Food Ordering Management System API",
    description="REST API for a food ordering app: auth, menu, cart, orders, admin dashboard.",
    version="1.0.0",
)

# Allow the React dev server (Vite default port 5173) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+|https://food-ordering-app-nine-pi\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(food_routes.router)
app.include_router(cart_routes.router)
app.include_router(order_routes.router)
app.include_router(admin_routes.router)


@app.get("/")
def root():
    return {"message": "Food Ordering API is running. See /docs for API documentation."}
