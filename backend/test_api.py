import json
import os
import sys

# Ensure backend folder is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app

def run_in_process_tests():
    print("Testing TraceGuard API Endpoints with Flask Test Client...")
    app = create_app()
    app.config['TESTING'] = True
    client = app.test_client()

    # 1. Health Endpoint
    res = client.get('/api/health')
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    body = res.get_json()
    print(f"1. GET /api/health -> HTTP {res.status_code}, status={body.get('status')}, service={body.get('service')}")
    assert body.get('status') == 'online'

    # 2. Dashboard Endpoint
    res = client.get('/api/dashboard')
    assert res.status_code == 200, f"Dashboard failed: {res.status_code}"
    body = res.get_json()
    print(f"2. GET /api/dashboard -> HTTP {res.status_code}, totalProcessed={body['data']['totalProcessedCount']}, openAlerts={body['data']['openAlertsCount']}")
    assert 'totalProcessedCount' in body['data']

    # 3. Transactions List
    res = client.get('/api/transactions?limit=5')
    assert res.status_code == 200, f"Transactions list failed: {res.status_code}"
    body = res.get_json()
    print(f"3. GET /api/transactions -> HTTP {res.status_code}, returned {len(body['data'])} records, total={body['pagination']['total']}")
    assert len(body['data']) > 0

    # 4. POST High-Risk Transaction (Risk Engine & Auto-Alert Test)
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
    res = client.post('/api/transactions', json=high_risk_tx)
    assert res.status_code == 201, f"POST /api/transactions failed: {res.status_code} - {res.get_data(as_text=True)}"
    body = res.get_json()
    tx_data = body["data"]["transaction"]
    alert_data = body["data"]["alert"]
    print(f"4. POST /api/transactions -> HTTP {res.status_code}, TX_ID={tx_data['id']}, RiskScore={tx_data['riskScore']}/100, RiskLevel={tx_data['riskLevel']}, AlertCreated={alert_data is not None}")
    assert tx_data['riskScore'] > 60
    assert alert_data is not None

    # 5. GET Alerts
    res = client.get('/api/alerts?limit=5')
    assert res.status_code == 200, f"Alerts query failed: {res.status_code}"
    body = res.get_json()
    print(f"5. GET /api/alerts -> HTTP {res.status_code}, returned {len(body['data'])} alerts, first_id={body['data'][0]['id']}")
    assert len(body['data']) > 0
    first_alert_id = body['data'][0]['id']

    # 6. PUT Alert (Triage, Analyst Assignment & Note)
    res = client.put(f'/api/alerts/{first_alert_id}', json={
        "status": "IN_REVIEW",
        "assignedAnalyst": "Analyst Sarah (SecOps)",
        "note": "Investigating high-value crypto egress anomaly."
    })
    assert res.status_code == 200, f"Alert update failed: {res.status_code}"
    body = res.get_json()
    print(f"6. PUT /api/alerts/{first_alert_id} -> HTTP {res.status_code}, new_status={body['data']['status']}, notes_count={len(body['data']['notes'])}")
    assert body['data']['status'] == 'IN_REVIEW'

    # 7. Network Graph Topology
    res = client.get('/api/network')
    assert res.status_code == 200, f"Network query failed: {res.status_code}"
    body = res.get_json()
    print(f"7. GET /api/network -> HTTP {res.status_code}, nodes_count={len(body['data']['nodes'])}, links_count={len(body['data']['links'])}")
    assert len(body['data']['nodes']) > 0

    print("\n=======================================================")
    print("ALL TRACEGUARD BACKEND API ENDPOINTS TESTED AND PASSED!")
    print("=======================================================\n")

if __name__ == '__main__':
    run_in_process_tests()
