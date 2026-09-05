from flask import Blueprint, jsonify
from sqlalchemy import desc
from services.db import db_session
from models.transaction import Transaction

network_bp = Blueprint('network', __name__, url_prefix='/api/network')

@network_bp.route('', methods=['GET'])
def get_network_topology():
    try:
        # Query recent transactions from Supabase to form dynamic graph
        txs = db_session.query(Transaction).order_by(desc(Transaction.timestamp)).limit(200).all()

        nodes_map = {}
        links_map = {}

        for tx in txs:
            src = tx.sender
            tgt = tx.receiver
            amt = float(tx.amount or 0.0)
            score = int(tx.risk_score or 0)

            # Sender Node
            if src not in nodes_map:
                nodes_map[src] = {
                    "id": src,
                    "node_name": f"Account {src}",
                    "node_type": "MULE_SUSPECT" if score >= 75 else ("BUSINESS" if score > 50 else "CONSUMER"),
                    "risk_score": score,
                    "metadata": {
                        "lastLocation": tx.location,
                        "transactionCount": 1
                    }
                }
            else:
                nodes_map[src]["risk_score"] = max(nodes_map[src]["risk_score"], score)
                nodes_map[src]["metadata"]["transactionCount"] += 1

            # Receiver Node
            if tgt:
                if tgt not in nodes_map:
                    nodes_map[tgt] = {
                        "id": tgt,
                        "node_name": f"Account {tgt}",
                        "node_type": "BUSINESS" if "CRYPTO" in str(tx.location) else "CONSUMER",
                        "risk_score": int(score * 0.4),
                        "metadata": {
                            "transactionCount": 1
                        }
                    }
                else:
                    nodes_map[tgt]["metadata"]["transactionCount"] += 1

                # Link
                link_key = f"{src}->{tgt}"
                if link_key not in links_map:
                    links_map[link_key] = {
                        "id": f"LNK-{src}-{tgt}",
                        "source": src,
                        "target": tgt,
                        "transaction_count": 1,
                        "total_amount": amt,
                        "risk_score": score
                    }
                else:
                    links_map[link_key]["transaction_count"] += 1
                    links_map[link_key]["total_amount"] += amt
                    links_map[link_key]["risk_score"] = max(links_map[link_key]["risk_score"], score)

        return jsonify({
            "success": True,
            "data": {
                "nodes": list(nodes_map.values()),
                "links": list(links_map.values())
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to build network topology: {str(e)}"}), 500
