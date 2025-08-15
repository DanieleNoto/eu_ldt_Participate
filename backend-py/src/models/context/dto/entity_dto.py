from typing import Optional

from pydantic import BaseModel


class EntityDTO(BaseModel):
    id: str
    type: str
    name: Optional[dict] = None

    class Config:
        extra = "allow"
