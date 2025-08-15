from config.logger_config import logger
from fastapi import HTTPException
from models.auth_token.dto.auth_token_request import AuthTokenRequest
import requests
from urllib.parse import urlencode
from dotenv import load_dotenv
from config.config import AUTH_BASE_URL, AUTH_TOKEN_URL

load_dotenv()


def request_auth_token(request: AuthTokenRequest) -> dict:
    token_url = AUTH_BASE_URL + AUTH_TOKEN_URL

    if not token_url:
        logger.error("AUTH_TOKEN_URL not defined in environment variables.")
        raise HTTPException(status_code=500, detail="Token endpoint URL not configured")

    logger.info(
        f"Preparing token request to {token_url} with client_id={request.client_id}"
    )

    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    payload = urlencode(
        {
            "client_id": request.client_id,
            "grant_type": request.grant_type,
            "client_secret": request.client_secret,
            "scope": request.scope,
        }
    )

    logger.debug(f"Payload to be sent: {payload}")

    try:
        response = requests.post(token_url, data=payload, headers=headers)

        logger.info(
            f"External token service responded with status {response.status_code}"
        )

        if response.status_code != 200:
            logger.error(f"Token request failed: {response.text}")
            raise HTTPException(
                status_code=response.status_code, detail="Token request failed"
            )

        return response.json()
    except Exception as e:
        logger.error(f"Unexpected error during token request: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error 1")
