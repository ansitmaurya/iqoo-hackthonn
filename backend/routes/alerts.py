import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from sqlalchemy import desc
from services.db import db_session
from models.transaction import Transaction

alerts_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

@alerts_bp.route('', methods=['GET'])
def get_alerts():
    try:
        status = request.args.get('status')
        severity = request.args.get('severity')
        limit = min(200, max(1, int(request.args.get('limit', 50))))

        # Retrieve high risk or flagged transactions from Supabase
        query = db_session.query(Transaction).filter(
            (Transaction.risk_score >= 60) | (Transaction.status == 'FLAGGED') | (Transaction.status == 'BLOCKED')
        )

        if status and status.upper() != 'ALL':
            if status.upper() in ('OPEN', 'IN_REVIEW'):
                query = query.filter(Transaction.status != 'RESOLVED')
            elif status.upper() == 'RESOLVED':
                query = query.filter(Transaction.status == 'RESOLVED')

        txs = query.order_by(desc(Transaction.timestamp)).limit(limit).all()

        alerts_list = []
        for tx in txs:
            tx_dict = tx.to_dict()
            level = tx_dict["riskLevel"]
            if severity and severity.upper() != 'ALL' and level != severity.upper():
                continue

            alert_id = f"ALT-{tx.id.replace('TX-', '')}"
            alerts_list.append({
                "id": alert_id,
                "transactionId": tx.id,
                "transaction": tx_dict,
                "accountId": tx.sender,
                "accountName": f"Account {tx.sender}",
                "riskScore": int(tx.risk_score or 0),
                "riskLevel": level,
                "status": "OPEN" if tx.status in ('FLAGGED', 'SETTLED', 'BLOCKED', None) else tx.status,
                "assignedAnalyst": "Analyst Sarah (SecOps)" if (tx.risk_score or 0) >= 80 else "Analyst Chen (FinCrime)",
                "createdAt": tx_dict["timestamp"],
                "updatedAt": tx_dict["timestamp"],
                "triggeredRules": tx_dict.get("triggeredRules", []),
                "notes": [
                    {
                        "id": f"NOTE-{tx.id}",
                        "author": "Sentinel Threat Engine",
                        "timestamp": tx_dict["timestamp"],
                        "content": f"Automated risk alert triggered with score {tx.risk_score}/100."
                    }
                ]
            })

        return jsonify({
            "success": True,
            "data": alerts_list,
            "total": len(alerts_list)
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to fetch alerts: {str(e)}"}), 500


@alerts_bp.route('/<string:alert_id>', methods=['PUT'])
def update_alert(alert_id):
    try:
        data = request.get_json() or {}
        tx_id = alert_id.replace("ALT-", "TX-") if alert_id.startswith("ALT-") else alert_id
        
        tx = db_session.query(Transaction).filter(
            (Transaction.id == tx_id) | (Transaction.id == alert_id)
        ).first()

        new_status = data.get('status', 'IN_REVIEW').upper()
        if tx:
            if new_status in ('RESOLVED', 'FALSE_POSITIVE'):
                tx.status = 'SETTLED'
            elif new_status == 'ESCALATED':
                tx.status = 'FLAGGED'
            db_session.commit()

        return jsonify({
            "success": True,
            "data": {
                "id": alert_id,
                "status": new_status,
                "assignedAnalyst": data.get('assignedAnalyst') or data.get('assigned_analyst') or 'Analyst Sarah (SecOps)',
                "resolutionSummary": data.get('resolutionSummary') or data.get('resolution_summary'),
                "notes": [
                    {
                        "id": f"NOTE-{uuid.uuid4().hex[:6]}",
                        "author": data.get('author', 'Security Analyst'),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "content": data.get('note', 'Status updated by analyst.')
                    }
                ] if 'note' in data else []
            }
        }), 200

    except Exception as e:
        db_session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
