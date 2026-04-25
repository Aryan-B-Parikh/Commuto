# -*- coding: utf-8 -*-
"""Commuto API test - all tiers"""
import requests, json, sys, uuid, io

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE = "http://localhost:8000"
PASS_COUNT = 0
FAIL_COUNT = 0
ERRORS = []
WARNINGS = []

def t(name, resp, exp=200, fields=None):
    global PASS_COUNT, FAIL_COUNT
    ok = resp.status_code == exp
    if ok:
        PASS_COUNT += 1
        tag = "PASS"
    else:
        FAIL_COUNT += 1
        tag = "FAIL"
        ERRORS.append(f"{name}: expected {exp}, got {resp.status_code} -- {resp.text[:200]}")
    print(f"  [{tag}] [{resp.status_code}] {name}")
    import time
    time.sleep(1)
    if ok and fields and resp.status_code < 300:
        try:
            data = resp.json()
            if isinstance(data, dict):
                for f in fields:
                    if f not in data:
                        WARNINGS.append(f"{name}: missing '{f}'")
                        print(f"    [WARN] Missing: {f}")
        except Exception:
            pass
    return resp

def section(title):
    print(f"\n{'='*60}\n  {title}\n{'='*60}")

# ---- 1. Health ----
section("1. Health")
t("GET /", requests.get(f"{BASE}/"))
t("GET /health", requests.get(f"{BASE}/health"), fields=["status"])

# ---- 2. Auth ----
section("2. Auth")
uid = str(uuid.uuid4())[:8]
pe = f"tp_{uid}@test.com"
de = f"td_{uid}@test.com"

# Register returns UserResponse (not Token), so check for 'id'
rp = t("Register passenger", requests.post(f"{BASE}/auth/register", json={
    "email": pe, "password": "testpass123", "full_name": "Test P",
    "phone": "9876543210", "role": "passenger"
}), 201, ["id", "email", "full_name", "role"])

rd = t("Register driver", requests.post(f"{BASE}/auth/register", json={
    "email": de, "password": "testpass123", "full_name": "Test D",
    "phone": "9876543211", "role": "driver",
    "license_number": "DL123", "vehicle_make": "Toyota",
    "vehicle_model": "Camry", "vehicle_plate": "MH01AB1234", "vehicle_capacity": 4
}), 201, ["id", "email", "role"])

# Login returns Token
lp = t("Login passenger", requests.post(f"{BASE}/auth/login", json={"email": pe, "password": "testpass123"}), 200, ["access_token"])
ld = t("Login driver", requests.post(f"{BASE}/auth/login", json={"email": de, "password": "testpass123"}), 200, ["access_token"])

pt = lp.json().get("access_token", "")
dt = ld.json().get("access_token", "")
ph = {"Authorization": f"Bearer {pt}"}
dh = {"Authorization": f"Bearer {dt}"}

# ---- 3. Profile ----
section("3. Profile GET/PATCH")
t("GET /auth/me (passenger)", requests.get(f"{BASE}/auth/me", headers=ph), 200,
  ["id", "email", "full_name", "role", "gender", "emergency_contact", "today_earnings", "online_hours"])

t("GET /auth/me (driver)", requests.get(f"{BASE}/auth/me", headers=dh), 200,
  ["id", "role", "license_number", "insurance_status", "max_passengers", "route_radius"])

t("PATCH passenger", requests.patch(f"{BASE}/auth/me", headers=ph, json={
    "full_name": "Updated P", "gender": "male", "bio": "test bio",
    "address": "123 Mumbai", "date_of_birth": "2000-01-15",
    "emergency_contact": {"name": "Mom", "relationship": "Mother", "phone": "999"},
    "travel_preferences": ["quiet", "music"], "accessibility_needs": False
}), 200, ["full_name", "gender", "bio", "address", "emergency_contact"])

t("PATCH driver", requests.patch(f"{BASE}/auth/me", headers=dh, json={
    "full_name": "Updated D", "gender": "male", "bio": "driver bio",
    "license_number": "DL-UP", "insurance_status": "active",
    "max_passengers": 3, "route_radius": 15,
    "vehicle_model": "Honda City", "vehicle_type": "Sedan",
    "vehicle_plate": "MH02CD5678", "vehicle_color": "White", "vehicle_capacity": 4
}), 200, ["full_name", "gender", "bio", "insurance_status"])

# Verify persistence
v = t("Verify PATCH persisted", requests.get(f"{BASE}/auth/me", headers=ph))
if v.status_code == 200:
    d = v.json()
    checks = {"full_name": "Updated P", "gender": "male", "bio": "test bio"}
    for k, expected in checks.items():
        actual = d.get(k)
        if actual != expected:
            WARNINGS.append(f"Persistence: {k} = {actual}, expected {expected}")

