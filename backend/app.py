import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from services.db import db_session, init_db
from services.seed import seed_initial_data_if_empty
from routes import transactions_bp, alerts_bp, dashboard_bp, network_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend origins
    CORS(
        app,
        resources={r"/api/*": {"origins": Config.CORS_ORIGINS}},
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"]
    )

    # Teardown database session per request
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    # Register Route Blueprints
    app.register_blueprint(transactions_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(network_bp)

    # Health Check Endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "online",
            "service": "TraceGuard Defense API",
            "version": "2.4.0",
            "database": "connected"
        }), 200

    # Structured Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"success": False, "error": "Bad Request", "message": str(e)}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Resource Not Found", "message": str(e)}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"success": False, "error": "Method Not Allowed", "message": str(e)}), 405

    @app.errorhandler(500)
    def internal_error(e):
        db_session.rollback()
        return jsonify({"success": False, "error": "Internal Server Error", "message": str(e)}), 500

    # Initialize Database Schema & Seed Data
    with app.app_context():
        init_db()
        try:
            seed_initial_data_if_empty()
        except Exception as ex:
            print(f"Notice during seeding: {ex}")

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
