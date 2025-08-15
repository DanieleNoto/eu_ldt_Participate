from config.logger_config import logger
from fastapi import APIRouter
from models.auth_token.dto.auth_token_request import AuthTokenRequest
from controllers.auth_token import auth_token_controller as controller

router = APIRouter()


@router.post("/identity/token", summary="Request authentication token")
def get_auth_token_route(request: AuthTokenRequest):
    logger.info(f"Routing request to controller for client_id={request.client_id}")
    return controller.get_auth_token(request)
