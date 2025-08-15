from urllib.parse import unquote

import requests
from datetime import datetime, UTC
import json
from sqlalchemy import text

from services.context_brokering_clients.context_brokering_client import (
    ContextBrokeringClient,
)
from models.context.entity.context_entity import Context
from models.context.entity.entity_context_entity import EntityContext
from config.database import init_db, SessionLocal
from config.logger_config import logger
from pydantic import BaseModel


MAX_REQUESTS_TIMEOUT = 60
NGSILD_TENANT_HEADER = "NGSILD-Tenant"
ACCEPT_HEADER = "Accept"
CONTENT_TYPE_HEADER = "Content-Type"
LINK_HEADER = "Link"
JSON_LD_CONTEXT = "http://www.w3.org/ns/json-ld#context"
CONTENT_TYPE_JSON_LD = "application/ld+json"
CONTENT_TYPE_JSON = "application/json"
NGSI_LD_URL = "/ngsi-ld/v1/entities"
NGSI_LD_URL_TEMPORAL = "/ngsi-ld/v1/temporal/entities"
NGSI_LD_TYPES_URL = "/ngsi-ld/v1/types"
NGSI_LD_ENTITIES_URL = "/ngsi-ld/v1/entities"
NGSI_LD_ENTITIES_URL_TEMPORAL = "/ngsi-ld/v1/temporal/entities"
CONTEXT_ATTRIBUTE_NAME = "@context"
DATABASE_NOT_INITIALISED = "Database session not initialized."


class GeoQuery(BaseModel):
    geoproperty: str = ""
    georel: str = ""
    geometry: str = ""
    coordinates: str = ""


class TemporalQuery(BaseModel):
    aggr_methods: str = ""
    time_property: str = ""
    aggr_period_duration: str = ""
    timerel: str = ""
    time_at: str = ""
    end_time_at: str = ""
    attrs: str = ""


