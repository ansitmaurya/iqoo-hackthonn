from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, JSON
from services.db import Base

class NetworkNode(Base):
    __tablename__ = 'network_nodes'

    id = Column(String(64), primary_key=True)
    node_name = Column(String(128), nullable=False)
    node_type = Column(String(64), nullable=False)
    risk_score = Column(Integer, default=0)
    node_metadata = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "node_name": self.node_name,
            "node_type": self.node_type,
            "risk_score": self.risk_score,
            "metadata": self.node_metadata or {},
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
