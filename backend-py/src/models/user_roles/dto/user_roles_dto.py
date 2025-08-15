from pydantic import BaseModel
from typing import List
from models.user_roles.dto.role_dto import Role


class UserRolesRequest(BaseModel):
    user_id: str
    roles: List[Role]
