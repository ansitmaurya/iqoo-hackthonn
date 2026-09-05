from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from werkzeug.security import generate_password_hash, check_password_hash
from services.db import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), default='ANALYST')
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
