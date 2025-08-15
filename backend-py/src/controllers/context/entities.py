from fastapi import APIRouter, Header, Body, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials

from controllers.context.auth import http_bearer_scheme, TokenData, verify_token
from controllers.context.response_handlers import ResponseHandlers
from models.context.dto.entity_dto import EntityDTO
from config.logger_config import logger
from models.context.dto.query_filter import QueryFilter


CONTENT_TYPE_JSON_LD = "application/ld+json"


def get_entities_router(context_brokering_client, user):
    router = APIRouter()

    @router.options("/entities")
    async def options_entities():
        logger.info("OPTIONS request received for /entities", extra={"user": user})
        return {}

    @router.get("/entities")
    async def get_entities(
        entity_type: str = Query("", alias="type"),
        scope: str = Header(""),
        query_filter: QueryFilter = Depends(),
        accept: str = CONTENT_TYPE_JSON_LD,
        link_header: str = Header("", alias="link"),
    ):
        logger.info(
            f"Fetching entities from scope '{scope}' with type '{entity_type}'",
            extra={"user": user},
        )

        if query_filter.coordinates or query_filter.geometry or query_filter.georel:
            response = context_brokering_client.get_entities_by_geojson(
                scope,
                entity_type,
                query_filter.geoproperty,
                query_filter.georel,
                query_filter.geometry,
                query_filter.coordinates,
                link_header,
                accept,
            )
        else:
            response = context_brokering_client.get_entities(
                scope, entity_type, link_header, accept
            )

        return ResponseHandlers.handle_response(response, user)

    @router.get("/entities/{entity_id}")
    async def get_entity(
        entity_id: str,
        scope: str = Header(""),
        accept: str = CONTENT_TYPE_JSON_LD,
        link_header: str = Header("", alias="link"),
    ):
        logger.info(
            f"Fetching entity with ID '{entity_id}' from scope '{scope}'",
            extra={"user": user},
        )
        response = context_brokering_client.get_entity(
            scope, entity_id, accept, link_header
        )
        return ResponseHandlers.handle_response(response, user)

    @router.get("/entities/{entity_id}/auth")
    async def get_entity_auth(
        entity_id: str,
        scope: str = Header(""),
        link_header: str = Header("", alias="link"),
        accept: str = Header(default=CONTENT_TYPE_JSON_LD),
        authorization: HTTPAuthorizationCredentials = Depends(http_bearer_scheme),
    ):
        token_data: TokenData = verify_token(authorization)

        logger.info(
            f"Fetching entity with ID '{entity_id}' from scope '{scope}'",
            extra={"user": token_data.username},
        )
        response = context_brokering_client.get_entity(
            scope, entity_id, link_header, accept
        )
        return ResponseHandlers.handle_response(response, token_data.username)

    @router.post("/entities")
    async def create_entity(
        entity: EntityDTO = Body(
            ...,
            example={
                "id": "urn:test:testentity1",
                "type": "TestType",
                "name": {"type": "Property", "value": "teststring"},
                "vocabproperty": {"type": "VocabProperty", "vocab": "x"},
                "listproperty": {"type": "ListProperty", "valueList": [100, 200, 300]},
                "intproperty": {"type": "Property", "value": 123},
                "floatproperty": {"type": "Property", "value": 123.456},
                "complexproperty": {
                    "type": "Property",
                    "value": {"some": {"more": "values"}},
                },
                "testrelationship": {"type": "Relationship", "object": "urn:testref1"},
                "passenger": {
                    "type": "ListRelationship",
                    "objectType": "Person",
                    "objectList": [
                        {"object": "urn:ngsi-ld:Person:Alice"},
                        {"object": "urn:ngsi-ld:Person:Bob"},
                    ],
                },
                "location": {
                    "type": "GeoProperty",
                    "value": {"type": "Point", "coordinates": [-8.50000005, 41.2]},
                },
                "@context": [
                    "https://raw.githubusercontent.com/ScorpioBroker/ScorpioBroker/new_ci/testcontext.json",
                    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context-v1.7.jsonld",
                ],
            },
        ),
        scope: str = Header(""),
        # user_role: str = Depends(get_current_user_role),
    ):
        # if user_role not in ["admin", "editor"]:
        # raise HTTPException(
        #    status_code=status.HTTP_403_FORBIDDEN,
        #    detail="You do not have permission to create entities",
        # )

        logger.info(f"Creating entity in scope '{scope}'", extra={"user": user})
        logger.debug(f"Entity data: {entity.model_dump()}", extra={"user": user})

        response = context_brokering_client.create_entity(entity.model_dump(), scope)
        return ResponseHandlers.handle_create_response(response, user)

    @router.put("/entities/{entity_id}")
    async def replace_entity(
        entity_id: str,
        entity_data: dict = Body(...),
        scope: str = Header(""),
    ):
        logger.info(
            f"Replacing entity '{entity_id}' in scope '{scope}'",
            extra={"user": user},
        )

        response = context_brokering_client.replace_entity(
            scope, entity_id, entity_data
        )
        return ResponseHandlers.handle_create_response(response, user)

    @router.patch("/entities/{entity_id}")
    async def merge_entity(
        entity_id: str,
        link_header: str = Header("", alias="link"),
        updated_attributes: dict = Body(...),
        attribute: str = Header(""),
        scope: str = Header(""),
    ):
        logger.info(
            f"Updating entity '{entity_id}' in scope '{scope}'",
            extra={"user": user},
        )

        response = context_brokering_client.update_entity(
            scope, entity_id, link_header, updated_attributes, attribute
        )
        return ResponseHandlers.handle_create_response(response, user)

    @router.post("/entities/{entity_id}/attrs")
    async def append_entity(
        entity_id: str,
        entity: dict = Body(
            ...,
            example={
                "newtestproperty": {
                    "type": "Relationship",
                    "object": "urn:testref1:updated",
                }
            },
        ),
        scope: str = Header(""),
    ):
        logger.info(f"Appending entity in scope '{scope}'", extra={"user": user})
        logger.debug(f"Entity data: {entity}", extra={"user": user})

        response = context_brokering_client.create_entity(entity, scope, entity_id)
        return ResponseHandlers.handle_create_response(response, user)

    @router.patch("/entities/{entity_id}/attrs")
    async def update_attribute(
        entity_id: str,
        command_data: dict = Body(
            ...,
            example={
                "newAttributeValue": {"type": "Property", "value": "start_process"}
            },
        ),
        attribute: str = Header(""),
        scope: str = Header(""),
    ):
        logger.info(
            f"Updating attribute '{attribute}' for entity '{entity_id}' in scope '{scope}'",
            extra={"user": user},
        )
        response = context_brokering_client.merge_entity(
            scope, entity_id, command_data, attribute
        )
        return ResponseHandlers.handle_create_response(response, user)

    @router.delete("/entities/{entity_id}")
    async def delete_entity(
        entity_id: str,
        scope: str = Header(""),
    ):
        logger.info(
            f"Deleting entity '{entity_id}' in scope '{scope}'",
            extra={"user": user},
        )
        response = context_brokering_client.delete_entity(scope, entity_id)
        return ResponseHandlers.handle_create_response(response, user)

    return router
