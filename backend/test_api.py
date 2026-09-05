import json
import urllib.request

BASE_URL = "http://127.0.0.1:5000/api"

def make_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            res_body = json.loads(resp.read().decode("utf-8"))
            return status, res_body
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def run_tests():
    print("Testing TraceGuard API Endpoints...")

    # 1. Health
    status, body = make_request("/health")
    print(f"1. GET /health -> HTTP {status}, status={body.get('status')}")
    assert status == 200

    # 2. Dashboard
    status, body = make_request("/dashboard")
    print(f"2. GET /dashboard -> HTTP {status}, totalProcessed={body['data']['totalProcessedCount']}, openAlerts={body['data']['openAlertsCount']}")
    assert status == 200

    # 3. Transactions List
    status, body = make_request("/transactions?limit=5")
    print(f"3. GET /transactions -> HTTP {status}, returned {len(body['data'])} records, total={body['pagination']['total']}")
    assert status == 200 and len(body['data']) > 0

    # 4. POST High-Risk Transaction (testing risk engine & alert generation)
    high_risk_tx = {
        "sender": "ACC-10000",
        "sender_name": "Apex Capital Ltd",
        "receiver": "ACC-10411",
        "receiver_name": "Quantum Dynamics LLC",
        "amount": 75000.00,
        "currency": "USD",
        "type": "CRYPTO_DEPOSIT",
        "category": "CRYPTO_EXCHANGE",
        "location": {
            "city": "Singapore",
            "country": "SG",
            "latitude": 1.3521,
            "longitude": 103.8198,
            "ipAddress": "185.220.101.5"
        }
    }
    status, body = make_request("/transactions", method="POST", data=high_risk_tx)
    tx_data = body["data"]["transaction"]
    alert_data = body["data"]["alert"]
    print(f"4. POST /transactions -> HTTP {status}, TX_ID={tx_data['id']}, RiskScore={tx_data['riskScore']}/100, RiskLevel={tx_data['riskLevel']}, AlertCreated={alert_data is not None}")
    assert status == 201 and alert_data is not None

    # 5. GET Alerts
    status, body = make_request("/alerts?limit=5")
    print(f"5. GET /alerts -> HTTP {status}, returned {len(body['data'])} alerts, first_id={body['data'][0]['id']}")
    assert status == 200 and len(body['data']) > 0

    first_alert_id = body['data'][0]['id']

    # 6. PUT Alert
    status, body = make_request(f"/alerts/{first_alert_id}", method="PUT", data={
        "status": "IN_REVIEW",
        "assignedAnalyst": "Analyst Sarah (SecOps)",
        "note": "Investigating high-value crypto egress anomaly."
    })
    print(f"6. PUT /alerts/{first_alert_id} -> HTTP {status}, new_status={body['data']['status']}, notes_count={len(body['data']['notes'])}")
    assert status == 200

    # 7. Network Graph
    status, body = make_request("/network")
    print(f"7. GET /network -> HTTP {status}, nodes_count={len(body['data']['nodes'])}, links_count={len(body['data']['links'])}")
    assert status == 200 and len(body['data']['nodes']) > 0

    print("ALL API ENDPOINT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
