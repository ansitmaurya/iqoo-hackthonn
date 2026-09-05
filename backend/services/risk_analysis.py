"""
================================================================================
TraceGuard Risk Analysis Engine (Prototype Heuristics)
================================================================================
DISCLAIMER:
This module implements rule-based heuristic scoring for demonstration and 
educational prototype purposes. It does not replace compliance-certified, 
production-grade machine learning or anti-money laundering (AML) detection engines.
================================================================================
"""

import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Tuple
from sqlalchemy import func
from services.db import db_session
from models.transaction import Transaction
from models.network_node import NetworkNode

HIGH_AMOUNT_THRESHOLD_1 = 10000.00
HIGH_AMOUNT_THRESHOLD_2 = 25000.00
HIGH_AMOUNT_THRESHOLD_3 = 50000.00

HIGH_RISK_CATEGORIES = {"CRYPTO_EXCHANGE", "WIRE_REMITTANCE", "ONLINE_CASINO"}
SUSPICIOUS_CITIES = {"Singapore", "Frankfurt", "Grand Cayman", "Dubai", "Lagos"}

class RiskAnalysisService:
    @staticmethod
    def evaluate_transaction(data: Dict[str, Any]) -> Tuple[int, str, List[Dict[str, Any]], bool]:
        """
        Evaluates a transaction payload against prototype heuristic rules.
        
        Returns:
            (risk_score: int, risk_level: str, triggered_rules: list, flagged: bool)
        """
        score = 0
        triggered_rules = []

        sender = data.get("sender") or data.get("accountId")
        receiver = data.get("receiver") or data.get("recipientId")
        amount = float(data.get("amount", 0))
        category = str(data.get("category", "PEER_TRANSFER")).upper()
        location = data.get("location") or {}
        city = location.get("city", "")
        ip_address = location.get("ipAddress", "")
        tx_type = str(data.get("type", "TRANSFER")).upper()

        # Rule 1: High Value / Outlier Thresholds
        if amount >= HIGH_AMOUNT_THRESHOLD_3:
            pts = 45
            score += pts
            triggered_rules.append({
                "ruleId": "RULE_CRITICAL_AMOUNT_SPIKE",
                "ruleName": "Critical Amount Outlier ($50k+)",
                "scoreContribution": pts,
                "severity": "CRITICAL",
                "description": f"Transaction amount (${amount:,.2f}) exceeds critical AML threshold.",
                "evidence": {"amount": amount, "threshold": HIGH_AMOUNT_THRESHOLD_3}
            })
        elif amount >= HIGH_AMOUNT_THRESHOLD_2:
            pts = 30
            score += pts
            triggered_rules.append({
                "ruleId": "RULE_LARGE_CURRENCY_SPIKE",
                "ruleName": "Large Remittance Volume ($25k+)",
                "scoreContribution": pts,
                "severity": "WARNING",
                "description": f"Transaction amount (${amount:,.2f}) exceeds CTR baseline.",
                "evidence": {"amount": amount, "threshold": HIGH_AMOUNT_THRESHOLD_2}
            })
        elif amount >= HIGH_AMOUNT_THRESHOLD_1:
            pts = 18
            score += pts
            triggered_rules.append({
                "ruleId": "RULE_STRUCTURING_BORDER",
                "ruleName": "Near-CTR Structuring Boundary ($10k+)",
                "scoreContribution": pts,
                "severity": "WARNING",
                "description": f"Transaction amount (${amount:,.2f}) is right at the regulatory reporting boundary.",
                "evidence": {"amount": amount, "threshold": HIGH_AMOUNT_THRESHOLD_1}
            })

        # Rule 2: High-Risk Category / Settlement Channel
        if category in HIGH_RISK_CATEGORIES:
            pts = 22
            score += pts
            triggered_rules.append({
                "ruleId": "RULE_HIGH_RISK_MERCHANT",
                "ruleName": f"High Risk Sector: {category.replace('_', ' ').title()}",
                "scoreContribution": pts,
                "severity": "WARNING",
                "description": f"Channel is classified as high-risk liquidity egress ({category}).",
                "evidence": {"category": category}
            })

        # Rule 3: Rapid Velocity Between Same Sender & Receiver within 15 mins
        if sender and receiver:
            fifteen_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=15)
            recent_count = db_session.query(func.count(Transaction.id)).filter(
                Transaction.sender == sender,
                Transaction.receiver == receiver,
                Transaction.timestamp >= fifteen_mins_ago
            ).scalar() or 0

            if recent_count >= 2:
                pts = 35
                score += pts
                triggered_rules.append({
                    "ruleId": "RULE_RAPID_BURST_VELOCITY",
                    "ruleName": "Rapid Sequential Channel Burst",
                    "scoreContribution": pts,
                    "severity": "CRITICAL",
                    "description": f"Detected {recent_count + 1} transactions between same sender and receiver within 15 minutes.",
                    "evidence": {"recentCount": recent_count + 1, "windowMinutes": 15}
                })

        # Rule 4: Known High-Risk Node / Flagged Mule Flag
        if sender:
            sender_node = db_session.query(NetworkNode).filter(NetworkNode.id == sender).first()
            if sender_node and (sender_node.risk_score >= 70 or sender_node.node_type == "MULE_SUSPECT"):
                pts = 32
                score += pts
                triggered_rules.append({
                    "ruleId": "RULE_KNOWN_FLAGGED_NODE",
                    "ruleName": "Originating from Flagged Account / Mule Suspect",
                    "scoreContribution": pts,
                    "severity": "CRITICAL",
                    "description": f"Account {sender} is listed with historical risk score {sender_node.risk_score}/100.",
                    "evidence": {"nodeId": sender, "nodeRisk": sender_node.risk_score, "nodeType": sender_node.node_type}
                })

        # Rule 5: Suspicious Off-shore Geolocation Hops
        if city in SUSPICIOUS_CITIES:
            pts = 15
            score += pts
            triggered_rules.append({
                "ruleId": "RULE_CROSS_BORDER_GEO_ANOMALY",
                "ruleName": f"Offshore Correlated Hub: {city}",
                "scoreContribution": pts,
                "severity": "INFO",
                "description": f"Transaction routed via high-velocity financial transit hub {city}.",
                "evidence": {"city": city, "ipAddress": ip_address}
            })

        # Rule 6: Crypto & P2P Quick Exit
        if tx_type in {"CRYPTO_DEPOSIT", "WIRE_OUT"} and amount > 5000:
            pts = 16
            score += pts
            triggered_rules.append({
                "ruleId": "RULE_UNHOSTED_EGRESS",
                "ruleName": f"Direct Liquidity Egress ({tx_type})",
                "scoreContribution": pts,
                "severity": "WARNING",
                "description": "Outbound transfer into non-custodial or wire settlement layer.",
                "evidence": {"txType": tx_type}
            })

        # Final Score Cap: 0 - 100
        final_score = min(100, max(0, score))
        flagged = final_score >= 60

        if final_score >= 80:
            level = "CRITICAL"
        elif final_score >= 60:
            level = "HIGH"
        elif final_score >= 35:
            level = "MEDIUM"
        else:
            level = "LOW"

        return final_score, level, triggered_rules, flagged
