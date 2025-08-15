from fastapi import APIRouter

from controllers.context.temporals import get_temporals_router
from controllers.context.tenants import get_tenants_router
from routes.data_source.data_source_routes import router as DataSourceRouter
from routes.user_roles.user_roles_routes import router as UserRolesRouter
from routes.auth_token.auth_token_routes import router as AuthTokenRouter
from controllers.context.entities import get_entities_router
from controllers.context.types import get_types_router
from controllers.context.entity_operations import get_entity_operations_router
from controllers.context import auth
from services.context_brokering_clients.scorpio_broker_client import (
    ScorpioBrokerClient,
)
from config import config

API_PREFIX = "/api/v1"
API_PREFIX_DATA_STORAGE = "/dstg"
USER = "API USER"

TAG_DATA_SOURCE = "Data Source"


def get_main_router() -> APIRouter:
    router = APIRouter()

    context_brokering_client = ScorpioBrokerClient(config.CONTEXT_DATA_BROKER_URL)
    context_brokering_client.init_database()

    router.include_router(auth.router, prefix=API_PREFIX, tags=["Authentication"])
    router.include_router(
        get_entities_router(context_brokering_client, USER),
        prefix=API_PREFIX,
        tags=["Entities"],
    )
    router.include_router(
        get_types_router(context_brokering_client, USER),
        prefix=API_PREFIX,
        tags=["Types"],
    )
    router.include_router(
        DataSourceRouter,
        prefix=API_PREFIX + API_PREFIX_DATA_STORAGE,
        tags=[TAG_DATA_SOURCE],
    )
    router.include_router(
        UserRolesRouter,
        prefix=API_PREFIX + API_PREFIX_DATA_STORAGE,
        tags=[TAG_DATA_SOURCE],
    )
    router.include_router(
        AuthTokenRouter,
        prefix=API_PREFIX,
        tags=[TAG_DATA_SOURCE],
    )

    router.include_router(
        get_entity_operations_router(context_brokering_client, USER),
        prefix=API_PREFIX,
        tags=["Entity Operations"],
    )

    router.include_router(
        get_tenants_router(context_brokering_client, USER),
        prefix=API_PREFIX,
        tags=["Tenants"],
    )

    router.include_router(
        get_temporals_router(context_brokering_client, USER),
        prefix=API_PREFIX,
        tags=["Temporals"],
    )

    return router
