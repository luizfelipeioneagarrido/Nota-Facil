from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from pymongo import ReturnDocument

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ['JWT_SECRET']

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ------------- Helpers -------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, "email": email, "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ------------- Models -------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4)
    name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ProductIn(BaseModel):
    name: str
    description: Optional[str] = ""
    stock: int = 0
    price_blue: float = 0
    price_green: float = 0
    price_yellow: float = 0
    price_red: float = 0

class Product(ProductIn):
    id: str
    created_at: str

class CustomerIn(BaseModel):
    name: str
    address: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    account_balance: float = 0

class Customer(CustomerIn):
    id: str
    created_at: str

class NoteItemIn(BaseModel):
    product_id: str
    product_name: str
    quantity: float
    unit_price: float
    tier: Literal["blue", "green", "yellow", "red"]

class NoteIn(BaseModel):
    customer_id: Optional[str] = None
    customer_name: str
    customer_address: Optional[str] = ""
    customer_phone: Optional[str] = ""
    customer_account_balance: float = 0
    items: List[NoteItemIn]
    delivery_fee: float = 0
    notes: Optional[str] = ""
    status: Literal["pending", "paid", "cancelled"] = "pending"

class Note(NoteIn):
    id: str
    order_number: str
    subtotal: float
    total: float
    created_at: str
    user_id: str

# ------------- Auth Routes -------------
@api_router.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "name": payload.name,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id, email)
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="none", max_age=60*60*24*7, path="/")
    return {"id": user_id, "email": email, "name": payload.name, "token": token}

