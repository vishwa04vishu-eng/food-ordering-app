# Food Ordering Management System

Full-stack app: **React (Vite)** + **FastAPI** + **MySQL**.

## Folder structure

```
food-ordering-app/
├── backend/          FastAPI + SQLAlchemy + MySQL
│   ├── main.py         app entrypoint, CORS, router registration
│   ├── database.py     SQLAlchemy engine/session (reads .env)
│   ├── models.py       ORM tables: User, FoodItem, Cart, CartItem, Order, OrderItem
│   ├── schemas.py       Pydantic request/response validation
│   ├── auth.py          password hashing, JWT, role-based dependencies
│   ├── seed.py           creates a demo admin + customer + sample menu
│   ├── schema.sql        raw MySQL DDL (optional, tables also auto-create)
│   └── routers/          one file per feature area (auth, food, cart, orders, admin)
└── frontend/          React app (Vite)
    └── src/
        ├── api.js               axios instance, auto-attaches JWT
        ├── context/AuthContext.jsx   shares "who's logged in" app-wide
        ├── components/           Navbar, ProtectedRoute
        └── pages/                Login, Register, Menu, Cart, MyOrders, AdminDashboard
```

## 1. Set up MySQL

```sql
CREATE DATABASE food_ordering_db;
```
(Tables are created automatically on first backend run — `schema.sql` is there too if you want to run it by hand.)

## 2. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit .env with your MySQL password
python seed.py                  # creates demo accounts + sample menu
uvicorn main:app --reload       # http://localhost:8000, docs at /docs
```

Demo logins after seeding:
- Admin: `admin@food.com` / `admin123`
- Customer: `customer@food.com` / `customer123`

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

## How the pieces connect

1. React calls the FastAPI backend at `http://localhost:8000` via `axios` (see `frontend/src/api.js`).
2. FastAPI validates requests with Pydantic (`schemas.py`), talks to MySQL through SQLAlchemy ORM (`models.py`), and returns JSON.
3. Login returns a JWT. The frontend stores it in `localStorage` and `api.js` attaches it as `Authorization: Bearer <token>` on every request after that.
4. `auth.py`'s `get_current_user` decodes that token on the backend to identify who's calling; `require_admin` blocks non-admins from admin routes — that's the role-based access control, enforced server-side (the frontend's `ProtectedRoute` just hides links/pages for a good UX, it isn't the real security boundary).

## Database relationships

- `users` 1 → M `orders`
- `users` 1 → 1 `carts` → M `cart_items` → 1 `food_items`
- `orders` 1 → M `order_items` → 1 `food_items`
- `order_items.price_at_order` snapshots the price at purchase time, so later price changes to a food item don't rewrite order history.

---

## If you're presenting this in an interview

Since you mentioned you're newer to React, here's what's worth being able to explain in your own words — these are exactly the questions a recruiter is likely to ask:

- **"Walk me through what happens when a customer places an order."** → Menu.jsx calls `POST /cart/items` → Cart.jsx calls `POST /orders` → the backend copies cart lines into a new `Order` + `OrderItem` rows, snapshotting the price, then empties the cart.
- **"How does the app know if someone's an admin?"** → JWT contains the user id; backend looks up their `role` column and `require_admin` (a FastAPI dependency) rejects the request with 403 if they're not an admin. Point out this is enforced *server-side*, not just by hiding UI buttons.
- **"Why separate `models.py` and `schemas.py`?"** → one defines the database table shape (SQLAlchemy), the other defines what's allowed in/out over the API (Pydantic) — keeps validation rules separate from storage.
- **"How would you scale the cart logic?"** → currently it's one cart row per user with cart_items; could add Redis for guest carts before login, etc.
- **What you'd improve with more time**: pagination on menu/orders, image upload instead of URL field, order cancellation, email confirmations, refresh tokens, unit tests.

Being able to answer *why* something is built the way it is will matter more than any single feature — that's usually the real test.
