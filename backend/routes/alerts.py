import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from sqlalchemy import desc
from services.db import db_session
from models.alert import Alert
from models.transaction import Transaction

alerts_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

@alerts_bp.route('', methods=['GET'])
def get_alerts():
    try:
        status = request.args.get('status')
        severity = request.args.get('severity')
        limit = min(200, max(1, int(request.args.get('limit', 50))))

        query = db_session.query(Alert)

        if status and status.upper() != 'ALL':
            query = query.filter(Alert.status == status.upper())

        if severity and severity.upper() != 'ALL':
            query = query.filter(Alert.severity == severity.upper())

        alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()

        # Join transactions for full payload if present
        tx_ids = [a.transaction_id for a in alerts if a.transaction_id]
        tx_map = {}
        if tx_ids:
            txs = db_session.query(Transaction).filter(Transaction.id.in_(tx_ids)).all()
            tx_map = {t.id: t for t in txs}

        return jsonify({
            "success": True,
            "data": [a.to_dict(include_transaction=tx_map.get(a.transaction_id)) for a in alerts],
            "total": len(alerts)
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@alerts_bp.route('/<string:alert_id>', methods=['PUT'])
def update_alert(alert_id):
    try:
        alert = db_session.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return jsonify({"success": False, "error": f"Alert {alert_id} not found"}), 404

        data = request.get_json() or {}

        if 'status' in data:
            alert.status = data['status'].upper()
        if 'assignedAnalyst' in data or 'assigned_analyst' in data:
            alert.assigned_analyst = data.get('assignedAnalyst') or data.get('assigned_analyst')
        if 'resolutionSummary' in data or 'resolution_summary' in data:
            alert.resolution_summary = data.get('resolutionSummary') or data.get('resolution_summary')

        # Add note if provided in payload
        if 'note' in data:
            note_content = data['note']
            author = data.get('author', 'Analyst')
            current_notes = list(alert.notes or [])
            current_notes.append({
                "id": f"NOTE-{uuid.uuid4().hex[:6]}",
                "author": author,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "content": note_content
            })
            alert.notes = current_notes

        alert.updated_at = datetime.now(timezone.utc)
        db_session.commit()

        tx = db_session.query(Transaction).filter(Transaction.id == alert.transaction_id).first()
        return jsonify({"success": True, "data": alert.to_dict(include_transaction=tx)}), 200

    except Exception as e:
        db_session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