@api_router.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    token = create_access_token(user["id"], email)
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="none", max_age=60*60*24*7, path="/")
    return {"id": user["id"], "email": email, "name": user["name"], "token": token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

# ------------- Products -------------
@api_router.get("/products")
async def list_products(user: dict = Depends(get_current_user)):
    items = await db.products.find({"user_id": user["id"]}, {"_id": 0, "user_id": 0}).sort("name", 1).to_list(1000)
    return items

@api_router.post("/products")
async def create_product(payload: ProductIn, user: dict = Depends(get_current_user)):
    pid = str(uuid.uuid4())
    doc = {
        **payload.model_dump(),
        "id": pid,
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.products.insert_one(doc)
    doc.pop("_id", None); doc.pop("user_id", None)
    return doc

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, payload: ProductIn, user: dict = Depends(get_current_user)):
    res = await db.products.update_one(
        {"id": product_id, "user_id": user["id"]},
        {"$set": payload.model_dump()}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Produto não encontrado")
    doc = await db.products.find_one({"id": product_id}, {"_id": 0, "user_id": 0})
    return doc

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    res = await db.products.delete_one({"id": product_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Produto não encontrado")
    return {"ok": True}

# ------------- Customers -------------
@api_router.get("/customers")
async def list_customers(user: dict = Depends(get_current_user)):
    items = await db.customers.find({"user_id": user["id"]}, {"_id": 0, "user_id": 0}).sort("name", 1).to_list(1000)
    return items

@api_router.post("/customers")
async def create_customer(payload: CustomerIn, user: dict = Depends(get_current_user)):
    cid = str(uuid.uuid4())
    doc = {
        **payload.model_dump(),
        "id": cid,
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.customers.insert_one(doc)
    doc.pop("_id", None); doc.pop("user_id", None)
    return doc

@api_router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, payload: CustomerIn, user: dict = Depends(get_current_user)):
    res = await db.customers.update_one(
        {"id": customer_id, "user_id": user["id"]},
        {"$set": payload.model_dump()}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Cliente não encontrado")
    doc = await db.customers.find_one({"id": customer_id}, {"_id": 0, "user_id": 0})
    return doc

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, user: dict = Depends(get_current_user)):
    res = await db.customers.delete_one({"id": customer_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Cliente não encontrado")
    return {"ok": True}

# ------------- Notes -------------
async def generate_order_number(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    date_prefix = now.strftime("%d%m%y")
    counter_id = f"{user_id}_{date_prefix}"

    # Find max existing seq for today (handles legacy data and ensures uniqueness)
    max_existing = 0
    cursor = db.notes.find(
        {"user_id": user_id, "order_number": {"$regex": f"^{date_prefix}"}},
        {"order_number": 1, "_id": 0},
    ).sort("order_number", -1).limit(1)
    docs = await cursor.to_list(1)
    if docs:
        try:
            max_existing = int(docs[0]["order_number"][6:])
        except (ValueError, IndexError):
            max_existing = 0

    # Atomically: seq = max(current_seq, max_existing) + 1
    res = await db.counters.find_one_and_update(
        {"_id": counter_id},
        [
            {"$set": {
                "seq": {
                    "$add": [
                        {"$max": [{"$ifNull": ["$seq", 0]}, max_existing]},
                        1,
                    ]
                }
            }}
        ],
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    seq = res["seq"]
    return f"{date_prefix}{seq:02d}"

def aggregate_items_by_product(items):
    agg = {}
    for it in items:
        pid = it.get("product_id") if isinstance(it, dict) else it.product_id
        qty = it.get("quantity") if isinstance(it, dict) else it.quantity
        if not pid:
            continue
        agg[pid] = agg.get(pid, 0) + (qty or 0)
    return agg

async def adjust_stock(user_id: str, deltas: dict):
    """deltas: {product_id: qty_to_subtract_from_stock} (positive=decrement, negative=restore)"""
    for pid, delta in deltas.items():
        if not delta:
            continue
        await db.products.update_one(
            {"id": pid, "user_id": user_id},
            {"$inc": {"stock": -delta}},
        )

def calc_totals(items: List[NoteItemIn], delivery_fee: float):
    subtotal = sum(i.quantity * i.unit_price for i in items)
    return subtotal, subtotal + (delivery_fee or 0)

@api_router.get("/notes")
async def list_notes(
    status: Optional[str] = None,
    period: str = "all",
    customer_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    query = {"user_id": user["id"]}
    if status and status in ("pending", "paid", "cancelled"):
        query["status"] = status
    if customer_id:
        query["customer_id"] = customer_id
    items = await db.notes.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)

    if period != "all":
        today_dt = datetime.now(timezone.utc).date()
        start = None
        if period == "today":
            start = today_dt
        elif period == "week":
            start = today_dt - timedelta(days=6)
        elif period == "month":
            start = today_dt - timedelta(days=29)
        elif period == "year":
            start = today_dt.replace(month=1, day=1)
        if start is not None:
            def _in(n):
                try:
                    return datetime.fromisoformat(n["created_at"]).date() >= start
                except Exception:
                    return False
            items = [n for n in items if _in(n)]
    return items

@api_router.get("/notes/{note_id}")
async def get_note(note_id: str, user: dict = Depends(get_current_user)):
    doc = await db.notes.find_one({"id": note_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Nota não encontrada")
    return doc

@api_router.post("/notes")
async def create_note(payload: NoteIn, user: dict = Depends(get_current_user)):
    nid = str(uuid.uuid4())
    order_number = await generate_order_number(user["id"])
    subtotal, total = calc_totals(payload.items, payload.delivery_fee)
    doc = {
        **payload.model_dump(),
        "id": nid,
        "order_number": order_number,
        "subtotal": subtotal,
        "total": total,
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.notes.insert_one(doc)
    # Decrement stock for each item
    deltas = aggregate_items_by_product(payload.items)
    await adjust_stock(user["id"], deltas)
    doc.pop("_id", None)
    return doc

@api_router.put("/notes/{note_id}")
async def update_note(note_id: str, payload: NoteIn, user: dict = Depends(get_current_user)):
    existing = await db.notes.find_one({"id": note_id, "user_id": user["id"]})
    if not existing:
        raise HTTPException(404, "Nota não encontrada")
    subtotal, total = calc_totals(payload.items, payload.delivery_fee)
    update = {**payload.model_dump(), "subtotal": subtotal, "total": total}
    await db.notes.update_one({"id": note_id, "user_id": user["id"]}, {"$set": update})
    # Adjust stock by delta (new - old)
    old_agg = aggregate_items_by_product(existing.get("items", []))
    new_agg = aggregate_items_by_product(payload.items)
    deltas = {}
    for pid in set(list(old_agg.keys()) + list(new_agg.keys())):
        deltas[pid] = new_agg.get(pid, 0) - old_agg.get(pid, 0)
    await adjust_stock(user["id"], deltas)
    doc = await db.notes.find_one({"id": note_id}, {"_id": 0})
    return doc

@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str, user: dict = Depends(get_current_user)):
    existing = await db.notes.find_one({"id": note_id, "user_id": user["id"]})
    if not existing:
        raise HTTPException(404, "Nota não encontrada")
    await db.notes.delete_one({"id": note_id, "user_id": user["id"]})
    # Restore stock
    deltas = {pid: -qty for pid, qty in aggregate_items_by_product(existing.get("items", [])).items()}
    await adjust_stock(user["id"], deltas)
    return {"ok": True}

# ------------- Customer History -------------
@api_router.get("/customers/{customer_id}/history")
async def customer_history(customer_id: str, user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one(
        {"id": customer_id, "user_id": user["id"]}, {"_id": 0, "user_id": 0}
    )
    if not customer:
        raise HTTPException(404, "Cliente não encontrado")
    notes = await db.notes.find(
        {"user_id": user["id"], "customer_id": customer_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    total_paid = sum(n.get("total", 0) for n in notes if n.get("status") == "paid")
    total_pending = sum(n.get("total", 0) for n in notes if n.get("status") == "pending")
    total_cancelled = sum(n.get("total", 0) for n in notes if n.get("status") == "cancelled")
    account_balance = customer.get("account_balance", 0)
    return {
        "customer": customer,
        "notes": notes,
        "stats": {
            "total_notes": len(notes),
            "total_paid": total_paid,
            "total_pending": total_pending,
            "total_cancelled": total_cancelled,
            "account_balance": account_balance,
            "total_open": total_pending + account_balance,
        },
    }

# ------------- Dashboard -------------
@api_router.get("/dashboard/stats")
async def dashboard_stats(period: str = "all", user: dict = Depends(get_current_user)):
    today_dt = datetime.now(timezone.utc).date()
    today_str = today_dt.strftime("%Y-%m-%d")
    all_notes = await db.notes.find({"user_id": user["id"]}, {"_id": 0}).to_list(10000)

    # Determine period start
    if period == "day":
        start_dt = today_dt
    elif period == "week":
        start_dt = today_dt - timedelta(days=6)
    elif period == "month":
        start_dt = today_dt - timedelta(days=29)
    elif period == "year":
        start_dt = today_dt.replace(month=1, day=1)
    else:
        start_dt = None

    def in_period(n):
        if start_dt is None:
            return True
        c = n.get("created_at", "")
        if not c:
            return False
        try:
            d = datetime.fromisoformat(c).date()
            return d >= start_dt
        except Exception:
            return False

    period_notes = [n for n in all_notes if in_period(n)]
    today_notes = [n for n in all_notes if n.get("created_at", "").startswith(today_str)]
    total_revenue = sum(n.get("total", 0) for n in period_notes if n.get("status") == "paid")
    pending = [n for n in period_notes if n.get("status") == "pending"]

    # Build chart data based on period
    daily = []
    if period == "day":
        # 24 hours
        for h in range(24):
            day_total = sum(
                n.get("total", 0) for n in all_notes
                if n.get("created_at", "").startswith(today_str)
                and datetime.fromisoformat(n["created_at"]).hour == h
            )
            daily.append({"date": f"{h:02d}h", "total": day_total})
    elif period == "year":
        for m in range(1, 13):
            month_total = sum(
                n.get("total", 0) for n in all_notes
                if n.get("created_at", "").startswith(f"{today_dt.year}-{m:02d}")
            )
            daily.append({"date": f"{m:02d}/{str(today_dt.year)[-2:]}", "total": month_total})
    else:
        # week (7 days) or month (30 days) or all (default 7 days)
        days = 30 if period == "month" else 7
        for i in range(days - 1, -1, -1):
            d = today_dt - timedelta(days=i)
            ds = d.strftime("%Y-%m-%d")
            day_total = sum(n.get("total", 0) for n in all_notes if n.get("created_at", "").startswith(ds))
            daily.append({"date": d.strftime("%d/%m"), "total": day_total})

    return {
        "today_orders": len(today_notes),
        "period_orders": len(period_notes),
        "total_revenue": total_revenue,
        "pending_count": len(pending),
        "total_notes": len(all_notes),
        "daily_revenue": daily,
    }

# ------------- Startup -------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.products.create_index("id", unique=True)
    await db.customers.create_index("id", unique=True)
    await db.notes.create_index("id", unique=True)
    await db.notes.create_index([("user_id", 1), ("order_number", 1)], unique=True)
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@notas.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_password),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )

@api_router.get("/")
async def root():
    return {"ok": True, "service": "Notas Não Fiscais API"}

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
