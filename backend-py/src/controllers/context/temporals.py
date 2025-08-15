from fastapi import APIRouter, Header, Body, Depends, Query

from controllers.context.response_handlers import ResponseHandlers
from models.context.dto.entity_dto import EntityDTO
from config.logger_config import logger
from models.context.dto.query_filter import QueryFilter

CONTENT_TYPE_JSON_LD = "application/ld+json"


class TemporalParams:
    def __init__(
        self,
        aggr_methods: str = Header("", alias="aggrMethods"),
        time_property: str = Header("modifiedAt", alias="timeproperty"),
        aggr_period_duration: str = Header("", alias="aggrPeriodDuration"),
        timerel: str = Header(""),
        time_at: str = Header("", alias="timeAt"),
        end_time_at: str = Header("", alias="endTimeAt"),
        attrs: str = Header("", alias="attrs"),
    ):
        self.aggr_methods = aggr_methods
        self.time_property = time_property
        self.aggr_period_duration = aggr_period_duration
        self.timerel = timerel
        self.time_at = time_at
        self.end_time_at = end_time_at
        self.attrs = attrs


def get_temporals_router(context_brokering_client, user):
    router = APIRouter()

    @router.post("/temporal/entities")
    async def create_temporal_entity(
        entity: EntityDTO = Body(
            ...,
            example={
                "id": "urn:test:testbatchentity1005",
                "type": "Vehicle",
                "brandName": [
                    {
                        "type": "Property",
                        "value": "Mercedes",
                        "instanceId": "urn:ngsi-ld:2044b133-9659-4406-ab84-5017088942fc",
                    }
                ],
                "speed": [
                    {
                        "type": "Property",
                        "value": 91,
                        "instanceId": "urn:ngsi-ld:8b969313-81e9-4488-93ad-75d4cf0232d7",
                        "observedAt": "2022-09-10T13:21:24.000Z",
                    },
                    {
                        "type": "Property",
                        "value": 80,
                        "instanceId": "urn:ngsi-ld:38b3a5cc-5c8b-4557-8a39-8b66d0b2a52b",
                        "observedAt": "2022-09-10T12:21:24.000Z",
                    },
                ],
            },
        ),
        scope: str = Header(""),
    ):
        logger.info(f"Creating entity in scope '{scope}'", extra={"user": user})
        logger.debug(f"Entity data: {entity.model_dump()}", extra={"user": user})
        response = context_brokering_client.create_temporal_entity(
            entity.model_dump(), scope
        )
        return ResponseHandlers.handle_create_response(response, user)

    @router.get("/temporal/entities")
    async def get_temporal_entities(
        entity_type: str = Query("", alias="type"),
        scope: str = Header(""),
        accept: str = CONTENT_TYPE_JSON_LD,
        link_header: str = Header("", alias="link"),
        options: str = Header(default="sysAttrs"),
        query_filter: QueryFilter = Depends(),
        last_n: int = Header(100),
        temporal_params: TemporalParams = Depends(),
    ):
        logger.info(
            f"Fetching entities from scope '{scope}' with type '{entity_type}'",
            extra={"user": user},
        )
        response = context_brokering_client.get_temporal_entities(
            tenant=scope,
            entity_type=entity_type,
            link_header=link_header,
            accept=accept,
            options=options,
            last_n=last_n,
            geo_query=query_filter,
            temporal_query=temporal_params,
        )
        return ResponseHandlers.handle_temporal_response(response, user)

    @router.delete("/temporal/entities/{entity_id}")
    async def delete_temporal_entity(
        entity_id: str,
        scope: str = Header(""),
    ):
        logger.info(
            f"Deleting entity '{entity_id}' in scope '{scope}'",
            extra={"user": user},
        )
        response = context_brokering_client.delete_temporal_entity(scope, entity_id)
        return ResponseHandlers.handle_create_response(response, user)

    @router.get("/temporal/entities/{entity_id}")
    async def get_temporal_entity(
        entity_id: str,
        entity_type: str = Query("", alias="type"),
        scope: str = Header(""),
        link_header: str = Header("", alias="link"),
        accept: str = CONTENT_TYPE_JSON_LD,
        options: str = Header(default="sysAttrs"),
        last_n: int = Header(100),
        temporal_params: TemporalParams = Depends(),
    ):
        logger.info(
            f"Fetching entity with ID '{entity_id}' from scope '{scope}'",
            extra={"user": user},
        )
        response = context_brokering_client.get_temporal_entity(
            tenant=scope,
            entity_id=entity_id,
            entity_type=entity_type,
            link_header=link_header,
            accept=accept,
            options=options,
            last_n=last_n,
            temporal_query=temporal_params,
        )
        return ResponseHandlers.handle_temporal_response(response, user)

    return router
