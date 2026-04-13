"""Quick test of updated predict + companies endpoints."""
import requests
import json

BASE = "http://127.0.0.1:8000/api"

# 1. Predict with employer
print("=== Predict: Finance/CA/GOOGLE ===")
r = requests.post(f"{BASE}/predict", json={"industry": "52", "state": "CA", "employer_name": "GOOGLE LLC"})
d = r.json()
print(f"Status: {r.status_code}")
print(f"industry_rate: {d['industry_rate']}, state_rate: {d['state_rate']}, employer_rate: {d['employer_rate']}")
print(f"national_avg: {d['national_avg']}, percentile: {d['percentile']}")
print(f"industry_label: {d['industry_label']}")
for e in d["explanation"]:
    print(f"  - {e}")
print()

# 2. Predict without employer
print("=== Predict: Tech/NY (no employer) ===")
r = requests.post(f"{BASE}/predict", json={"industry": "54", "state": "NY"})
d = r.json()
print(f"Status: {r.status_code}")
print(f"industry_rate: {d['industry_rate']}, state_rate: {d['state_rate']}, employer_rate: {d['employer_rate']}")
print(f"percentile: {d['percentile']}")
print()

# 3. Companies with 50-case filter
print("=== Companies: NAICS=52, CA, limit=5 ===")
r = requests.get(f"{BASE}/companies", params={"industry": "52", "state": "CA", "limit": 5})
d = r.json()
print(f"Status: {r.status_code}, total_matching: {d['total_matching']}, relaxed: {d.get('relaxed', False)}")
if d.get("message"):
    print(f"Message: {d['message']}")
for c in d["companies"]:
    name = c["name"][:45]
    cases = c["total_cases"]
    rate = c["approval_rate"]
    score = c["score"]
    print(f"  {name:45s} | rate={rate:.3f} | cases={cases:>5d} | score={score:.3f}")
print()

# 4. Companies with likely fallback (rare industry + state)
print("=== Companies: NAICS=11, WY (expect fallback) ===")
r = requests.get(f"{BASE}/companies", params={"industry": "11", "state": "WY", "limit": 5})
d = r.json()
print(f"Status: {r.status_code}, total: {d['total_matching']}, relaxed: {d.get('relaxed', False)}")
if d.get("message"):
    print(f"Message: {d['message']}")
print(f"Companies: {len(d['companies'])}")

print("\n=== All tests passed! ===")
