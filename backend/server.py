from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Request, Response, Query, Header, Cookie, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from supabase import create_async_client, AsyncClient
import os
import logging
import requests
import base64
import io
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from storage import init_storage, put_object, get_object, APP_NAME, MIME_BY_EXT

supabase_url = os.environ.get("SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_KEY", "")
supabase: AsyncClient = None

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "").lower()
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

app = FastAPI(title="Aiel Design & Printing Studio API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aiel")

# Enable CORS for all origins (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client on startup
@app.on_event("startup")
async def init_supabase_client() -> None:
    """Create the Supabase async client when the FastAPI app starts."""
    global supabase
    raw_url = os.getenv("SUPABASE_URL")
    raw_key = os.getenv("SUPABASE_KEY")
    # Trim whitespace that can cause auth failures
    url = raw_url.strip() if raw_url else ""
    key = raw_key.strip() if raw_key else ""
    if not url or not key:
        logger.error("Supabase URL or KEY not set in environment; Supabase client will be unavailable.")
        supabase = None
        return
    # Debug log – mask the actual key value
    logger.debug(f"Supabase URL: {url}, key length: {len(key)}")
    try:
        supabase = await create_async_client(url, key)
        logger.info("Supabase client initialized successfully.")
    except Exception as e:
        logger.exception(f"Failed to initialize Supabase client: {e}")
        supabase = None

# ----------- HELPERS -----------
def now_utc():
    return datetime.now(timezone.utc)


def doc_dt_to_iso(d):
    for k, v in list(d.items()):
        if isinstance(v, datetime):
            d[k] = v.isoformat()
    return d


# ----------- MODELS -----------
class CartLine(BaseModel):
    product_id: str
    product_name: str
    size: str
    color: str
    quantity: int
    print_area: str
    unit_price: float
    notes: Optional[str] = ""
    artwork_url: Optional[str] = ""


class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = ""
    delivery_address: Optional[str] = ""
    items: List[CartLine]
    total_amount: float
    channel: str = "whatsapp"


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = ""
    delivery_address: Optional[str] = ""
    items: List[CartLine]
    total_amount: float
    channel: str = "whatsapp"
    status: str = "pending"
    created_at: datetime = Field(default_factory=now_utc)


class ContactCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    message: str
    order_type: Optional[str] = "general"


class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = ""
    message: str
    order_type: str = "general"
    created_at: datetime = Field(default_factory=now_utc)


class Product(BaseModel):
    id: str
    name: str
    tagline: Optional[str] = ""
    fabric: str
    description: str
    colors: List[str]
    color_hex: Dict[str, str] = {}
    sizes: List[str]
    price_min: float
    price_max: float
    image: str
    gallery: List[str] = []
    is_active: bool = True


class GalleryItem(BaseModel):
    id: str = Field(default_factory=lambda: f"g_{uuid.uuid4().hex[:8]}")
    category: str
    title: str
    image: str


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = ""
    is_admin: bool = False


class GenerateMockupReq(BaseModel):
    product_id: str
    prompt: str


