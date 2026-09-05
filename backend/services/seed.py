import os
import json
from datetime import datetime, timezone
from services.db import db_session
from models.transaction import Transaction

def seed_initial_data_if_empty():
    """Seeds baseline transactions from seed data if DB is completely empty."""
    try:
        tx_count = db_session.query(Transaction).count()
        if tx_count > 0:
            print(f"[TraceGuard] Database already contains {tx_count} records. Ready in Live Mode.")
            return

        print("[TraceGuard] Database empty. Seeding initial baseline transaction records...")

        # Locate transactions.json
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "data"))
        transactions_file = os.path.join(base_dir, "transactions.json")

        transactions_data = []
        if os.path.exists(transactions_file):
            with open(transactions_file, "r", encoding="utf-8") as f:
                transactions_data = json.load(f)

        for raw_tx in transactions_data[:50]:
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
                sender=raw_tx.get("accountId") or "ACC-10001",
                receiver=raw_tx.get("recipientId") or "ACC-10002",
                amount=float(raw_tx.get("amount", 0.0)),
                timestamp=ts_val,
                location=raw_tx.get("location", {}),
                status=raw_tx.get("status", "SETTLED"),
                risk_score=int(raw_tx.get("riskScore", 0)),
                created_at=datetime.now(timezone.utc)
            )
            db_session.add(tx)

        db_session.commit()
        print("[TraceGuard] Baseline transactions seeded successfully.")
    except Exception as e:
        db_session.rollback()
        print(f"[TraceGuard] Notice during seed check: {e}")
