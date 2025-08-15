from datetime import datetime, UTC

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from config.database import Base


class Context(Base):
    __tablename__ = "contexts"
    __table_args__ = {"schema": "data_platform"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    context = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )
    is_deleted = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False)