# ----------- SEED -----------
SEED_PRODUCTS = [
    {
        "id": "regular-round-neck",
        "name": "Regular Round Neck",
        "tagline": "Best Seller",
        "fabric": "180 GSM Bio-Washed Cotton",
        "description": "Soft, breathable, and built for everyday comfort. The classic round neck that never goes out of style.",
        "colors": ["Black", "White", "Navy", "Maroon", "Olive Green"],
        "color_hex": {"Black": "#0A0A0A", "White": "#F5F5F5", "Navy": "#0B1F3F", "Maroon": "#5C0A1A", "Olive Green": "#556B2F"},
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "price_min": 299,
        "price_max": 499,
        "image": "https://images.unsplash.com/photo-1610502778270-c5c6f4c7d575?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "gallery": [],
        "is_active": True,
    },
    {
        "id": "oversized-tshirt",
        "name": "Oversized T-Shirt",
        "tagline": "Street Style",
        "fabric": "220–240 GSM • Drop Shoulder",
        "description": "Heavy-weight oversized fit with drop shoulder cut. Premium street fashion staple.",
        "colors": ["Beige", "Lavender", "Coffee Brown", "Black"],
        "color_hex": {"Beige": "#D7C4A3", "Lavender": "#B7A8D6", "Coffee Brown": "#4B2E1F", "Black": "#0A0A0A"},
        "sizes": ["M", "L", "XL", "XXL"],
        "price_min": 599,
        "price_max": 999,
        "image": "https://images.unsplash.com/photo-1627225925683-1da7021732ea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "gallery": [],
        "is_active": True,
    },
    {
        "id": "premium-polo",
        "name": "Premium Polo T-Shirt",
        "tagline": "Corporate & School",
        "fabric": "220 GSM • Honeycomb Pique",
        "description": "Crisp collared polo, perfect for corporate gifting, school uniforms and team identity.",
        "colors": ["Black", "White", "Navy", "Sky Blue", "Red"],
        "color_hex": {"Black": "#0A0A0A", "White": "#F5F5F5", "Navy": "#0B1F3F", "Sky Blue": "#7EC8E3", "Red": "#B22222"},
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "price_min": 499,
        "price_max": 899,
        "image": "https://images.unsplash.com/photo-1625910513413-c23b8bb81cba?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "gallery": [],
        "is_active": True,
    },
    {
        "id": "dry-fit-sports",
        "name": "Dry-Fit Sports T-Shirt",
        "tagline": "Team Uniforms",
        "fabric": "Polyester • Quick-Dry Mesh",
        "description": "Moisture-wicking polyester built for the field. The go-to for sports teams and active wear.",
        "colors": ["Black", "White", "Royal Blue", "Red", "Yellow"],
        "color_hex": {"Black": "#0A0A0A", "White": "#F5F5F5", "Royal Blue": "#1E40AF", "Red": "#B22222", "Yellow": "#FFC400"},
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "price_min": 250,
        "price_max": 450,
        "image": "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "gallery": [],
        "is_active": True,
    },
]

