from fastapi import APIRouter
from fastapi import Header
from models.user_roles.dto.user_roles_dto import UserRolesRequest
from controllers.user_roles import user_roles_controller as controller

router = APIRouter()

BEARER_PREFIX = "Bearer "


@router.post("/role", status_code=201, summary="Assign Roles to a User")
def assign_roles_route(request: UserRolesRequest, authorization: str = Header(...)):
    token = authorization.replace(BEARER_PREFIX, "").strip()
    return controller.assign_roles(request, token)


@router.get("/users", summary="Get users from external identity service")
def get_users_external(authorization: str = Header(...)):
    token = authorization.replace(BEARER_PREFIX, "").strip()
    return controller.get_users_from_external(token)


@router.get("/roles", summary="Get roles from external identity service")
def get_roles_external(authorization: str = Header(...)):
    token = authorization.replace(BEARER_PREFIX, "").strip()
    return controller.get_roles_from_external(token)
