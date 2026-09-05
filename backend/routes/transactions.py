import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from sqlalchemy import or_, desc
from services.db import db_session
from models.transaction import Transaction
from models.alert import Alert
from models.network_node import NetworkNode
from models.network_edge import NetworkEdge
from services.risk_analysis import RiskAnalysisService

transactions_bp = Blueprint('transactions', __name__, url_prefix='/api/transactions')

@transactions_bp.route('', methods=['GET'])
def get_transactions():
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 20))))
        status = request.args.get('status')
        min_risk = request.args.get('min_risk', type=int)
        category = request.args.get('category')
        search = request.args.get('search', '').strip()

        query = db_session.query(Transaction)

        if status and status.upper() != 'ALL':
            query = query.filter(Transaction.status == status.upper())

        if min_risk is not None and min_risk > 0:
            query = query.filter(Transaction.risk_score >= min_risk)

        if category and category.upper() != 'ALL':
            query = query.filter(Transaction.category == category.upper())

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Transaction.id.ilike(search_pattern),
                    Transaction.sender.ilike(search_pattern),
                    Transaction.sender_name.ilike(search_pattern),
                    Transaction.receiver.ilike(search_pattern),
                    Transaction.receiver_name.ilike(search_pattern)
                )
            )

        total = query.count()
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
        return jsonify({"success": False, "error": str(e)}), 500


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
        sender_name = data.get('sender_name') or data.get('accountName') or f"Account {sender}"
        receiver_name = data.get('receiver_name') or data.get('recipientName') or (f"Account {receiver}" if receiver else None)
        currency = data.get('currency', 'USD')
        tx_type = data.get('type', 'TRANSFER')
        category = data.get('category', 'PEER_TRANSFER')
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

        # Step 5: Risk Evaluation
        eval_payload = {
            "sender": sender,
            "receiver": receiver,
            "amount": amount,
            "category": category,
            "type": tx_type,
            "location": location,
            "device": device
        }
        risk_score, risk_level, triggered_rules, flagged = RiskAnalysisService.evaluate_transaction(eval_payload)

        status = 'BLOCKED' if risk_level == 'CRITICAL' and amount > 50000 else ('FLAGGED' if flagged else 'SETTLED')
        tx_id = data.get('id') or f"TX-{uuid.uuid4().hex[:6].upper()}"

        new_tx = Transaction(
            id=tx_id,
            sender=sender,
            sender_name=sender_name,
            receiver=receiver,
            receiver_name=receiver_name,
            amount=amount,
            currency=currency,
            type=tx_type,
            category=category,
            timestamp=datetime.now(timezone.utc),
            location=location,
            device=device,
            status=status,
            risk_score=risk_score,
            risk_level=risk_level,
            triggered_rules=triggered_rules,
            flagged=flagged,
            tx_metadata=data.get('metadata') or {"source": "API Ingestion Engine"}
        )

        db_session.add(new_tx)

        # Update or create sender network node
        sender_node = db_session.query(NetworkNode).filter(NetworkNode.id == sender).first()
        if not sender_node:
            sender_node = NetworkNode(
                id=sender,
                node_name=sender_name,
                node_type="CONSUMER" if risk_score < 70 else "MULE_SUSPECT",
                risk_score=risk_score,
                node_metadata={"lastLocation": location}
            )
            db_session.add(sender_node)
        else:
            sender_node.risk_score = max(sender_node.risk_score, int(risk_score * 0.85))

        # Update or create receiver network node if present
        if receiver:
            receiver_node = db_session.query(NetworkNode).filter(NetworkNode.id == receiver).first()
            if not receiver_node:
                receiver_node = NetworkNode(
                    id=receiver,
                    node_name=receiver_name or receiver,
                    node_type="BUSINESS" if category in {"CRYPTO_EXCHANGE", "ELECTRONICS"} else "CONSUMER",
                    risk_score=int(risk_score * 0.4),
                    node_metadata={}
                )
                db_session.add(receiver_node)

            # Update or create network edge
            edge_id = f"EDGE-{sender}-{receiver}"
            edge = db_session.query(NetworkEdge).filter(
                or_(
                    (NetworkEdge.source_node == sender) & (NetworkEdge.target_node == receiver),
                    (NetworkEdge.source_node == receiver) & (NetworkEdge.target_node == sender)
                )
            ).first()

            if edge:
                edge.transaction_count += 1
                edge.total_amount = float(edge.total_amount or 0) + amount
                edge.risk_score = max(edge.risk_score or 0, risk_score)
            else:
                new_edge = NetworkEdge(
                    id=edge_id,
                    source_node=sender,
                    target_node=receiver,
                    transaction_count=1,
                    total_amount=amount,
                    risk_score=risk_score
                )
                db_session.add(new_edge)

        # Auto-create alert if flagged or score >= 60
        created_alert = None
        if flagged or risk_score >= 60:
            alert_id = f"ALT-{uuid.uuid4().hex[:5].upper()}"
            created_alert = Alert(
                id=alert_id,
                transaction_id=new_tx.id,
                account_id=sender,
                account_name=sender_name,
                alert_type="RULE_VIOLATION" if triggered_rules else "ANOMALOUS_VELOCITY",
                severity=risk_level,
                message=f"Automated risk alert triggered ({risk_level} risk score: {risk_score}/100) for ${amount:,.2f} USD.",
                risk_score=risk_score,
                status="OPEN",
                assigned_analyst="Unassigned (Auto-Triage)",
                triggered_rules=triggered_rules,
                notes=[{
                    "id": f"NOTE-{uuid.uuid4().hex[:6]}",
                    "author": "TraceGuard Real-Time Risk Engine",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "content": f"Alert generated with risk score {risk_score}/100. Violations: {'; '.join(r['ruleName'] for r in triggered_rules) if triggered_rules else 'High outlier score'}."
                }]
            )
            db_session.add(created_alert)

        db_session.commit()

        return jsonify({
            "success": True,
            "message": "Transaction recorded and risk evaluated successfully",
            "data": {
                "transaction": new_tx.to_dict(),
                "alert": created_alert.to_dict(include_transaction=new_tx) if created_alert else None
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
        if 'flagged' in data:
            tx.flagged = bool(data['flagged'])
        if 'metadata' in data:
            current_meta = tx.tx_metadata or {}
            current_meta.update(data['metadata'])
            tx.tx_metadata = current_meta

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
