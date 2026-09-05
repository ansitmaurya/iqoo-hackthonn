from flask import Blueprint, jsonify
from services.db import db_session
from models.network_node import NetworkNode
from models.network_edge import NetworkEdge
from models.transaction import Transaction

network_bp = Blueprint('network', __name__, url_prefix='/api/network')

@network_bp.route('', methods=['GET'])
def get_network_topology():
    try:
        nodes = db_session.query(NetworkNode).limit(60).all()
        edges = db_session.query(NetworkEdge).limit(200).all()

        # If database is empty or minimal, build dynamic graph representation
        node_list = [n.to_dict() for n in nodes]
        edge_list = [e.to_dict() for e in edges]

        return jsonify({
            "success": True,
            "data": {
                "nodes": node_list,
                "links": edge_list
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
