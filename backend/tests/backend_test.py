import os
import uuid
import pytest
import requests
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pedido-manager-4.preview.emergentagent.com').rstrip('/')

ADMIN_EMAIL = "admin@notas.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data
    # cookie check
    assert "access_token" in r.cookies or any("access_token" in c.name for c in r.cookies)
    return data["token"]


@pytest.fixture(scope="session")
def headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---- Auth ----
class TestAuth:
    def test_root(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_login_bad(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me(self, headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == ADMIN_EMAIL
        assert "password_hash" not in u
        assert "_id" not in u

    def test_me_no_token(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_register_duplicate(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": ADMIN_EMAIL, "password": "x1234", "name": "dup"})
        assert r.status_code == 400

    def test_register_new(self):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "pass123", "name": "TEST_User"})
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == email
        assert "token" in data


# ---- Products ----
class TestProducts:
    def test_product_crud(self, headers):
        payload = {"name": "TEST_Prod", "description": "d", "price_blue": 10.0, "price_green": 9.0, "price_yellow": 8.0, "price_red": 7.0}
        r = requests.post(f"{BASE_URL}/api/products", json=payload, headers=headers)
        assert r.status_code == 200
        p = r.json()
        assert p["name"] == "TEST_Prod"
        assert p["price_blue"] == 10.0 and p["price_red"] == 7.0
        assert "id" in p and "_id" not in p
        pid = p["id"]

        r = requests.get(f"{BASE_URL}/api/products", headers=headers)
        assert r.status_code == 200
        assert any(x["id"] == pid for x in r.json())

        upd = {**payload, "price_blue": 15.0}
        r = requests.put(f"{BASE_URL}/api/products/{pid}", json=upd, headers=headers)
        assert r.status_code == 200
        assert r.json()["price_blue"] == 15.0

        r = requests.delete(f"{BASE_URL}/api/products/{pid}", headers=headers)
        assert r.status_code == 200
        r = requests.delete(f"{BASE_URL}/api/products/{pid}", headers=headers)
        assert r.status_code == 404

    def test_products_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/products")
        assert r.status_code == 401


# ---- Customers ----
class TestCustomers:
    def test_customer_crud(self, headers):
        payload = {"name": "TEST_Cust", "address": "Rua 1", "phone": "111", "email": "c@x.com"}
        r = requests.post(f"{BASE_URL}/api/customers", json=payload, headers=headers)
        assert r.status_code == 200
        c = r.json()
        assert c["name"] == "TEST_Cust"
        cid = c["id"]

        r = requests.put(f"{BASE_URL}/api/customers/{cid}", json={**payload, "phone": "222"}, headers=headers)
        assert r.status_code == 200
        assert r.json()["phone"] == "222"

        r = requests.delete(f"{BASE_URL}/api/customers/{cid}", headers=headers)
        assert r.status_code == 200


# ---- Notes ----
class TestNotes:
    def test_note_create_and_order_number(self, headers):
        # create product to use
        pr = requests.post(f"{BASE_URL}/api/products", json={"name": "TEST_PN", "price_blue": 20.0, "price_green": 18.0, "price_yellow": 16.0, "price_red": 14.0}, headers=headers).json()
        pid = pr["id"]

        payload = {
            "customer_name": "TEST_CNote",
            "customer_address": "Rua X",
            "customer_phone": "999",
            "items": [
                {"product_id": pid, "product_name": "TEST_PN", "quantity": 2, "unit_price": 20.0, "tier": "blue"},
                {"product_id": pid, "product_name": "TEST_PN", "quantity": 3, "unit_price": 14.0, "tier": "red"},
            ],
            "delivery_fee": 5.0,
            "status": "pending"
        }
        r = requests.post(f"{BASE_URL}/api/notes", json=payload, headers=headers)
        assert r.status_code == 200, r.text
        note = r.json()
        # subtotal = 2*20 + 3*14 = 82; total=87
        assert note["subtotal"] == 82.0
        assert note["total"] == 87.0
        assert len(note["items"]) == 2
        assert note["items"][0]["tier"] == "blue"
        # Order number format: DDMMYY + 2digit seq
        on = note["order_number"]
        assert len(on) == 8, f"Order number len != 8: {on}"
        expected_date = datetime.now(timezone.utc).strftime("%d%m%y")
        assert on.startswith(expected_date), f"Order num {on} should start with {expected_date}"
        assert on[6:].isdigit()

        nid = note["id"]
        # Get
        r = requests.get(f"{BASE_URL}/api/notes/{nid}", headers=headers)
        assert r.status_code == 200
        assert r.json()["order_number"] == on

        # Update delivery fee
        payload2 = {**payload, "delivery_fee": 10.0}
        r = requests.put(f"{BASE_URL}/api/notes/{nid}", json=payload2, headers=headers)
        assert r.status_code == 200
        assert r.json()["total"] == 92.0

        # List
        r = requests.get(f"{BASE_URL}/api/notes", headers=headers)
        assert r.status_code == 200
        assert any(n["id"] == nid for n in r.json())

        # Sequential increment
        r = requests.post(f"{BASE_URL}/api/notes", json=payload, headers=headers)
        assert r.status_code == 200
        on2 = r.json()["order_number"]
        assert on2 != on
        assert on2.startswith(expected_date)
        nid2 = r.json()["id"]

        # invalid tier
        bad = {**payload, "items": [{"product_id": pid, "product_name": "TEST_PN", "quantity": 1, "unit_price": 10.0, "tier": "purple"}]}
        r = requests.post(f"{BASE_URL}/api/notes", json=bad, headers=headers)
        assert r.status_code == 422

        # cleanup
        requests.delete(f"{BASE_URL}/api/notes/{nid}", headers=headers)
        requests.delete(f"{BASE_URL}/api/notes/{nid2}", headers=headers)
        requests.delete(f"{BASE_URL}/api/products/{pid}", headers=headers)


# ---- Dashboard ----
class TestDashboard:
    def test_stats(self, headers):
        r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert r.status_code == 200
        d = r.json()
        for k in ("today_orders", "total_revenue", "pending_count", "total_notes", "daily_revenue"):
            assert k in d
        assert isinstance(d["daily_revenue"], list)
        assert len(d["daily_revenue"]) == 7


# ---- Multi-tenant ----
class TestMultiTenant:
    def test_isolation(self):
        # create 2 users
        e1 = f"u1_{uuid.uuid4().hex[:6]}@x.com"
        e2 = f"u2_{uuid.uuid4().hex[:6]}@x.com"
        t1 = requests.post(f"{BASE_URL}/api/auth/register", json={"email": e1, "password": "pass12", "name": "U1"}).json()["token"]
        t2 = requests.post(f"{BASE_URL}/api/auth/register", json={"email": e2, "password": "pass12", "name": "U2"}).json()["token"]
        h1 = {"Authorization": f"Bearer {t1}"}
        h2 = {"Authorization": f"Bearer {t2}"}
        p = requests.post(f"{BASE_URL}/api/products", json={"name": "TEST_Iso", "price_blue": 1}, headers=h1).json()
        pid = p["id"]
        r = requests.get(f"{BASE_URL}/api/products", headers=h2).json()
        assert not any(x["id"] == pid for x in r)
        r = requests.delete(f"{BASE_URL}/api/products/{pid}", headers=h2)
        assert r.status_code == 404
