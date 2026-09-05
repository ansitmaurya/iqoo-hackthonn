import os
import json
from datetime import datetime, timezone
from services.db import db_session
from models.user import User
from models.network_node import NetworkNode
from models.network_edge import NetworkEdge
from models.transaction import Transaction
from models.alert import Alert

def seed_initial_data_if_empty():
    """Seeds baseline nodes, transactions, and alerts from seed data if DB is empty."""
    tx_count = db_session.query(Transaction).count()
    if tx_count > 0:
        return

    print("[TraceGuard] Seeding baseline database records...")

    # 1. Create Default Demo Analyst User
    user = User(
        id="USR-SEC-001",
        name="Analyst Sarah (SecOps)",
        email="sarah.secops@traceguard.internal",
        role="SENIOR_ANALYST"
    )
    user.set_password("traceguard2026")
    db_session.add(user)

    # Locate accounts.json and transactions.json
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "data"))
    accounts_file = os.path.join(base_dir, "accounts.json")
    transactions_file = os.path.join(base_dir, "transactions.json")

    accounts_data = []
    if os.path.exists(accounts_file):
        with open(accounts_file, "r", encoding="utf-8") as f:
            accounts_data = json.load(f)

    transactions_data = []
    if os.path.exists(transactions_file):
        with open(transactions_file, "r", encoding="utf-8") as f:
            transactions_data = json.load(f)

    # 2. Insert Network Nodes (top 50 accounts)
    node_map = {}
    for acc in accounts_data[:50]:
        node = NetworkNode(
            id=acc["id"],
            node_name=acc.get("ownerName", acc["id"]),
            node_type=acc.get("type", "CONSUMER"),
            risk_score=acc.get("riskScore", 0),
            node_metadata={
                "accountNumber": acc.get("accountNumber"),
                "balance": acc.get("balance"),
                "lastKnownLocation": acc.get("lastKnownLocation")
            }
        )
        db_session.add(node)
        node_map[acc["id"]] = node

    # 3. Insert Transactions (top 150 transactions)
    for raw_tx in transactions_data[:150]:
        ts_val = None
        if raw_tx.get("timestamp"):
            try:
                ts_val = datetime.fromisoformat(raw_tx["timestamp"].replace("Z", "+00:00"))
            except Exception:
                ts_val = datetime.now(timezone.utc)
        else:
            ts_val = datetime.now(timezone.utc)

        tx = Transaction(
            id=raw_tx["id"],
            sender=raw_tx.get("accountId"),
            sender_name=raw_tx.get("accountName"),
            receiver=raw_tx.get("recipientId"),
            receiver_name=raw_tx.get("recipientName"),
            amount=raw_tx.get("amount", 0.0),
            currency=raw_tx.get("currency", "USD"),
            type=raw_tx.get("type", "TRANSFER"),
            category=raw_tx.get("category", "PEER_TRANSFER"),
            timestamp=ts_val,
            location=raw_tx.get("location", {}),
            device=raw_tx.get("device", {}),
            status=raw_tx.get("status", "SETTLED"),
            risk_score=raw_tx.get("riskScore", 0),
            risk_level=raw_tx.get("riskLevel", "LOW"),
            triggered_rules=raw_tx.get("triggeredRules", []),
            flagged=raw_tx.get("flagged", False),
            tx_metadata=raw_tx.get("metadata", {})
        )
        db_session.add(tx)

        # 4. Insert corresponding Alert if flagged or risk >= 60
        if raw_tx.get("flagged") or raw_tx.get("riskScore", 0) >= 60:
            alert = Alert(
                id=f"ALT-{raw_tx['id'].replace('TX-', '')}",
                transaction_id=raw_tx["id"],
                account_id=raw_tx.get("accountId"),
                account_name=raw_tx.get("accountName"),
                alert_type="RULE_VIOLATION",
                severity=raw_tx.get("riskLevel", "MEDIUM"),
                message=f"Automated risk alert triggered for {raw_tx.get('accountName')} (${raw_tx.get('amount', 0):,.2f}).",
                risk_score=raw_tx.get("riskScore", 0),
                status="OPEN",
                assigned_analyst="Analyst Sarah (SecOps)",
                triggered_rules=raw_tx.get("triggeredRules", []),
                notes=[{
                    "id": f"NOTE-{raw_tx['id']}",
                    "author": "Sentinel Detection Engine",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "content": f"Alert flagged with score {raw_tx.get('riskScore')}/100."
                }]
            )
            db_session.add(alert)

    # 5. Build Initial Network Edges
    edge_map = {}
    for raw_tx in transactions_data[:150]:
        src = raw_tx.get("accountId")
        tgt = raw_tx.get("recipientId")
        if src and tgt and src in node_map and tgt in node_map:
            key = f"{src}->{tgt}"
            if key in edge_map:
                edge_map[key]["count"] += 1
                edge_map[key]["amount"] += raw_tx.get("amount", 0.0)
            else:
                edge_map[key] = {
                    "source": src,
                    "target": tgt,
                    "count": 1,
                    "amount": raw_tx.get("amount", 0.0),
                    "risk": raw_tx.get("riskScore", 0)
                }

    for key, data in edge_map.items():
        edge = NetworkEdge(
            id=f"EDGE-{data['source']}-{data['target']}",
            source_node=data["source"],
            target_node=data["target"],
            transaction_count=data["count"],
            total_amount=data["amount"],
            risk_score=data["risk"]
        )
        db_session.add(edge)

    db_session.commit()
    print("[TraceGuard] Baseline database seeded successfully.")
