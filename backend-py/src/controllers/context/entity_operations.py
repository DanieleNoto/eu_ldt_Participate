from fastapi import APIRouter, Header, Body

from config.logger_config import logger
from controllers.context.response_handlers import ResponseHandlers


def get_entity_operations_router(context_brokering_client, user):
    router = APIRouter()

    @router.post("/entityOperations/update")
    async def batch_update_entities(
        entities_data: list[dict] = Body(
            ...,
            example=[
                {
                    "id": "urn:ngsi-ld:Device:001",
                    "temperature": {"type": "Property", "value": 22.5},
                },
                {
                    "id": "urn:ngsi-ld:Device:002",
                    "humidity": {"type": "Property", "value": 55},
                },
            ],
        ),
        scope: str = Header(""),
    ):
        logger.info(f"Batch updating entities in scope '{scope}'", extra={"user": user})
        logger.debug(f"Entities data: {entities_data}", extra={"user": user})

        response = context_brokering_client.batch_update_entities(entities_data, scope)
        return ResponseHandlers.handle_create_response(response, user)

    @router.post("/entityOperations/delete")
    async def batch_delete_entities(
        entity_ids: list[str] = Body(
            ...,
            example=[
                "urn:ngsi-ld:Device:001",
                "urn:ngsi-ld:Device:002",
            ],
        ),
        scope: str = Header(""),
    ):
        logger.info(f"Batch deleting entities in scope '{scope}'", extra={"user": user})
        logger.debug(f"Entity IDs to delete: {entity_ids}", extra={"user": user})

        response = context_brokering_client.batch_delete_entities(entity_ids, scope)
        return ResponseHandlers.handle_create_response(response, user)

    return router
