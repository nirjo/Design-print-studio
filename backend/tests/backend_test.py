"""Backend API tests for Aiel Design & Printing Studio."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://aiel-print-studio.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

EXPECTED_PRODUCT_IDS = {"regular-round-neck", "oversized-tshirt", "premium-polo", "dry-fit-sports"}
REQUIRED_PRODUCT_FIELDS = {"id", "name", "fabric", "colors", "sizes", "price_min", "price_max", "image", "color_hex"}


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Products ---
class TestProducts:
    def test_list_products_returns_four_with_full_schema(self, session):
        r = session.get(f"{API}/products", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 4
        ids = {p["id"] for p in data}
        assert ids == EXPECTED_PRODUCT_IDS
        for p in data:
            missing = REQUIRED_PRODUCT_FIELDS - set(p.keys())
            assert not missing, f"Missing fields {missing} in {p['id']}"
            assert isinstance(p["colors"], list) and len(p["colors"]) > 0
            assert isinstance(p["sizes"], list) and len(p["sizes"]) > 0
            assert isinstance(p["price_min"], (int, float))
            assert isinstance(p["price_max"], (int, float))
            assert isinstance(p["color_hex"], dict)
            for c in p["colors"]:
                assert c in p["color_hex"], f"Color {c} missing in color_hex for {p['id']}"

    def test_get_product_by_id(self, session):
        r = session.get(f"{API}/products/regular-round-neck", timeout=15)
        assert r.status_code == 200
        p = r.json()
        assert p["id"] == "regular-round-neck"
        assert p["name"] == "Regular Round Neck"
        assert "Black" in p["colors"]

    def test_get_unknown_product_returns_404(self, session):
        r = session.get(f"{API}/products/does-not-exist", timeout=15)
        assert r.status_code == 404


# --- Gallery ---
class TestGallery:
    def test_gallery_list(self, session):
        r = session.get(f"{API}/gallery", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        for g in data:
            assert {"id", "category", "title", "image"}.issubset(g.keys())

    def test_gallery_filter_tshirts(self, session):
        r = session.get(f"{API}/gallery", params={"category": "T-Shirts"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(g["category"] == "T-Shirts" for g in data)

    def test_gallery_filter_all_returns_all(self, session):
        r_all = session.get(f"{API}/gallery", params={"category": "all"}, timeout=15)
        r_none = session.get(f"{API}/gallery", timeout=15)
        assert r_all.status_code == 200 and r_none.status_code == 200
        assert len(r_all.json()) == len(r_none.json())


# --- Orders ---
class TestOrders:
    def test_create_order_persists_and_returns_full_payload(self, session):
        payload = {
            "customer_name": "TEST_Customer",
            "customer_phone": "+91 90000 00000",
            "customer_email": "test@example.com",
            "delivery_address": "Puducherry",
            "items": [
                {
                    "product_id": "regular-round-neck",
                    "product_name": "Regular Round Neck",
                    "size": "L",
                    "color": "Black",
                    "quantity": 2,
                    "print_area": "Front",
                    "unit_price": 399,
                    "notes": "TEST"
                }
            ],
            "total_amount": 798,
            "channel": "whatsapp"
        }
        r = session.post(f"{API}/orders", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and isinstance(data["id"], str) and len(data["id"]) > 0
        assert data["total_amount"] == 798
        assert data["channel"] == "whatsapp"
        assert data["status"] == "pending"
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == "regular-round-neck"

        # Verify persistence via list
        r2 = session.get(f"{API}/orders", timeout=15)
        assert r2.status_code == 200
        ids = [o["id"] for o in r2.json()]
        assert data["id"] in ids


# --- Contact ---
class TestContact:
    def test_create_contact(self, session):
        payload = {
            "name": "TEST_Enquirer",
            "phone": "+91 90000 00001",
            "email": "test@aiel.test",
            "message": "TEST enquiry for bulk corporate t-shirts",
            "order_type": "corporate"
        }
        r = session.post(f"{API}/contact", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and len(data["id"]) > 0
        assert data["name"] == "TEST_Enquirer"
        assert data["order_type"] == "corporate"
        assert data["message"].startswith("TEST")