SEED_GALLERY = [
    {"id": "g1", "category": "T-Shirts", "title": "Custom Brand Tee", "image": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"},
    {"id": "g2", "category": "T-Shirts", "title": "Oversized Drop", "image": "https://images.unsplash.com/photo-1627225925683-1da7021732ea?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"},
    {"id": "g3", "category": "T-Shirts", "title": "Round Neck Classic", "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"},
    {"id": "g4", "category": "T-Shirts", "title": "Sports Dry-Fit", "image": "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"},
    {"id": "g5", "category": "Mugs", "title": "Photo Mug", "image": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"},
    {"id": "g6", "category": "Mugs", "title": "Magic Color Mug", "image": "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"},
    {"id": "g7", "category": "Caps", "title": "Embroidered Cap", "image": "https://images.unsplash.com/photo-1521369909029-2afed882baee?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"},
    {"id": "g8", "category": "Caps", "title": "Snapback", "image": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"},
    {"id": "g9", "category": "Keychains", "title": "Acrylic Keychain", "image": "https://images.unsplash.com/photo-1622560481156-01fc9b3b1afa?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"},
    {"id": "g10", "category": "Bags", "title": "Tote Bag", "image": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"},
    {"id": "g11", "category": "Bags", "title": "Canvas Print Bag", "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"},
    {"id": "g12", "category": "Corporate Gifts", "title": "Corporate Combo", "image": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"},
]


async def seed_db():
    if not supabase: return
    try:
        p_res = await supabase.table("products").select("id", count="exact").limit(1).execute()
        if p_res.count == 0:
            await supabase.table("products").insert([{**p} for p in SEED_PRODUCTS]).execute()
            logger.info("Seeded %d products", len(SEED_PRODUCTS))
            
        g_res = await supabase.table("gallery").select("id", count="exact").limit(1).execute()
        if g_res.count == 0:
            await supabase.table("gallery").insert([{**g} for g in SEED_GALLERY]).execute()
            logger.info("Seeded %d gallery items", len(SEED_GALLERY))
    except Exception as e:
        logger.warning(f"Seed DB failed (check if tables exist): {e}")


# ----------- AUTH -----------
async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
) -> Optional[User]:
    if not supabase: return None
    token = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(None, 1)[1].strip()
    if not token:
        return None
        
    sess_res = await supabase.table("user_sessions").select("*").eq("session_token", token).execute()
    sess = sess_res.data[0] if sess_res.data else None
    if not sess:
        return None
        
    expires_at = sess.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < now_utc():
        return None
        
    user_res = await supabase.table("users").select("*").eq("user_id", sess["user_id"]).execute()
    user = user_res.data[0] if user_res.data else None
    if not user:
        return None
    return User(**user)


async def require_user(user: Optional[User] = Depends(get_current_user)) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def require_admin(user: User = Depends(require_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return user


@api_router.post("/auth/session")
async def auth_session(payload: Dict[str, str], response: Response):
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
        
    # exchange session_id with Emergent
    r = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": session_id},
        timeout=20,
    )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()
    email = (data.get("email") or "").lower()
    name = data.get("name") or "Aiel User"
    picture = data.get("picture") or ""
    session_token = data.get("session_token")
    if not session_token:
        raise HTTPException(status_code=500, detail="Missing session_token")

    is_admin = bool(ADMIN_EMAIL) and email == ADMIN_EMAIL

    existing_res = await supabase.table("users").select("*").eq("email", email).execute()
    existing = existing_res.data[0] if existing_res.data else None
    
    if existing:
        user_id = existing["user_id"]
        supabase.table("users").update(
            {"name": name, "picture": picture, "is_admin": is_admin}
        ).eq("user_id", user_id).execute()
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        supabase.table("users").insert({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "is_admin": is_admin,
            "created_at": now_utc().isoformat(),
        }).execute()

    expires_at = now_utc() + timedelta(days=7)
    supabase.table("user_sessions").upsert({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at.isoformat(),
        "created_at": now_utc().isoformat(),
    }).execute()

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 3600,
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
    )
    return {"user_id": user_id, "email": email, "name": name, "picture": picture, "is_admin": is_admin}


@api_router.get("/auth/me")
async def auth_me(user: User = Depends(require_user)):
    return user.model_dump()


@api_router.post("/auth/logout")
async def auth_logout(
    response: Response,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
):
    token = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(None, 1)[1].strip()
    if token and supabase:
        await supabase.table("user_sessions").delete().eq("session_token", token).execute()
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ----------- PUBLIC ROUTES -----------
@api_router.get("/")
async def root():
    return {"message": "Aiel Design & Printing Studio API"}


@api_router.get("/products")
async def list_products():
    if not supabase:
        logger.warning("list_products: supabase client is None!")
        return []
    try:
        res = await supabase.table("products").select("*").eq("is_active", True).execute()
        logger.info("list_products: returned %d items", len(res.data))
        return res.data
    except Exception as e:
        logger.exception("list_products failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    res = await supabase.table("products").select("*").eq("id", product_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return res.data[0]


@api_router.get("/gallery")
async def list_gallery(category: Optional[str] = None):
    if not supabase: return []
    query = supabase.table("gallery").select("*")
    if category and category.lower() != "all":
        query = query.eq("category", category)
    res = await query.execute()
    return res.data


@api_router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    order = Order(**payload.model_dump())
    doc = doc_dt_to_iso(order.model_dump())
    await supabase.table("orders").insert(doc).execute()
    return order


class TrackRequest(BaseModel):
    order_id: str
    phone: str


def _normalize_phone(p: str) -> str:
    return "".join(ch for ch in (p or "") if ch.isdigit())[-10:]


@api_router.post("/orders/track")
async def track_order(req: TrackRequest):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    raw_id = (req.order_id or "").strip()
    if not raw_id:
        raise HTTPException(status_code=400, detail="Order ID required")
    norm_phone = _normalize_phone(req.phone)
    if len(norm_phone) < 10:
        raise HTTPException(status_code=400, detail="Phone must be 10 digits")

    candidates = []
    full_res = await supabase.table("orders").select("*").eq("id", raw_id).execute()
    if full_res.data:
        candidates.append(full_res.data[0])
    else:
        prefix = raw_id.lower()
        partial_res = await supabase.table("orders").select("*").ilike("id", f"{prefix}%").limit(5).execute()
        candidates.extend(partial_res.data)

    for o in candidates:
        if _normalize_phone(o.get("customer_phone", "")) == norm_phone:
            return {
                "id": o["id"],
                "short_id": o["id"][:6].upper(),
                "customer_name": o.get("customer_name"),
                "customer_phone": o.get("customer_phone"),
                "items": o.get("items", []),
                "total_amount": o.get("total_amount", 0),
                "status": o.get("status", "pending"),
                "status_history": o.get("status_history", []),
                "created_at": o.get("created_at"),
                "updated_at": o.get("updated_at"),
            }

    raise HTTPException(status_code=404, detail="Order not found. Check your ID and phone.")


@api_router.post("/contact", response_model=Contact)
async def create_contact(payload: ContactCreate):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    c = Contact(**payload.model_dump())
    doc = doc_dt_to_iso(c.model_dump())
    await supabase.table("contacts").insert(doc).execute()
    return c


# ----------- UPLOADS -----------
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), folder: str = Form("artwork")):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    data = await file.read()
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (25 MB max)")
    ext = (file.filename or "bin").rsplit(".", 1)[-1].lower()
    content_type = file.content_type or MIME_BY_EXT.get(ext, "application/octet-stream")
    fid = uuid.uuid4().hex
    path = f"{APP_NAME}/{folder}/{fid}.{ext}"
    try:
        result = put_object(path, data, content_type)
    except Exception as e:
        logger.exception("upload failed")
        raise HTTPException(status_code=502, detail=f"Storage error: {e}")
    rec = {
        "id": fid,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "folder": folder,
        "is_deleted": False,
        "created_at": now_utc().isoformat(),
    }
    await supabase.table("files").insert(rec).execute()
    backend_origin = os.environ.get("PUBLIC_BACKEND_URL", "")
    url = f"/api/files/{fid}"
    return {"id": fid, "url": url, "absolute_url": (backend_origin + url) if backend_origin else url, "content_type": content_type, "size": rec["size"]}


@api_router.get("/files/{file_id}")
async def serve_file(file_id: str):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    res = await supabase.table("files").select("*").eq("id", file_id).eq("is_deleted", False).execute()
    rec = res.data[0] if res.data else None
    if not rec:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        data, ct = get_object(rec["storage_path"])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Storage error: {e}")
    return Response(content=data, media_type=rec.get("content_type") or ct, headers={"Cache-Control": "public, max-age=86400"})


# ----------- ADMIN ROUTES -----------
admin = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])


@admin.post("/products")
async def admin_create_product(p: Product):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    res = await supabase.table("products").select("id").eq("id", p.id).execute()
    if res.data:
        raise HTTPException(status_code=409, detail="Product id already exists")
    await supabase.table("products").insert(p.model_dump()).execute()
    return p


@admin.put("/products/{product_id}")
async def admin_update_product(product_id: str, p: Product):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    res = await supabase.table("products").update(p.model_dump()).eq("id", product_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return p


@admin.delete("/products/{product_id}")
async def admin_delete_product(product_id: str):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    res = await supabase.table("products").delete().eq("id", product_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@admin.post("/gallery")
async def admin_create_gallery(item: GalleryItem):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    await supabase.table("gallery").insert(item.model_dump()).execute()
    return item


@admin.put("/gallery/{item_id}")
async def admin_update_gallery(item_id: str, item: GalleryItem):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    res = await supabase.table("gallery").update(item.model_dump()).eq("id", item_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@admin.delete("/gallery/{item_id}")
async def admin_delete_gallery(item_id: str):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    res = await supabase.table("gallery").delete().eq("id", item_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


ALLOWED_STATUSES = ["pending", "in_print", "shipped", "delivered", "cancelled"]


class OrderStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = ""


@admin.get("/orders")
async def admin_orders():
    if not supabase: return []
    res = await supabase.table("orders").select("*").order("created_at", desc=True).limit(500).execute()
    return res.data


@admin.patch("/orders/{order_id}/status")
async def admin_update_order_status(order_id: str, body: OrderStatusUpdate, user: User = Depends(require_admin)):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    if body.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {ALLOWED_STATUSES}")
    
    order_res = await supabase.table("orders").select("*").eq("id", order_id).execute()
    order = order_res.data[0] if order_res.data else None
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    prev_status = order.get("status", "pending")
    entry = {
        "status": body.status,
        "note": body.note or "",
        "by": user.email,
        "at": now_utc().isoformat(),
    }
    history = order.get("status_history", [])
    history.append(entry)
    
    supabase.table("orders").update({
        "status": body.status, 
        "status_history": history, 
        "updated_at": now_utc().isoformat()
    }).eq("id", order_id).execute()
    
    updated_res = await supabase.table("orders").select("*").eq("id", order_id).execute()
    updated = updated_res.data[0]

    # Auto-send invoice email on shipped transition
    email_status = "skipped"
    if body.status == "shipped" and prev_status != "shipped":
        customer_email = (updated.get("customer_email") or "").strip()
        if not customer_email:
            email_status = "no_email"
        else:
            try:
                from invoice import generate_invoice_pdf
                from email_sender import send_shipping_email, _configured
                if not _configured():
                    email_status = "not_configured"
                else:
                    pdf_bytes = generate_invoice_pdf(updated)
                    eid = await send_shipping_email(customer_email, updated, pdf_bytes)
                    email_status = "sent" if eid else "failed"
                    if eid:
                        supabase.table("orders").update({
                            "invoice_email_id": eid, 
                            "invoice_email_to": customer_email, 
                            "invoice_email_at": now_utc().isoformat()
                        }).eq("id", order_id).execute()
                        updated["invoice_email_id"] = eid
                        updated["invoice_email_to"] = customer_email
            except Exception as e:
                logger.exception("Invoice email failed: %s", e)
                email_status = "error"
    updated["email_status"] = email_status
    return updated


@admin.get("/contacts")
async def admin_contacts():
    if not supabase: return []
    res = await supabase.table("contacts").select("*").order("created_at", desc=True).limit(500).execute()
    return res.data


@admin.post("/generate-mockup")
async def admin_generate_mockup(req: GenerateMockupReq):
    """Use Gemini Nano Banana to create a product mockup and store it."""
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"emergentintegrations missing: {e}")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"mockup-{req.product_id}-{uuid.uuid4().hex[:6]}",
        system_message="You are an apparel product photographer creating studio-grade t-shirt mockup images."
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    msg = UserMessage(text=req.prompt)
    try:
        text, images = await chat.send_message_multimodal_response(msg)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Image generation failed: {e}")
    if not images:
        raise HTTPException(status_code=502, detail="No image returned")

    img = images[0]
    img_bytes = base64.b64decode(img["data"])
    mime = img.get("mime_type") or "image/png"
    ext = "png" if mime == "image/png" else "jpg"
    fid = uuid.uuid4().hex
    path = f"{APP_NAME}/mockups/{req.product_id}/{fid}.{ext}"
    try:
        result = put_object(path, img_bytes, mime)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Storage error: {e}")

    rec = {
        "id": fid,
        "storage_path": result["path"],
        "original_filename": f"{req.product_id}.{ext}",
        "content_type": mime,
        "size": result.get("size", len(img_bytes)),
        "folder": "mockups",
        "is_deleted": False,
        "created_at": now_utc().isoformat(),
    }
    await supabase.table("files").insert(rec).execute()
    return {"id": fid, "url": f"/api/files/{fid}", "content_type": mime, "size": rec["size"]}


api_router.include_router(admin)


# ----------- INVOICE -----------
def _phone_matches(order: dict, phone: str) -> bool:
    return _normalize_phone(order.get("customer_phone", "")) == _normalize_phone(phone or "")


async def _find_order(order_id: str):
    if not supabase: return None
    res = await supabase.table("orders").select("*").eq("id", order_id).execute()
    if res.data:
        return res.data[0]
    
    prefix = order_id.lower()
    partial_res = await supabase.table("orders").select("*").ilike("id", f"{prefix}%").limit(1).execute()
    if partial_res.data:
        return partial_res.data[0]
    return None


@api_router.get("/orders/{order_id}/invoice.pdf")
async def public_invoice(order_id: str, phone: str = Query(...)):
    o = await _find_order(order_id)
    if not o or not _phone_matches(o, phone):
        raise HTTPException(status_code=404, detail="Order not found")
    from invoice import generate_invoice_pdf
    pdf = generate_invoice_pdf(o)
    short = o["id"][:6].upper()
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=Aiel-Invoice-{short}.pdf"},
    )


# Admin-only invoice + reviews list (registered directly on api_router with require_admin dep)
@api_router.get("/admin/orders/{order_id}/invoice.pdf", dependencies=[Depends(require_admin)])
async def admin_invoice(order_id: str):
    o = await _find_order(order_id)
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    from invoice import generate_invoice_pdf
    pdf = generate_invoice_pdf(o)
    short = o["id"][:6].upper()
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Aiel-Invoice-{short}.pdf"},
    )


@api_router.get("/admin/reviews", dependencies=[Depends(require_admin)])
async def admin_reviews():
    if not supabase: return []
    res = await supabase.table("reviews").select("*").order("created_at", desc=True).limit(500).execute()
    return res.data


class ManualEmailRequest(BaseModel):
    to: Optional[str] = ""  # override; otherwise uses order.customer_email


@api_router.post("/admin/orders/{order_id}/email-invoice", dependencies=[Depends(require_admin)])
async def admin_email_invoice(order_id: str, body: ManualEmailRequest):
    o = await _find_order(order_id)
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    target = (body.to or o.get("customer_email") or "").strip()
    if not target:
        raise HTTPException(status_code=400, detail="No recipient email. Provide 'to' or save customer_email on the order.")
    from invoice import generate_invoice_pdf
    from email_sender import send_shipping_email, _configured
    if not _configured():
        raise HTTPException(status_code=503, detail="Email not configured. Set RESEND_API_KEY in backend/.env")
    pdf_bytes = generate_invoice_pdf(o)
    eid = await send_shipping_email(target, o, pdf_bytes)
    if not eid:
        raise HTTPException(status_code=502, detail="Email send failed")
    
    if supabase:
        supabase.table("orders").update({
            "invoice_email_id": eid, 
            "invoice_email_to": target, 
            "invoice_email_at": now_utc().isoformat()
        }).eq("id", o["id"]).execute()
    return {"ok": True, "id": eid, "to": target}


# ----------- REVIEWS (PUBLIC) -----------
class ReviewCreate(BaseModel):
    order_id: str
    phone: str
    rating: int = Field(ge=1, le=5)
    text: str = ""
    photo_url: Optional[str] = ""
    allow_showcase: bool = True


@api_router.post("/reviews")
async def submit_review(payload: ReviewCreate):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    o = await _find_order(payload.order_id)
    if not o or not _phone_matches(o, payload.phone):
        raise HTTPException(status_code=404, detail="Order not found")
    rec = {
        "id": f"rev_{uuid.uuid4().hex[:10]}",
        "order_id": o["id"],
        "short_id": o["id"][:6].upper(),
        "customer_name": o.get("customer_name", ""),
        "rating": payload.rating,
        "text": payload.text.strip(),
        "photo_url": payload.photo_url or "",
        "allow_showcase": payload.allow_showcase,
        "created_at": now_utc().isoformat(),
    }
    await supabase.table("reviews").insert(rec).execute()
    return {"ok": True, "id": rec["id"]}


@api_router.get("/reviews/public")
async def public_reviews(limit: int = 20):
    if not supabase: return []
    res = await supabase.table("reviews").select("*").eq("allow_showcase", True).gte("rating", 4).order("created_at", desc=True).limit(limit).execute()
    return res.data


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    global supabase
    if supabase_url and supabase_key:
        supabase = await create_async_client(supabase_url, supabase_key)
    await seed_db()
    try:
        init_storage()
    except Exception as e:
        logger.warning("Storage init failed at startup: %s", e)


@app.on_event("shutdown")
async def shutdown_db_client():
    pass
