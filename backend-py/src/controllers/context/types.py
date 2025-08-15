from typing import List

from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from config.logger_config import logger


class EntityTypeListResponse(BaseModel):
    id: str
    type: str
    typeList: List[str]


def get_types_router(context_brokering_client, user):
    router = APIRouter()

    @router.get("/types", response_model=EntityTypeListResponse)
    def get_types(scope: str = Header(""), link_header: str = Header("", alias="Link")):
        logger.info(f"Fetching entity types from scope '{scope}'", extra={"user": user})
        response = context_brokering_client.get_types(scope, link_header)
        status_code = response.status_code
        content = response.json()
        reason = response.reason

        if status_code == 200:
            logger.info(f"{reason}, status: {status_code}", extra={"user": user})
        else:
            logger.error(f"{reason}, status: {status_code}", extra={"user": user})

        return JSONResponse(content=content, status_code=status_code)

    return router