# ---- 4. Trips (using actual /rides/request endpoint) ----
section("4. Trips")
ct = t("Create trip (POST /rides/request)", requests.post(f"{BASE}/rides/request", headers=ph, json={
    "from_location": {"address": "Andheri Station, Mumbai", "lat": 19.1197, "lng": 72.8464},
    "to_location": {"address": "Bandra Kurla Complex, Mumbai", "lat": 19.0596, "lng": 72.8656},
    "date": "2026-03-01",
    "time": "10:00",
    "seats_requested": 2
}), 201, ["id", "origin_address", "dest_address", "status"])

tid = None
if ct.status_code == 201:
    td = ct.json()
    tid = td["id"]
    for f in ["from_address", "to_address"]:
        if f not in td:
            WARNINGS.append(f"Trip response missing backward-compat '{f}'")

t("My trips", requests.get(f"{BASE}/rides/my-trips", headers=ph))
t("Open rides", requests.get(f"{BASE}/rides/open", headers=dh))
t("Ride requests", requests.get(f"{BASE}/rides/requests", headers=dh))

# ---- 5. Bids ----
section("5. Bids")
if tid:
    pb = t("Place bid", requests.post(f"{BASE}/bids/{tid}", headers=dh, json={
        "amount": 45, "message": "I can help!"
    }), 201, ["id", "bid_amount", "status"])
    bid_id = pb.json().get("id") if pb.status_code == 201 else None

    t("List bids", requests.get(f"{BASE}/bids/{tid}/all", headers=ph))

    if bid_id:
        t("Accept bid", requests.post(f"{BASE}/bids/{bid_id}/accept", headers=ph))
else:
    print("  [SKIP] Bids (trip creation failed)")

# ---- 6. Trip Cancel ----
section("6. Trip Cancel")
ct2 = requests.post(f"{BASE}/rides/request", headers=ph, json={
    "from_location": {"address": "Gateway of India", "lat": 18.922, "lng": 72.8347},
    "to_location": {"address": "Juhu Beach", "lat": 19.0883, "lng": 72.8264},
    "date": "2026-03-02", "time": "14:00", "seats_requested": 1
})
if ct2.status_code == 201:
    cid = ct2.json()["id"]
    t("Cancel trip", requests.post(f"{BASE}/rides/{cid}/cancel", headers=ph, json={"reason": "changed plans"}))
else:
    print(f"  [SKIP] Cancel trip (create failed: {ct2.status_code})")

# ---- 7. Payment Methods ----
section("7. Payment Methods")
pm = t("Add card", requests.post(f"{BASE}/auth/payment-methods", headers=ph, json={
    "type": "card", "provider": "Visa", "last4": "4242", "is_default": True
}), 201, ["id", "type", "provider", "last4", "is_default"])

pm_id = pm.json().get("id") if pm.status_code == 201 else None

t("Add UPI", requests.post(f"{BASE}/auth/payment-methods", headers=ph, json={
    "type": "upi", "provider": "GPay", "is_default": False
}), 201)

t("List methods", requests.get(f"{BASE}/auth/payment-methods", headers=ph))

if pm_id:
    t("Set default", requests.patch(f"{BASE}/auth/payment-methods/{pm_id}/default", headers=ph))
    t("Delete method", requests.delete(f"{BASE}/auth/payment-methods/{pm_id}", headers=ph), 204)

# ---- 8. Wallet ----
section("8. Wallet")
t("GET wallet", requests.get(f"{BASE}/wallet", headers=ph), 200, ["id", "balance"])
t("GET transactions", requests.get(f"{BASE}/wallet/transactions", headers=ph))
t("Add money (Razorpay)", requests.post(f"{BASE}/wallet/add-money", headers=ph, json={"amount": 500}),
  200, ["order_id", "amount", "currency", "key_id"])
t("Pay (insufficient)", requests.post(f"{BASE}/wallet/pay?amount=100&description=test", headers=ph), 400)

# ---- 9. Error Handling ----
section("9. Error Handling")
t("No token GET /auth/me", requests.get(f"{BASE}/auth/me"), 401)
t("Wrong password", requests.post(f"{BASE}/auth/login", json={"email": pe, "password": "wrong"}), 401)
t("No token /rides", requests.get(f"{BASE}/rides/my-trips"), 401)
t("No token /wallet", requests.post(f"{BASE}/wallet/add-money", json={"amount": 100}), 401)

# ---- Summary ----
print(f"\n{'='*60}")
print(f"  RESULTS: {PASS_COUNT} passed, {FAIL_COUNT} failed, {len(WARNINGS)} warnings")
print(f"{'='*60}")
if ERRORS:
    print("\nFAILURES:")
    for e in ERRORS:
        print(f"  [FAIL] {e}")
if WARNINGS:
    print("\nWARNINGS:")
    for w in WARNINGS:
        print(f"  [WARN] {w}")
if FAIL_COUNT == 0:
    print("\nAll tests passed!")
    sys.exit(0)
else:
    print(f"\n{FAIL_COUNT} test(s) need fixing.")
    sys.exit(1)
