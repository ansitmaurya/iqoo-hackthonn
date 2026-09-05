import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from sqlalchemy import or_, desc
from services.db import db_session
from models.transaction import Transaction
from services.risk_analysis import RiskAnalysisService

transactions_bp = Blueprint('transactions', __name__, url_prefix='/api/transactions')

@transactions_bp.route('', methods=['GET'])
def get_transactions():
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(200, max(1, int(request.args.get('limit', 20))))
        status = request.args.get('status')
        min_risk = request.args.get('min_risk', type=int)
        search = request.args.get('search', '').strip()

        query = db_session.query(Transaction)

        if status and status.upper() != 'ALL':
            query = query.filter(Transaction.status == status.upper())

        if min_risk is not None and min_risk > 0:
            query = query.filter(Transaction.risk_score >= min_risk)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Transaction.id.ilike(search_pattern),
                    Transaction.sender.ilike(search_pattern),
                    Transaction.receiver.ilike(search_pattern)
                )
            )

        total = query.count()
        # Order by timestamp or created_at desc
        txs = query.order_by(desc(Transaction.timestamp)).offset((page - 1) * limit).limit(limit).all()

        return jsonify({
            "success": True,
            "data": [tx.to_dict() for tx in txs],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": max(1, (total + limit - 1) // limit)
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": f"Database query failed: {str(e)}"}), 500


@transactions_bp.route('/<string:tx_id>', methods=['GET'])
def get_transaction(tx_id):
    try:
        tx = db_session.query(Transaction).filter(Transaction.id == tx_id).first()
        if not tx:
            return jsonify({"success": False, "error": f"Transaction {tx_id} not found"}), 404
        return jsonify({"success": True, "data": tx.to_dict()}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@transactions_bp.route('', methods=['POST'])
def create_transaction():
    try:
        data = request.get_json() or {}

        # Validation
        sender = data.get('sender') or data.get('accountId')
        if not sender:
            return jsonify({"success": False, "error": "Missing required field: 'sender' or 'accountId'"}), 400

        try:
            amount = float(data.get('amount', 0))
            if amount <= 0:
                return jsonify({"success": False, "error": "Field 'amount' must be greater than 0"}), 400
        except (ValueError, TypeError):
            return jsonify({"success": False, "error": "Field 'amount' must be a valid number"}), 400

        receiver = data.get('receiver') or data.get('recipientId')
        location = data.get('location') or {
            "city": "New York",
            "country": "US",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "ipAddress": "198.51.100.42"
        }
        device = data.get('device') or {
            "deviceId": "DEV-APP-" + str(uuid.uuid4())[:8],
            "browser": "Chrome",
            "os": "Windows",
            "isKnownDevice": True,
            "userAgent": "Mozilla/5.0 TraceGuard/2.0"
        }

        # Evaluate risk score & flagged decision
        eval_payload = {
            "sender": sender,
            "receiver": receiver,
            "amount": amount,
            "category": data.get('category', 'PEER_TRANSFER'),
            "type": data.get('type', 'TRANSFER'),
            "location": location,
            "device": device
        }
        risk_score, risk_level, triggered_rules, flagged = RiskAnalysisService.evaluate_transaction(eval_payload)

        status = 'BLOCKED' if risk_level == 'CRITICAL' and amount > 50000 else ('FLAGGED' if flagged else 'SETTLED')
        tx_id = data.get('id') or f"TX-{uuid.uuid4().hex[:6].upper()}"

        new_tx = Transaction(
            id=tx_id,
            sender=sender,
            receiver=receiver,
            amount=amount,
            timestamp=datetime.now(timezone.utc),
            location=location,
            status=status,
            risk_score=risk_score,
            created_at=datetime.now(timezone.utc)
        )

        db_session.add(new_tx)
        db_session.commit()

        # Build alert data if flagged
        alert_dict = None
        if flagged or risk_score >= 60:
            alert_dict = {
                "id": f"ALT-{new_tx.id.replace('TX-', '')}",
                "transactionId": new_tx.id,
                "accountId": sender,
                "accountName": f"Account {sender}",
                "riskScore": risk_score,
                "riskLevel": risk_level,
                "status": "OPEN",
                "assignedAnalyst": "Unassigned (Auto-Triage)",
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "updatedAt": datetime.now(timezone.utc).isoformat(),
                "triggeredRules": triggered_rules,
                "notes": [
                    {
                        "id": f"NOTE-{uuid.uuid4().hex[:6]}",
                        "author": "TraceGuard Risk Engine",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "content": f"Automated risk alert created for {risk_level} risk score {risk_score}/100."
                    }
                ]
            }

        return jsonify({
            "success": True,
            "message": "Transaction recorded in Supabase PostgreSQL successfully",
            "data": {
                "transaction": new_tx.to_dict(),
                "alert": alert_dict
            }
        }), 201

    except Exception as e:
        db_session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@transactions_bp.route('/<string:tx_id>', methods=['PUT'])
def update_transaction(tx_id):
    try:
        tx = db_session.query(Transaction).filter(Transaction.id == tx_id).first()
        if not tx:
            return jsonify({"success": False, "error": f"Transaction {tx_id} not found"}), 404

        data = request.get_json() or {}
        if 'status' in data:
            tx.status = data['status'].upper()
        if 'risk_score' in data or 'riskScore' in data:
            tx.risk_score = int(data.get('risk_score') or data.get('riskScore'))

        db_session.commit()
        return jsonify({"success": True, "data": tx.to_dict()}), 200

    except Exception as e:
        db_session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@transactions_bp.route('/<string:tx_id>', methods=['DELETE'])
def delete_transaction(tx_id):
    try:
        tx = db_session.query(Transaction).filter(Transaction.id == tx_id).first()
        if not tx:
            return jsonify({"success": False, "error": f"Transaction {tx_id} not found"}), 404

        db_session.delete(tx)
        db_session.commit()
        return jsonify({"success": True, "message": f"Transaction {tx_id} deleted successfully"}), 200

    except Exception as e:
        db_session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
