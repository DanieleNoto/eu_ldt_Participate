from config.logger_config import logger
from fastapi import HTTPException
from models.auth_token.dto.auth_token_request import AuthTokenRequest
from services.auth_token.auth_token_service import request_auth_token


def get_auth_token(request: AuthTokenRequest) -> dict:
    logger.info(f"Received token request with client_id={request.client_id}")
    try:
        response = request_auth_token(request)
        logger.info("Token successfully retrieved from external service")
        return response
    except HTTPException as http_exc:
        logger.error(f"HTTPException while requesting token: {http_exc.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error while requesting auth token: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
