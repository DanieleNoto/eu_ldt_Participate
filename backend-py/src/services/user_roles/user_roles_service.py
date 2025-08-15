import requests
import jwt
from typing import Any
from config.config import AUTH_BASE_URL, USERS_URL, ROLES_URL, ASSIGN_ROLES_URL
from models.user_roles.dto.user_response import UserResponse
from models.user_roles.dto.user_roles_dto import UserRolesRequest
from models.user_roles.dto.role_response import RoleResponse
from fastapi import HTTPException
from config.logger_config import logger


def assign_user_roles(request: UserRolesRequest, token: str) -> dict:
    if not request.user_id.strip() or not request.roles:
        error_message = "Internal Server Error: Missing or empty required fields"
        logger.error(error_message)
        raise HTTPException(status_code=500, detail=error_message)

    for role in request.roles:
        if not role.role_name.strip():
            error_message = "Internal Server Error: Role name cannot be empty"
            logger.error(error_message)
            raise HTTPException(status_code=500, detail=error_message)

    try:
        client_id = extract_client_id_from_token(token)

        role_payload = [
            {"clientID": client_id, "roleName": role.role_name}
            for role in request.roles
        ]

        url = AUTH_BASE_URL + ASSIGN_ROLES_URL.replace("{user_id}", request.user_id)
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        logger.info(f"Sending PATCH to {url} with roles: {role_payload}")

        response = requests.patch(url, headers=headers, json=role_payload)

        if response.status_code != 200:
            logger.error(
                f"Failed to assign roles: {response.status_code} - {response.text}"
            )
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to assign roles to user",
            )

        return {}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error while assigning roles: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


def get_users_from_external_service(token: str) -> list[UserResponse]:
    url = AUTH_BASE_URL + USERS_URL
    headers = {"Authorization": f"Bearer {token}"}

    logger.info(f"Requesting users from external service at {url}")

    try:
        response = requests.get(url, headers=headers)
        logger.info(f"User list response status: {response.status_code}")

        if response.status_code != 200:
            logger.error(f"Failed to retrieve users: {response.text}")
            raise HTTPException(
                status_code=response.status_code, detail="Failed to retrieve users"
            )

        users_data = response.json()
        return [UserResponse(**user) for user in users_data]

    except Exception as e:
        logger.error(f"Unexpected error while retrieving users: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Internal Server Error while retrieving users"
        )


def get_roles_from_external_service(token: str) -> list[RoleResponse]:
    client_id = extract_client_id_from_token(token)
    url = AUTH_BASE_URL + ROLES_URL.replace("{client_id}", client_id)
    headers = {"Authorization": f"Bearer {token}"}

    logger.info(f"Requesting roles from external service at {url}")

    try:
        response = requests.get(url, headers=headers)
        logger.info(f"Role list response status: {response.status_code}")

        if response.status_code != 200:
            logger.error(f"Failed to retrieve roles: {response.text}")
            raise HTTPException(
                status_code=response.status_code, detail="Failed to retrieve roles"
            )

        roles_data = response.json()
        return [RoleResponse(**role) for role in roles_data]

    except Exception as e:
        logger.error(f"Unexpected error while retrieving roles: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Internal Server Error while retrieving roles"
        )


def extract_client_id_from_token(token: str) -> str:
    try:
        logger.info("Decoding token to extract client ID")
        decoded_token: dict[str, Any] = jwt.decode(
            token, options={"verify_signature": False}
        )
        client_id = decoded_token.get("client_id") or decoded_token.get("l")

        if not client_id:
            raise HTTPException(status_code=400, detail="Client ID not found in token")

        return client_id

    except Exception as e:
        logger.error(f"Error decoding token for client ID: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid token format")
