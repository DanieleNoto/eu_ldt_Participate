from typing import List

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from config.logger_config import logger


class TenantsResponse(BaseModel):
    tenants: List[str]


def get_tenants_router(context_brokering_client, user):
    router = APIRouter()

    @router.get("/tenants", response_model=TenantsResponse)
    async def get_tenants():
        logger.info("Fetching tenants'", extra={"user": user})
        try:
            tenants = context_brokering_client.get_tenants()
            return JSONResponse(content={"tenants": tenants}, status_code=200)
        except Exception as e:
            logger.error(f"Error fetching tenants: {e}", extra={"user": user})
            return JSONResponse(
                status_code=500, content="Internal error while retrieving the tenants"
            )

    return router
