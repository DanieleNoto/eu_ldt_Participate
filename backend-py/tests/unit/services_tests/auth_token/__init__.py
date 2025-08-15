from fastapi import APIRouter
from models.auth_token.dto.auth_token_request import AuthTokenRequest
from controllers.auth_token import auth_token_controller as controller

router = APIRouter()


@router.post("/token", summary="Request authentication token")
def get_auth_token_route(request: AuthTokenRequest):
    return controller.get_auth_token(request)
