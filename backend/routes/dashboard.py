from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify
from sqlalchemy import func, desc
from services.db import db_session
from models.transaction import Transaction
from models.alert import Alert

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('', methods=['GET'])
def get_dashboard_metrics():
    try:
        total_count = db_session.query(func.count(Transaction.id)).scalar() or 0
        flagged_count = db_session.query(func.count(Transaction.id)).filter(Transaction.flagged == True).scalar() or 0
        blocked_count = db_session.query(func.count(Transaction.id)).filter(Transaction.status == 'BLOCKED').scalar() or 0
        
        total_vol = db_session.query(func.sum(Transaction.amount)).scalar() or 0.0
        at_risk_vol = db_session.query(func.sum(Transaction.amount)).filter(
            (Transaction.flagged == True) | (Transaction.risk_score >= 60)
        ).scalar() or 0.0

        open_alerts = db_session.query(func.count(Alert.id)).filter(
            Alert.status.in_(['OPEN', 'IN_REVIEW'])
        ).scalar() or 0

        crit_alerts = db_session.query(func.count(Alert.id)).filter(
            Alert.severity == 'CRITICAL',
            ~Alert.status.in_(['RESOLVED', 'FALSE_POSITIVE'])
        ).scalar() or 0

        fraud_rate = round((flagged_count / total_count * 100), 2) if total_count > 0 else 0.0

        # Risk distribution counts
        low_count = db_session.query(func.count(Transaction.id)).filter(Transaction.risk_level == 'LOW').scalar() or 0
        medium_count = db_session.query(func.count(Transaction.id)).filter(Transaction.risk_level == 'MEDIUM').scalar() or 0
        high_count = db_session.query(func.count(Transaction.id)).filter(Transaction.risk_level == 'HIGH').scalar() or 0
        critical_count = db_session.query(func.count(Transaction.id)).filter(Transaction.risk_level == 'CRITICAL').scalar() or 0

        # Recent 10 transactions
        recent_txs = db_session.query(Transaction).order_by(desc(Transaction.timestamp)).limit(10).all()

        return jsonify({
            "success": True,
            "data": {
                "tps": 1.2,
                "totalProcessedCount": total_count,
                "flaggedCount": flagged_count,
                "blockedCount": blocked_count,
                "fraudRate": fraud_rate,
                "totalVolume": float(total_vol),
                "totalAtRiskVolume": float(at_risk_vol),
                "openAlertsCount": open_alerts,
                "criticalAlertsCount": crit_alerts,
                "riskDistribution": {
                    "low": low_count,
                    "medium": medium_count,
                    "high": high_count,
                    "critical": critical_count
                },
                "recentActivity": [tx.to_dict() for tx in recent_txs]
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
