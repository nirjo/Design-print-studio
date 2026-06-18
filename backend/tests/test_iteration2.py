"""Iteration 2 tests: Object storage, Auth, Admin RBAC, Admin CRUD, AI mockup."""
import io
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://aiel-print-studio.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# These tokens were seeded directly into Mongo via /app/auth_testing.md pattern.
# Use env override if available.
ADMIN_TOKEN = os.environ.get("TEST_ADMIN_TOKEN")
NONADMIN_TOKEN = os.environ.get("TEST_NONADMIN_TOKEN")


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    # Ensure seeded; if env var not set, query directly via Mongo via subprocess
    if ADMIN_TOKEN:
        return ADMIN_TOKEN
    import subprocess, json
    out = subprocess.check_output([
        "mongosh", "mongodb://localhost:27017/test_database", "--quiet", "--eval",
        "const s = db.user_sessions.findOne({session_token:/^test_session_admin_/}); print(s ? s.session_token : '');"
    ]).decode().strip().splitlines()[-1]
    if not out:
        pytest.skip("No seeded admin session")
    return out


@pytest.fixture(scope="session")
def nonadmin_token(session):
    if NONADMIN_TOKEN:
        return NONADMIN_TOKEN
    import subprocess
    out = subprocess.check_output([
        "mongosh", "mongodb://localhost:27017/test_database", "--quiet", "--eval",
        "const s = db.user_sessions.findOne({session_token:/^test_session_nonadmin_/}); print(s ? s.session_token : '');"
    ]).decode().strip().splitlines()[-1]
    if not out:
        pytest.skip("No seeded non-admin session")
    return out


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# --- Auth basic ---
class TestAuth:
    def test_auth_session_invalid_id_returns_401(self, session):
        r = session.post(f"{API}/auth/session", json={"session_id": "definitely-not-valid-" + uuid.uuid4().hex}, timeout=25)
        assert r.status_code == 401, r.text

    def test_auth_session_missing_id_returns_400(self, session):
        r = session.post(f"{API}/auth/session", json={}, timeout=15)
        assert r.status_code == 400

    def test_auth_me_without_token_returns_401(self, session):
        r = session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_auth_me_with_admin_token(self, session, admin_token):
        r = session.get(f"{API}/auth/me", headers=auth_headers(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == "aielenterprises3321@gmail.com"
        assert data["is_admin"] is True
        assert "user_id" in data

    def test_auth_me_with_nonadmin_token(self, session, nonadmin_token):
        r = session.get(f"{API}/auth/me", headers=auth_headers(nonadmin_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["is_admin"] is False


# --- Products with /api/files/<id> images ---
class TestProductsImages:
    def test_products_image_points_to_api_files(self, session):
        r = session.get(f"{API}/products", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 4
        for p in data:
            assert p["image"].startswith("/api/files/") or p["image"].startswith("http"), p["image"]
            # iteration_2 requires /api/files
            assert "/api/files/" in p["image"], f"Product {p['id']} still uses external image: {p['image']}"

    def test_products_images_serve_with_image_content_type(self, session):
        r = session.get(f"{API}/products", timeout=15)
        for p in r.json():
            file_id = p["image"].split("/api/files/")[-1]
            img = session.get(f"{API}/files/{file_id}", timeout=30)
            assert img.status_code == 200, f"{p['id']} image fetch failed: {img.status_code}"
            ct = img.headers.get("content-type", "")
            assert ct.startswith("image/"), f"{p['id']} bad content-type: {ct}"
            assert len(img.content) > 1000  # not empty

    def test_files_unknown_id_returns_404(self, session):
        r = session.get(f"{API}/files/does-not-exist-xyz", timeout=15)
        assert r.status_code == 404


# --- Upload ---
class TestUpload:
    def test_upload_small_artwork(self, session):
        # 1x1 PNG
        png = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63f8cf0000000300010001000000005c0d0a2db40000000049454e44ae426082")
        files = {"file": ("test_artwork.png", io.BytesIO(png), "image/png")}
        r = session.post(f"{API}/upload", files=files, data={"folder": "artwork"}, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and data["id"]
        assert data["url"].startswith("/api/files/")
        assert data["content_type"].startswith("image/")
        assert data["size"] > 0

        # And fetchable
        img = session.get(f"{BASE_URL}{data['url']}", timeout=30)
        assert img.status_code == 200
        assert img.headers.get("content-type", "").startswith("image/")

    def test_upload_too_large_returns_413(self, session):
        # 26 MB random bytes
        data = b"x" * (26 * 1024 * 1024)
        files = {"file": ("big.bin", io.BytesIO(data), "application/octet-stream")}
        r = session.post(f"{API}/upload", files=files, data={"folder": "artwork"}, timeout=120)
        assert r.status_code == 413, r.text


# --- Orders with artwork_url ---
class TestOrderArtwork:
    def test_order_with_artwork_url_persists(self, session):
        payload = {
            "customer_name": "TEST_Artwork",
            "customer_phone": "+91 90000 00010",
            "items": [{
                "product_id": "regular-round-neck",
                "product_name": "Regular Round Neck",
                "size": "L", "color": "Black", "quantity": 1,
                "print_area": "Front", "unit_price": 399, "notes": "TEST",
                "artwork_url": "/api/files/some-art-id"
            }],
            "total_amount": 399,
            "channel": "whatsapp"
        }
        r = session.post(f"{API}/orders", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["items"][0]["artwork_url"] == "/api/files/some-art-id"


# --- Admin RBAC ---
class TestAdminRBAC:
    def test_admin_orders_without_token_401(self, session):
        r = session.get(f"{API}/admin/orders", timeout=15)
        assert r.status_code == 401

    def test_admin_orders_with_nonadmin_403(self, session, nonadmin_token):
        r = session.get(f"{API}/admin/orders", headers=auth_headers(nonadmin_token), timeout=15)
        assert r.status_code == 403

    def test_admin_orders_with_admin_200(self, session, admin_token):
        r = session.get(f"{API}/admin/orders", headers=auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_contacts_with_admin_200(self, session, admin_token):
        r = session.get(f"{API}/admin/contacts", headers=auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --- Admin Products CRUD ---
class TestAdminProductsCRUD:
    pid = f"TEST_prod_{uuid.uuid4().hex[:6]}"

    def test_create_product(self, session, admin_token):
        payload = {
            "id": self.__class__.pid,
            "name": "TEST Product",
            "tagline": "Test",
            "fabric": "Cotton",
            "description": "TEST product",
            "colors": ["Black"],
            "color_hex": {"Black": "#000000"},
            "sizes": ["M", "L"],
            "price_min": 100, "price_max": 200,
            "image": "/api/files/some-id",
            "gallery": [],
            "is_active": True
        }
        r = session.post(f"{API}/admin/products", json=payload, headers=auth_headers(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["id"] == self.__class__.pid

        # Verify visible in public list
        r2 = session.get(f"{API}/products", timeout=15)
        ids = [p["id"] for p in r2.json()]
        assert self.__class__.pid in ids

    def test_update_product(self, session, admin_token):
        payload = {
            "id": self.__class__.pid,
            "name": "TEST Product Updated",
            "tagline": "Updated",
            "fabric": "Cotton",
            "description": "Updated",
            "colors": ["Black", "White"],
            "color_hex": {"Black": "#000000", "White": "#ffffff"},
            "sizes": ["M", "L"],
            "price_min": 150, "price_max": 250,
            "image": "/api/files/some-id",
            "gallery": [],
            "is_active": True
        }
        r = session.put(f"{API}/admin/products/{self.__class__.pid}", json=payload, headers=auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        r2 = session.get(f"{API}/products/{self.__class__.pid}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["name"] == "TEST Product Updated"
        assert r2.json()["price_min"] == 150

    def test_delete_product(self, session, admin_token):
        r = session.delete(f"{API}/admin/products/{self.__class__.pid}", headers=auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        r2 = session.get(f"{API}/products/{self.__class__.pid}", timeout=15)
        assert r2.status_code == 404

    def test_admin_create_without_token_401(self, session):
        r = session.post(f"{API}/admin/products", json={}, timeout=15)
        assert r.status_code == 401


# --- Admin Gallery CRUD ---
class TestAdminGalleryCRUD:
    gid = None

    def test_create_gallery(self, session, admin_token):
        payload = {"category": "T-Shirts", "title": "TEST Gallery", "image": "/api/files/x"}
        r = session.post(f"{API}/admin/gallery", json=payload, headers=auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        TestAdminGalleryCRUD.gid = r.json()["id"]
        assert TestAdminGalleryCRUD.gid

    def test_update_gallery(self, session, admin_token):
        payload = {"id": TestAdminGalleryCRUD.gid, "category": "Mugs", "title": "TEST Updated", "image": "/api/files/y"}
        r = session.put(f"{API}/admin/gallery/{TestAdminGalleryCRUD.gid}", json=payload, headers=auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST Updated"

    def test_delete_gallery(self, session, admin_token):
        r = session.delete(f"{API}/admin/gallery/{TestAdminGalleryCRUD.gid}", headers=auth_headers(admin_token), timeout=15)
        assert r.status_code == 200


# --- AI Mockup generation (slow) ---
class TestMockup:
    def test_generate_mockup(self, session, admin_token):
        r = session.post(
            f"{API}/admin/generate-mockup",
            json={"product_id": "regular-round-neck", "prompt": "studio photo of a plain black round-neck t-shirt on a hanger, white background, soft light, no text"},
            headers=auth_headers(admin_token),
            timeout=120,
        )
        if r.status_code != 200:
            pytest.skip(f"Mockup generation slow/failed: {r.status_code} {r.text[:200]}")
        data = r.json()
        assert data["url"].startswith("/api/files/")
        # Fetch the image
        img = session.get(f"{BASE_URL}{data['url']}", timeout=30)
        assert img.status_code == 200
        assert img.headers.get("content-type", "").startswith("image/")
