from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey
from services.db import Base

class NetworkEdge(Base):
    __tablename__ = 'network_edges'

    id = Column(String(64), primary_key=True)
    source_node = Column(String(64), ForeignKey('network_nodes.id', ondelete='CASCADE'), nullable=False)
    target_node = Column(String(64), ForeignKey('network_nodes.id', ondelete='CASCADE'), nullable=False)
    transaction_count = Column(Integer, default=1)
    total_amount = Column(Numeric(14, 2), default=0.00)
    risk_score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "source": self.source_node,
            "target": self.target_node,
            "transaction_count": self.transaction_count,
            "total_amount": float(self.total_amount) if self.total_amount is not None else 0.0,
            "risk_score": self.risk_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
