from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Aiel Design & Printing Studio API")
api_router = APIRouter(prefix="/api")


# ----------- MODELS -----------
class CartLine(BaseModel):
    product_id: str
    product_name: str
    size: str
    color: str
    quantity: int
    print_area: str  # Front / Back / Both
    unit_price: float
    notes: Optional[str] = ""


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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ContactCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    message: str
    order_type: Optional[str] = "general"  # general | corporate | bulk


class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = ""
    message: str
    order_type: str = "general"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ----------- STATIC PRODUCT CATALOG -----------
PRODUCTS = [
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
        "gallery": [
            "https://images.unsplash.com/photo-1610502778270-c5c6f4c7d575?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
        ]
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
        "gallery": [
            "https://images.unsplash.com/photo-1627225925683-1da7021732ea?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
            "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
        ]
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
        "gallery": [
            "https://images.unsplash.com/photo-1625910513413-c23b8bb81cba?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
        ]
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
        "gallery": [
            "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
        ]
    }
]

GALLERY_ITEMS = [
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


# ----------- ROUTES -----------
@api_router.get("/")
async def root():
    return {"message": "Aiel Design & Printing Studio API"}


@api_router.get("/products")
async def list_products():
    return PRODUCTS


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    for p in PRODUCTS:
        if p["id"] == product_id:
            return p
    raise HTTPException(status_code=404, detail="Product not found")


@api_router.get("/gallery")
async def list_gallery(category: Optional[str] = None):
    if category and category.lower() != "all":
        return [g for g in GALLERY_ITEMS if g["category"].lower() == category.lower()]
    return GALLERY_ITEMS


@api_router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate):
    order = Order(**payload.model_dump())
    doc = order.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.orders.insert_one(doc)
    return order


@api_router.get("/orders", response_model=List[Order])
async def list_orders():
    rows = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for r in rows:
        if isinstance(r.get("created_at"), str):
            r["created_at"] = datetime.fromisoformat(r["created_at"])
    return rows


@api_router.post("/contact", response_model=Contact)
async def create_contact(payload: ContactCreate):
    contact = Contact(**payload.model_dump())
    doc = contact.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contacts.insert_one(doc)
    return contact


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
