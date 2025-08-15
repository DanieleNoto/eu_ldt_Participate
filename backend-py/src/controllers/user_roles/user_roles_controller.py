from fastapi import HTTPException
from models.user_roles.dto.user_roles_dto import UserRolesRequest
from services.user_roles.user_roles_service import (
    assign_user_roles,
    get_users_from_external_service,
    get_roles_from_external_service,
)
from config.logger_config import logger


def execute_with_handling(action, info_message: str):
    try:
        logger.info(info_message)
        return action()
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


def assign_roles(request: UserRolesRequest, token: str):
    return execute_with_handling(
        lambda: assign_user_roles(request, token),
        "Assigning roles to user",
    )


def get_users_from_external(token: str):
    return execute_with_handling(
        lambda: get_users_from_external_service(token),
        "Retrieving users from external identity management",
    )


def get_roles_from_external(token: str):
    return execute_with_handling(
        lambda: get_roles_from_external_service(token),
        "Retrieving roles from external identity management",
    )
