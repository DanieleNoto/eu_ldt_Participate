from pydantic import BaseModel, Field
from typing import Optional


class RoleResponse(BaseModel):
    client_id: str = Field(..., alias="clientID")
    role_id: str = Field(..., alias="roleID")
    role_name: str = Field(..., alias="roleName")
    description: Optional[str] = None