class ScorpioBrokerClient(ContextBrokeringClient):
    PROTECTED_KEYS = ["type"]

    def __init__(
        self, url, default_tenant="", verified=False, timeout=MAX_REQUESTS_TIMEOUT
    ):
        self.url = url
        self.headers = {NGSILD_TENANT_HEADER: default_tenant}
        self.verified = verified
        self.timeout = timeout
        self.session = None

    def init_database(self):
        init_db()
        self.session = SessionLocal()

    def _store_entity_context(self, entity_id, context_data, tenant):
        try:
            if not self.session:
                raise ValueError(DATABASE_NOT_INITIALISED)

            # Check if the context already exists
            context = (
                self.session.query(Context)
                .filter_by(context=json.dumps(context_data))
                .first()
            )

            if not context:
                # Insert new context
                context = Context(context=json.dumps(context_data))
                self.session.add(context)
                self.session.commit()

            # Insert or update in entity_contexts
            entity_context = (
                self.session.query(EntityContext).filter_by(entity_id=entity_id).first()
            )

            if entity_context:
                if entity_context.is_deleted:
                    entity_context.is_deleted = False

                entity_context.context_id = context.id
                entity_context.updated_at = datetime.now(UTC)
            else:
                entity_context = EntityContext(
                    entity_id=entity_id, context_id=context.id, tenant=tenant
                )
                self.session.add(entity_context)

            self.session.commit()

        except Exception as e:
            self.session.rollback()
            print(f"Error storing entity context: {e}")

        finally:
            self.session.close()

    def _get_entity_context(self, entity_id):
        result = ""
        try:
            if not self.session:
                raise ValueError(DATABASE_NOT_INITIALISED)

            entity_context = (
                self.session.query(EntityContext)
                .filter_by(entity_id=entity_id, is_deleted=False)
                .first()
            )

            if (
                entity_context
                and entity_context.context
                and entity_context.context.context
            ):
                result = json.loads(entity_context.context.context)
        except Exception as e:
            self.session.rollback()
            print(f"Error retrieving entity context: {e}")
        finally:
            self.session.close()

        return result

    def _delete_entity_context(self, entity_id):
        try:
            if not self.session:
                raise ValueError(DATABASE_NOT_INITIALISED)

            entity_context = (
                self.session.query(EntityContext)
                .filter_by(entity_id=entity_id, is_deleted=False)
                .first()
            )

            if entity_context:
                entity_context.is_deleted = True
                self.session.commit()
            else:
                print("Entity context not found.")

        except Exception as e:
            self.session.rollback()
            print(f"Error deleting entity context: {e}")

        finally:
            self.session.close()

    def get_tenants(self):
        tenants_list = []
        try:
            if not self.session:
                raise ValueError(DATABASE_NOT_INITIALISED)

            query = text("""
            SELECT tenant_id
            FROM public.tenant
            """)

            result = self.session.execute(query)

            tenants = result.fetchall()

            for tenant in tenants:
                tenants_list.append(tenant[0])

        except Exception as e:
            self.session.rollback()
            print(f"Error getting tenants: {e}")

        finally:
            self.session.close()

        return tenants_list

    def get_entities(
        self, tenant: str, entity_type: str, link_header: str, accept: str
    ):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})
        headers[ACCEPT_HEADER] = accept
        if link_header:
            headers[LINK_HEADER] = (
                f'<{link_header}>; rel="{JSON_LD_CONTEXT}"; type="{CONTENT_TYPE_JSON_LD}"'
            )
        url = f"{self.url}{NGSI_LD_URL}?type={entity_type}"

        response = requests.get(
            url=url, headers=headers, verify=self.verified, timeout=self.timeout
        )
        return response

    def get_entity(self, tenant: str, entity_id: str, accept: str, link_header: str):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})
        headers[ACCEPT_HEADER] = accept
        if link_header:
            headers[LINK_HEADER] = (
                f'<{link_header}>; rel="{JSON_LD_CONTEXT}"; type="{CONTENT_TYPE_JSON_LD}"'
            )
        else:
            loaded_context = self._get_entity_context(entity_id)
            if isinstance(loaded_context, list):
                link_header = loaded_context[0]
            elif isinstance(loaded_context, str):
                link_header = loaded_context
            if link_header:
                headers[LINK_HEADER] = (
                    f'<{link_header}>; rel="{JSON_LD_CONTEXT}"; type="{CONTENT_TYPE_JSON_LD}"'
                )
        url = f"{self.url}{NGSI_LD_URL}/{entity_id}"

        response = requests.get(
            url=url, headers=headers, verify=self.verified, timeout=self.timeout
        )
        return response

    def create_entity(self, entity: dict, tenant: str, entity_id: str = None):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})

        if CONTEXT_ATTRIBUTE_NAME in entity:
            headers[CONTENT_TYPE_HEADER] = CONTENT_TYPE_JSON_LD
        else:
            headers[CONTENT_TYPE_HEADER] = CONTENT_TYPE_JSON

        response = requests.post(
            url=f"{self.url}{NGSI_LD_URL}",
            headers=headers,
            json=entity,
            verify=self.verified,
            timeout=self.timeout,
        )

        if response.status_code in [200, 201]:
            entity_id = entity.get("id")
            context_data = entity.get(CONTEXT_ATTRIBUTE_NAME, None)
            if entity_id and context_data:
                self._store_entity_context(entity_id, context_data, tenant)
        elif response.status_code in [400, 409] and entity_id:
            append_url = f"{self.url}{NGSI_LD_URL}/{entity_id}/attrs"
            response = requests.post(
                url=append_url,
                headers=headers,
                json=entity,
                verify=self.verified,
                timeout=self.timeout,
            )

        return response

    def get_types(self, tenant: str, link_header=""):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})
        if link_header:
            headers[LINK_HEADER] = (
                f'<{link_header}>; rel="{JSON_LD_CONTEXT}"; type="{CONTENT_TYPE_JSON_LD}"'
            )
        url = f"{self.url}{NGSI_LD_TYPES_URL}"

        response = requests.get(
            url=url, headers=headers, verify=self.verified, timeout=self.timeout
        )
        return response

    def get_entities_by_geojson(
        self,
        tenant: str,
        entity_type: str,
        geoproperty: str,
        georel: str,
        geometry: str,
        coordinates: list,
        link_header: str,
        accept: str,
    ):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})
        headers[ACCEPT_HEADER] = accept
        if link_header:
            headers[LINK_HEADER] = (
                f'<{link_header}>; rel="{JSON_LD_CONTEXT}"; type="{CONTENT_TYPE_JSON_LD}"'
            )

        url = f"{self.url}{NGSI_LD_URL}/?type={entity_type}&geoproperty={geoproperty}&geometry={geometry}&coordinates={coordinates}"
        if georel:
            url += f"&georel={georel}"

        response = requests.get(
            url=url, headers=headers, verify=self.verified, timeout=self.timeout
        )
        return response

    def replace_entity(self, tenant: str, entity_id: str, entity_data: dict):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})

        url = f"{self.url}{NGSI_LD_URL}/{entity_id}"

        current_response = self.get_entity(tenant, entity_id, CONTENT_TYPE_JSON_LD, "")

        if current_response.status_code != 200:
            return current_response

        current_entity = current_response.json()

        new_entity = {
            k: current_entity[k]
            for k in current_entity
            if k in ScorpioBrokerClient.PROTECTED_KEYS
        }

        new_entity.update(
            {
                k: v
                for k, v in entity_data.items()
                if k not in ScorpioBrokerClient.PROTECTED_KEYS
            }
        )

        if CONTEXT_ATTRIBUTE_NAME in new_entity:
            headers[CONTENT_TYPE_HEADER] = CONTENT_TYPE_JSON_LD
        else:
            headers[CONTENT_TYPE_HEADER] = CONTENT_TYPE_JSON

        response = requests.put(
            url=url,
            headers=headers,
            json=new_entity,
            verify=self.verified,
            timeout=self.timeout,
        )
        return response

    def merge_entity(
        self,
        tenant: str,
        entity_id: str,
        updated_attributes: dict,
        attribute: str = None,
    ):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})

        current_response = self.get_entity(tenant, entity_id, CONTENT_TYPE_JSON_LD, "")

        if current_response.status_code != 200:
            return current_response

        current_entity = current_response.json()
        new_entity = {
            k: current_entity[k]
            for k in current_entity
            if k in ScorpioBrokerClient.PROTECTED_KEYS
        }

        new_entity.update(
            {
                k: v
                for k, v in updated_attributes.items()
                if k not in ScorpioBrokerClient.PROTECTED_KEYS
            }
        )
        if CONTEXT_ATTRIBUTE_NAME in updated_attributes:
            headers[CONTENT_TYPE_HEADER] = CONTENT_TYPE_JSON_LD
        else:
            headers[CONTENT_TYPE_HEADER] = CONTENT_TYPE_JSON

        if attribute:
            url = f"{self.url}{NGSI_LD_URL}/{entity_id}/attrs/{attribute}"
        else:
            url = f"{self.url}{NGSI_LD_URL}/{entity_id}"

        response = requests.patch(
            url=url,
            headers=headers,
            json=new_entity,
            verify=self.verified,
            timeout=self.timeout,
        )

        return response

    def update_entity(
        self,
        tenant: str,
        entity_id: str,
        link_header: str,
        updated_attributes: dict,
        attribute: str = None,
    ):
        if attribute and attribute.strip():
            updated_attributes = {attribute: updated_attributes}

        response = self.get_entity(tenant, entity_id, CONTENT_TYPE_JSON_LD, link_header)
        if response.status_code != 200:
            return response
        current_entity = response.json()

        new_keys = set(updated_attributes.keys()) - set(current_entity.keys())
        omitted_keys = (
            set(current_entity.keys())
            - set(updated_attributes.keys())
            - set(ScorpioBrokerClient.PROTECTED_KEYS)
        )

        merge_response = self.merge_entity(tenant, entity_id, updated_attributes)

        if new_keys:
            logger.debug(f"Entity attributes to add {new_keys} to {entity_id}")
        if omitted_keys:
            logger.debug(f"Entity attributes to delete {omitted_keys} from {entity_id}")
            return self.replace_entity(tenant, entity_id, updated_attributes)

        return merge_response

    def delete_entity(self, tenant: str, entity_id: str):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})
        url = f"{self.url}{NGSI_LD_URL}/{entity_id}"

        response = requests.delete(
            url=url, headers=headers, verify=self.verified, timeout=self.timeout
        )

        if response.status_code == 204:
            self._delete_entity_context(entity_id)

        return response

    def batch_update_entities(self, entities: list, tenant: str):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})

        contains_context = any("@context" in entity for entity in entities)

        if contains_context:
            headers[CONTENT_TYPE_HEADER] = CONTENT_TYPE_JSON_LD
        else:
            headers[CONTENT_TYPE_HEADER] = CONTENT_TYPE_JSON

        url = f"{self.url}/ngsi-ld/v1/entityOperations/update"

        response = requests.post(
            url=url,
            headers=headers,
            json=entities,
            verify=self.verified,
            timeout=self.timeout,
        )

        return response

    def batch_delete_entities(self, entity_ids: list, tenant: str):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})
        headers[CONTENT_TYPE_HEADER] = CONTENT_TYPE_JSON

        url = f"{self.url}/ngsi-ld/v1/entityOperations/delete"

        response = requests.post(
            url=url,
            headers=headers,
            json=entity_ids,
            verify=self.verified,
            timeout=self.timeout,
        )

        if response.status_code == 204:
            for entity_id in entity_ids:
                self._delete_entity_context(entity_id)

        return response

    def get_temporal_entities(
        self,
        tenant: str,
        entity_type: str,
        link_header: str,
        accept: str,
        options: str,
        last_n: int,
        geo_query: GeoQuery,
        temporal_query: TemporalQuery,
    ):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})
        headers[ACCEPT_HEADER] = accept
        if link_header:
            headers[LINK_HEADER] = (
                f'<{link_header}>; rel="{JSON_LD_CONTEXT}"; type="{CONTENT_TYPE_JSON_LD}"'
            )

        params = {
            "type": entity_type,
            "lastN": last_n,
        }
        if options:
            params["options"] = options
        if geo_query.geoproperty:
            params["geoproperty"] = geo_query.geoproperty
        if geo_query.georel:
            raw_georel = unquote(geo_query.georel)
            params["georel"] = raw_georel
        if geo_query.geometry:
            params["geometry"] = geo_query.geometry
        if geo_query.coordinates:
            raw_coordinates = unquote(geo_query.coordinates)
            params["coordinates"] = raw_coordinates
        if temporal_query.aggr_methods:
            params["aggrMethods"] = temporal_query.aggr_methods
        if temporal_query.time_property:
            params["timeproperty"] = temporal_query.time_property
        if temporal_query.aggr_period_duration:
            params["aggrPeriodDuration"] = temporal_query.aggr_period_duration
        if temporal_query.timerel and temporal_query.time_at:
            params["timerel"] = temporal_query.timerel
            params["timeAt"] = temporal_query.time_at
            if temporal_query.end_time_at:
                params["endTimeAt"] = temporal_query.end_time_at
        if temporal_query.attrs:
            params["attrs"] = temporal_query.attrs

        response = requests.get(
            url=f"{self.url}{NGSI_LD_URL_TEMPORAL}",
            headers=headers,
            params=params,
            verify=self.verified,
            timeout=self.timeout,
        )
        return response

    def create_temporal_entity(self, entity: dict, tenant: str, entity_id: str = None):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})

        if CONTEXT_ATTRIBUTE_NAME in entity:
            headers[CONTENT_TYPE_HEADER] = CONTENT_TYPE_JSON_LD
        else:
            headers[CONTENT_TYPE_HEADER] = CONTENT_TYPE_JSON

        response = requests.post(
            url=f"{self.url}{NGSI_LD_URL_TEMPORAL}",
            headers=headers,
            json=entity,
            verify=self.verified,
            timeout=self.timeout,
        )

        if response.status_code in [200, 201]:
            entity_id = entity.get("id")
            context_data = entity.get(CONTEXT_ATTRIBUTE_NAME, None)
            if entity_id and context_data:
                self._store_entity_context(entity_id, context_data, tenant)
        elif response.status_code in [400, 409] and entity_id:
            append_url = f"{self.url}{NGSI_LD_URL_TEMPORAL}/{entity_id}/attrs"
            response = requests.post(
                url=append_url,
                headers=headers,
                json=entity,
                verify=self.verified,
                timeout=self.timeout,
            )

        return response

    def delete_temporal_entity(self, tenant: str, entity_id: str):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})
        url = f"{self.url}{NGSI_LD_URL_TEMPORAL}/{entity_id}"

        response = requests.delete(
            url=url, headers=headers, verify=self.verified, timeout=self.timeout
        )

        return response

    def get_temporal_entity(
        self,
        tenant: str,
        entity_id: str,
        entity_type: str,
        link_header: str,
        accept: str,
        options: str,
        last_n: int,
        temporal_query: TemporalQuery,
    ):
        headers = self.headers.copy()
        headers.update({NGSILD_TENANT_HEADER: tenant})
        headers[ACCEPT_HEADER] = accept
        if link_header:
            headers[LINK_HEADER] = (
                f'<{link_header}>; rel="{JSON_LD_CONTEXT}"; type="{CONTENT_TYPE_JSON_LD}"'
            )

        params = []
        if entity_type:
            params.append(f"type={entity_type}")
        if options:
            params.append(f"options={options}")
        params.append(f"lastN={last_n}")
        if temporal_query.aggr_methods:
            params.append(f"aggrMethods={temporal_query.aggr_methods}")
        if temporal_query.time_property:
            params.append(f"timeproperty={temporal_query.time_property}")
        if temporal_query.aggr_period_duration:
            params.append(f"aggrPeriodDuration={temporal_query.aggr_period_duration}")
        if temporal_query.timerel and temporal_query.time_at:
            params.append(f"timerel={temporal_query.timerel}")
            params.append(f"timeAt={temporal_query.time_at}")
            if temporal_query.end_time_at:
                params.append(f"endTimeAt={temporal_query.end_time_at}")
        if temporal_query.attrs:
            params.append(f"attrs={temporal_query.attrs}")

        base_url = f"{self.url}{NGSI_LD_URL_TEMPORAL}/{entity_id}"
        url = f"{base_url}?{'&'.join(params)}"

        response = requests.get(
            url=url, headers=headers, verify=self.verified, timeout=self.timeout
        )
        return response
