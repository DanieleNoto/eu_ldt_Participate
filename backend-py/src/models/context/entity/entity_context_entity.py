from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, UTC
from config.database import Base


class EntityContext(Base):
    __tablename__ = "entity_contexts"
    __table_args__ = {"schema": "data_platform"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(String, nullable=False)
    context_id = Column(
        Integer, ForeignKey("data_platform.contexts.id"), nullable=False
    )
    tenant = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )
    is_deleted = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False)

    context = relationship("Context")
