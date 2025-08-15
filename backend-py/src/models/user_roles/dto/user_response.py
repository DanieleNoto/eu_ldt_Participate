from typing import List
from pydantic import BaseModel, Field


class Role(BaseModel):
    role_name: str = Field(..., alias="roleName")
    role_id: str = Field(..., alias="roleID")


class Credential(BaseModel):
    type: str
    created_at: str = Field(..., alias="createdAt")
    data: List[str]


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    roles: List[Role]
    credentials: List[Credential]
