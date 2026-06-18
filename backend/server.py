from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Request, Response, Query, Header, Cookie, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "").lower()
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

app = FastAPI(title="Aiel Design & Printing Studio API")
api_router = APIRouter(prefix="/api")

logger = logging.getLogger("aiel")
logging.basicConfig(level=logging.INFO)

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
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many([{**p} for p in SEED_PRODUCTS])
        logger.info("Seeded %d products", len(SEED_PRODUCTS))
    if await db.gallery.count_documents({}) == 0:
        await db.gallery.insert_many([{**g} for g in SEED_GALLERY])
        logger.info("Seeded %d gallery items", len(SEED_GALLERY))


# ----------- AUTH -----------
async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
) -> Optional[User]:
    token = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(None, 1)[1].strip()
    if not token:
        return None
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    expires_at = sess.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < now_utc():
        return None
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
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

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "is_admin": is_admin}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "is_admin": is_admin,
            "created_at": now_utc().isoformat(),
        })

    expires_at = now_utc() + timedelta(days=7)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {"$set": {
            "session_token": session_token,
            "user_id": user_id,
            "expires_at": expires_at.isoformat(),
            "created_at": now_utc().isoformat(),
        }},
        upsert=True,
    )

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
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ----------- PUBLIC ROUTES -----------
@api_router.get("/")
async def root():
    return {"message": "Aiel Design & Printing Studio API"}


@api_router.get("/products")
async def list_products():
    rows = await db.products.find({"is_active": {"$ne": False}}, {"_id": 0}).to_list(200)
    return rows


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@api_router.get("/gallery")
async def list_gallery(category: Optional[str] = None):
    q = {} if not category or category.lower() == "all" else {"category": category}
    return await db.gallery.find(q, {"_id": 0}).to_list(500)


@api_router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate):
    order = Order(**payload.model_dump())
    doc = doc_dt_to_iso(order.model_dump())
    await db.orders.insert_one(doc)
    return order


@api_router.post("/contact", response_model=Contact)
async def create_contact(payload: ContactCreate):
    c = Contact(**payload.model_dump())
    doc = doc_dt_to_iso(c.model_dump())
    await db.contacts.insert_one(doc)
    return c


# ----------- UPLOADS -----------
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), folder: str = Form("artwork")):
    """Public artwork upload for customer-submitted print files (up to 25 MB)."""
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
    await db.files.insert_one(rec)
    # Build a backend URL the frontend can use directly in <img src>
    backend_origin = os.environ.get("PUBLIC_BACKEND_URL", "")
    url = f"/api/files/{fid}"
    return {"id": fid, "url": url, "absolute_url": (backend_origin + url) if backend_origin else url, "content_type": content_type, "size": rec["size"]}


@api_router.get("/files/{file_id}")
async def serve_file(file_id: str):
    rec = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
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
    if await db.products.find_one({"id": p.id}):
        raise HTTPException(status_code=409, detail="Product id already exists")
    await db.products.insert_one(p.model_dump())
    return p


@admin.put("/products/{product_id}")
async def admin_update_product(product_id: str, p: Product):
    res = await db.products.update_one({"id": product_id}, {"$set": p.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return p


@admin.delete("/products/{product_id}")
async def admin_delete_product(product_id: str):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@admin.post("/gallery")
async def admin_create_gallery(item: GalleryItem):
    await db.gallery.insert_one(item.model_dump())
    return item


@admin.put("/gallery/{item_id}")
async def admin_update_gallery(item_id: str, item: GalleryItem):
    res = await db.gallery.update_one({"id": item_id}, {"$set": item.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@admin.delete("/gallery/{item_id}")
async def admin_delete_gallery(item_id: str):
    res = await db.gallery.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@admin.get("/orders")
async def admin_orders():
    rows = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return rows


@admin.get("/contacts")
async def admin_contacts():
    rows = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return rows


@admin.post("/generate-mockup")
async def admin_generate_mockup(req: GenerateMockupReq):
    """Use Gemini Nano Banana to create a product mockup and store it."""
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
    await db.files.insert_one(rec)
    return {"id": fid, "url": f"/api/files/{fid}", "content_type": mime, "size": rec["size"]}


api_router.include_router(admin)
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
    await seed_db()
    try:
        init_storage()
    except Exception as e:
        logger.warning("Storage init failed at startup: %s", e)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
