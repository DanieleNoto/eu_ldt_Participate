import builtins
import json
import re
import unittest
from unittest.mock import patch, MagicMock, Mock
from services.context_brokering_clients.scorpio_broker_client import (
    ScorpioBrokerClient,
    NGSILD_TENANT_HEADER,
    CONTENT_TYPE_HEADER,
    CONTENT_TYPE_JSON,
    CONTENT_TYPE_JSON_LD,
    CONTEXT_ATTRIBUTE_NAME,
    NGSI_LD_URL_TEMPORAL,
    ACCEPT_HEADER,
    LINK_HEADER,
    JSON_LD_CONTEXT,
    NGSI_LD_URL,
    TemporalQuery,
    GeoQuery,
)


class TestScorpioBrokerClient(unittest.TestCase):
    @patch("requests.get")
    def test_get_entities_success(self, mock_get):
        mock_get.return_value.json.return_value = [{"id": "urn:ngsi-ld:Room:Room1"}]
        mock_get.return_value.status_code = 200

        client = ScorpioBrokerClient("http://localhost:9090")
        response = client.get_entities(
            "default_tenant", "Room", "", "application/ld+json"
        )
        entities = response.json()

        self.assertGreaterEqual(len(entities), 1)
        self.assertEqual(entities[0]["id"], "urn:ngsi-ld:Room:Room1")

    @patch("requests.get")
    def test_get_entity_success(self, mock_get):
        mock_get.return_value.json.return_value = {"id": "urn:ngsi-ld:Room:Room1"}
        mock_get.return_value.status_code = 200

        client = ScorpioBrokerClient("http://localhost:9090")
        response = client.get_entity(
            "default_tenant", "Room:Room1", "", "application/ld+json"
        )
        entity = response.json()

        self.assertEqual(entity["id"], "urn:ngsi-ld:Room:Room1")

    @patch("requests.get")
    def test_get_entity_with_link_header(self, mock_get):
        resp = MagicMock(status_code=200)
        mock_get.return_value = resp
        tenant = "tenantX"
        entity_id = "urn:ngsi-ld:Test:1"
        link_header = "http://example.com/context"
        accept = "application/ld+json"

        client = ScorpioBrokerClient("http://broker")
        result = client.get_entity(tenant, entity_id, accept, link_header)

        expected_headers = client.headers.copy()
        expected_headers.update({NGSILD_TENANT_HEADER: tenant})
        expected_headers[ACCEPT_HEADER] = accept
        expected_headers[LINK_HEADER] = (
            f'<{link_header}>; rel="{JSON_LD_CONTEXT}"; type="{CONTENT_TYPE_JSON_LD}"'
        )
        expected_url = f"http://broker{NGSI_LD_URL}/{entity_id}"
        mock_get.assert_called_once_with(
            url=expected_url,
            headers=expected_headers,
            verify=client.verified,
            timeout=client.timeout,
        )
        self.assertIs(result, resp)

    @patch.object(ScorpioBrokerClient, "_get_entity_context")
    @patch("requests.get")
    def test_get_entity_without_link_header_list_context(self, mock_get, mock_context):
        resp = MagicMock(status_code=200)
        mock_get.return_value = resp
        ctx_url = "http://example.com/list_context"
        mock_context.return_value = [ctx_url]
        tenant = "tenantY"
        entity_id = "urn:ngsi-ld:Test:2"
        link_header = ""
        accept = "application/json"

        client = ScorpioBrokerClient("http://broker")
        result = client.get_entity(tenant, entity_id, accept, link_header)

        expected_headers = client.headers.copy()
        expected_headers.update({NGSILD_TENANT_HEADER: tenant})
        expected_headers[ACCEPT_HEADER] = accept
        expected_headers[LINK_HEADER] = (
            f'<{ctx_url}>; rel="{JSON_LD_CONTEXT}"; type="{CONTENT_TYPE_JSON_LD}"'
        )
        expected_url = f"http://broker{NGSI_LD_URL}/{entity_id}"
        mock_get.assert_called_once_with(
            url=expected_url,
            headers=expected_headers,
            verify=client.verified,
            timeout=client.timeout,
        )
        self.assertIs(result, resp)

    @patch.object(ScorpioBrokerClient, "_get_entity_context")
    @patch("requests.get")
    def test_get_entity_without_link_header_string_context(
        self, mock_get, mock_context
    ):
        resp = MagicMock(status_code=200)
        mock_get.return_value = resp
        ctx_url = "http://example.com/string_context"
        mock_context.return_value = ctx_url
        tenant = "tenantZ"
        entity_id = "urn:ngsi-ld:Test:3"
        link_header = ""
        accept = "*/*"

        client = ScorpioBrokerClient("http://broker")
        result = client.get_entity(tenant, entity_id, accept, link_header)

        expected_headers = client.headers.copy()
        expected_headers.update({NGSILD_TENANT_HEADER: tenant})
        expected_headers[ACCEPT_HEADER] = accept
        expected_headers[LINK_HEADER] = (
            f'<{ctx_url}>; rel="{JSON_LD_CONTEXT}"; type="{CONTENT_TYPE_JSON_LD}"'
        )
        expected_url = f"http://broker{NGSI_LD_URL}/{entity_id}"
        mock_get.assert_called_once_with(
            url=expected_url,
            headers=expected_headers,
            verify=client.verified,
            timeout=client.timeout,
        )
        self.assertIs(result, resp)

    @patch.object(ScorpioBrokerClient, "_get_entity_context")
    @patch("requests.get")
    def test_get_entity_without_link_header_no_context(self, mock_get, mock_context):
        resp = MagicMock(status_code=200)
        mock_get.return_value = resp
        mock_context.return_value = ""
        tenant = "tenantW"
        entity_id = "urn:ngsi-ld:Test:4"
        link_header = ""
        accept = "application/json"

        client = ScorpioBrokerClient("http://broker")
        result = client.get_entity(tenant, entity_id, accept, link_header)

        expected_headers = client.headers.copy()
        expected_headers.update({NGSILD_TENANT_HEADER: tenant})
        expected_headers[ACCEPT_HEADER] = accept
        self.assertNotIn(LINK_HEADER, expected_headers)
        expected_url = f"http://broker{NGSI_LD_URL}/{entity_id}"
        mock_get.assert_called_once_with(
            url=expected_url,
            headers=expected_headers,
            verify=client.verified,
            timeout=client.timeout,
        )
        self.assertIs(result, resp)

    @patch("requests.post")
    @patch.object(ScorpioBrokerClient, "init_database")
    def test_create_entity_success(self, mock_init_db, mock_post):
        mock_post.return_value = MagicMock(status_code=201, reason="Created")
        mock_init_db.return_value = None

        client = ScorpioBrokerClient("http://localhost:9090")
        mock_session = MagicMock()
        client.session = mock_session

        response = client.create_entity(
            {"id": "urn:ngsi-ld:Room:Room1", "@context": "test"}, "default_tenant"
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.reason, "Created")

    @patch("requests.get")
    def test_get_types_success(self, mock_get):
        mock_get.return_value.json.return_value = {"typeList": ["Room", "Device"]}
        mock_get.return_value.status_code = 200

        client = ScorpioBrokerClient("http://localhost:9090")
        response = client.get_types("default_tenant")
        types = response.json()

        self.assertIn("Room", types["typeList"])
        self.assertIn("Device", types["typeList"])

    @patch("requests.post")
    def test_create_entity_failure(self, mock_post):
        mock_post.return_value = MagicMock(status_code=400, reason="Bad Request")

        client = ScorpioBrokerClient("http://localhost:9090")
        response = client.create_entity(
            {"id": "urn:ngsi-ld:Room:Room1"}, "default_tenant"
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.reason, "Bad Request")

    @patch("requests.get")
    def test_get_entity_failure(self, mock_get):
        mock_get.return_value.status_code = 404
        mock_get.return_value.json.return_value = {}

        client = ScorpioBrokerClient("http://localhost:9090")
        response = client.get_entity(
            "default_tenant", "NonExistentEntity", "", "application/ld+json"
        )
        entity = response.json()

        self.assertEqual(response.status_code, 404)
        self.assertEqual(entity, {})

    @patch("requests.get")
    def test_get_types_failure(self, mock_get):
        mock_get.return_value.status_code = 500
        mock_get.return_value.json.return_value = {}

        client = ScorpioBrokerClient("http://localhost:9090")
        response = client.get_types("default_tenant")
        types = response.json()

        self.assertEqual(response.status_code, 500)
        self.assertEqual(types, {})

    @patch("requests.get")
    def test_get_entities_by_geojson_success(self, mock_get):
        mock_get.return_value.json.return_value = [{"id": "urn:ngsi-ld:Location:1"}]
        mock_get.return_value.status_code = 200

        geojson_query = [[[1.0, 2.0], [3.0, 4.0], [5.0, 6.0], [1.0, 2.0]]]
        entity_type = "Location"
        georel = "within"
        geometry = "Polygon"
        coordinates = geojson_query
        geoproperty = "location"
        tenant = "default_tenant"
        link_header = "http://example.com/context"
        accept = "application/ld+json"

        client = ScorpioBrokerClient("http://localhost:9090")
        response = client.get_entities_by_geojson(
            tenant,
            entity_type,
            geoproperty,
            georel,
            geometry,
            coordinates,
            link_header,
            accept,
        )
        entities = response.json()

        expected_url = (
            "http://localhost:9090/ngsi-ld/v1/entities/"
            "?type=Location&geoproperty=location&geometry=Polygon&coordinates={}".format(
                coordinates
            )
            + "&georel=within"
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(entities), 1)
        self.assertEqual(entities[0]["id"], "urn:ngsi-ld:Location:1")
        mock_get.assert_called_once_with(
            url=expected_url,
            headers={
                "NGSILD-Tenant": tenant,
                "Accept": accept,
                "Link": '<http://example.com/context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"',
            },
            verify=client.verified,
            timeout=client.timeout,
        )

    @patch("requests.get")
    def test_get_entities_by_geojson_without_georel_or_link(self, mock_get):
        mock_get.return_value.json.return_value = [{"id": "urn:ngsi-ld:Location:2"}]
        mock_get.return_value.status_code = 200

        geojson_query = [[[7.0, 8.0], [9.0, 10.0], [11.0, 12.0], [7.0, 8.0]]]
        entity_type = "Building"
        geometry = "Polygon"
        coordinates = geojson_query
        geoproperty = "location"
        tenant = "test_tenant"
        accept = "application/ld+json"

        client = ScorpioBrokerClient("http://localhost:9090")
        response = client.get_entities_by_geojson(
            tenant, entity_type, geoproperty, "", geometry, coordinates, "", accept
        )
        entities = response.json()

        expected_url = (
            "http://localhost:9090/ngsi-ld/v1/entities/"
            "?type=Building&geoproperty=location&geometry=Polygon&coordinates={}".format(
                coordinates
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(entities), 1)
        self.assertEqual(entities[0]["id"], "urn:ngsi-ld:Location:2")
        mock_get.assert_called_once_with(
            url=expected_url,
            headers={
                "NGSILD-Tenant": tenant,
                "Accept": accept,
            },
            verify=client.verified,
            timeout=client.timeout,
        )

    @patch.object(ScorpioBrokerClient, "get_entity")
    @patch("requests.patch")
    def test_merge_entity_success(self, mock_get, mock_patch):
        mock_response = MagicMock()
        mock_response.status_code = 204
        mock_patch.return_value = mock_response
        mock_get.return_value = ""

        client = ScorpioBrokerClient("http://localhost:9090")
        tenant = "default_tenant"
        entity_id = "urn:ngsi-ld:Room:Room1"
        updated_attributes = {"temperature": {"value": 25}}

        response = client.merge_entity(tenant, entity_id, updated_attributes)

        self.assertEqual(response.status_code, 204)
        mock_patch.assert_called_once()

    @patch.object(ScorpioBrokerClient, "get_entity")
    @patch("requests.patch")
    def test_merge_entity_failure(self, mock_get, mock_patch):
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.reason = "Bad Request"
        mock_patch.return_value = mock_response
        mock_get.return_value = ""

        client = ScorpioBrokerClient("http://localhost:9090")
        tenant = "default_tenant"
        entity_id = "urn:ngsi-ld:Room:Room1"
        updated_attributes = {"temperature": {"value": 25}}

        response = client.merge_entity(tenant, entity_id, updated_attributes)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.reason, "Bad Request")
        mock_patch.assert_called_once()

    @patch.object(ScorpioBrokerClient, "get_entity")
    @patch("requests.put")
    def test_replace_entity_success(self, mock_put, mock_get):
        mock_put.return_value = MagicMock(status_code=204)
        mock_get.return_value = MagicMock(status_code=200)
        mock_get.return_value.json.return_value = {
            "id": "urn:ngsi-ld:Room:Room1",
            "temperature": {"value": 23},
        }

        client = ScorpioBrokerClient("http://localhost:9090")
        tenant = "default_tenant"
        entity_id = "urn:ngsi-ld:Room:Room1"
        updated_attributes = {"temperature": {"value": 25}}

        response = client.replace_entity(tenant, entity_id, updated_attributes)

        self.assertEqual(response.status_code, 204)
        mock_put.assert_called_once()

    @patch.object(ScorpioBrokerClient, "get_entity")
    @patch("requests.put")
    def test_update_entity_failure(self, mock_put, mock_get):
        mock_put.return_value = MagicMock(status_code=400, reason="Bad Request")
        mock_get.return_value = MagicMock(status_code=200)
        mock_get.return_value.json.return_value = {
            "id": "urn:ngsi-ld:Room:Room1",
            "temperature": {"value": 23},
        }

        client = ScorpioBrokerClient("http://localhost:9090")
        tenant = "default_tenant"
        entity_id = "urn:ngsi-ld:Room:Room1"
        updated_attributes = {"temperature": {"value": 25}}

        response = client.replace_entity(
            tenant,
            entity_id,
            updated_attributes,
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.reason, "Bad Request")
        mock_put.assert_called_once()

    @patch("config.database.SessionLocal", autospec=True)
    def test_get_tenants(self, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        mock_client = ScorpioBrokerClient(url="http://example.com")
        mock_client.session = mock_session

        mock_session.execute.return_value.fetchall.return_value = [
            ("tenant1",),
            ("tenant2",),
            ("tenant3",),
        ]

        tenants = mock_client.get_tenants()

        self.assertEqual(tenants, ["tenant1", "tenant2", "tenant3"])

        expected_query = "SELECT tenant_id FROM public.tenant"

        actual_query = (
            str(mock_session.execute.call_args[0][0]).replace("\n", "").strip()
        )

        expected_query_cleaned = re.sub(r"\s+", " ", expected_query)
        actual_query_cleaned = re.sub(r"\s+", " ", actual_query)

        self.assertEqual(expected_query_cleaned, actual_query_cleaned)

        mock_session.close.assert_called_once()

    @patch("config.database.SessionLocal", autospec=True)
    def test_get_tenants_empty(self, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        mock_client = ScorpioBrokerClient(url="http://example.com")
        mock_client.session = mock_session

        mock_session.execute.return_value.fetchall.return_value = []

        tenants = mock_client.get_tenants()

        self.assertEqual(tenants, [])

        expected_query = "SELECT tenant_id FROM public.tenant"

        actual_query = (
            str(mock_session.execute.call_args[0][0]).replace("\n", "").strip()
        )

        expected_query_cleaned = re.sub(r"\s+", " ", expected_query)
        actual_query_cleaned = re.sub(r"\s+", " ", actual_query)

        self.assertEqual(expected_query_cleaned, actual_query_cleaned)

        mock_session.close.assert_called_once()

    @patch("config.database.SessionLocal", autospec=True)
    def test_get_tenants_with_error(self, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        mock_client = ScorpioBrokerClient(url="http://example.com")
        mock_client.session = mock_session

        mock_session.execute.side_effect = Exception("Database error")

        tenants = mock_client.get_tenants()

        self.assertEqual(tenants, [])
        mock_session.rollback.assert_called_once()
        mock_session.close.assert_called_once()

    @patch("requests.delete")
    def test_delete_entity_success(self, mock_delete):
        mock_delete.return_value.status_code = 200
        mock_delete.return_value.json.return_value = None

        client = ScorpioBrokerClient("http://localhost:9090")
        response = client.delete_entity("default_tenant", "Room:Room1")
        status_code = response.status_code

        self.assertEqual(status_code, 200)
        self.assertIsNone(response.json())

    @patch("requests.delete")
    def test_delete_entity_failure(self, mock_delete):
        mock_delete.return_value.status_code = 404
        mock_delete.return_value.json.return_value = {
            "type": "https://uri.etsi.org/ngsi-ld/errors/ResourceNotFound",
            "title": "Resource not found.",
            "detail": "Resource not found.",
            "status": 404,
        }

        client = ScorpioBrokerClient("http://localhost:9090")
        response = client.delete_entity("default_tenant", "Room:Bad")
        status_code = response.status_code

        self.assertEqual(status_code, 404)
        json_response = response.json()
        expected_json = {
            "type": "https://uri.etsi.org/ngsi-ld/errors/ResourceNotFound",
            "title": "Resource not found.",
            "detail": "Resource not found.",
            "status": 404,
        }
        self.assertEqual(json_response, expected_json)

    @patch.object(ScorpioBrokerClient, "get_entity")
    @patch.object(ScorpioBrokerClient, "merge_entity")
    def test_update_entity_modification(self, mock_merge_entity, mock_get_entity):
        current_entity = {
            "id": "urn:ngsi-ld:Room:Room1",
            "attr1": "old_value1",
            "attr2": "old_value2",
        }
        updated_attributes = {
            "id": "urn:ngsi-ld:Room:Room1",
            "attr1": "new_value1",
            "attr2": "new_value2",
        }
        mock_get_entity.return_value = MagicMock(
            status_code=200, json=lambda: current_entity
        )

        client = ScorpioBrokerClient("http://localhost:9090")
        client.update_entity(
            "default_tenant", "urn:ngsi-ld:Room:Room1", "", updated_attributes
        )

        mock_merge_entity.assert_called_once_with(
            "default_tenant",
            "urn:ngsi-ld:Room:Room1",
            updated_attributes,
        )

    @patch.object(ScorpioBrokerClient, "get_entity")
    def test_update_entity_entity_not_found(self, mock_get_entity):
        expected_response = {
            "type": "https://uri.etsi.org/ngsi-ld/errors/ResourceNotFound",
            "title": "Resource not found.",
            "detail": "urn:cockatoo:big was not found",
            "instanceId": "urn:cockatoo:big",
            "status": 404,
        }

        mock_get_entity.return_value = MagicMock(
            status_code=404, json=lambda: expected_response
        )

        client = ScorpioBrokerClient("http://localhost:9090")

        result = client.update_entity(
            "default_tenant", "urn:cockatoo:big", "", {"attr1": "value"}
        )

        self.assertEqual(result.status_code, expected_response.get("status"))

    def test_entity_context_found(self):
        client = ScorpioBrokerClient("http://localhost:9090")
        client.session = MagicMock()
        mock_context_value = json.dumps({"key": "value"})
        mock_entity_context = MagicMock()
        mock_entity_context.context.context = mock_context_value
        client.session.query.return_value.filter_by.return_value.first.return_value = (
            mock_entity_context
        )

        result = client._get_entity_context("test_entity")
        self.assertEqual(result, {"key": "value"})
        client.session.close.assert_called_once()

    def test_entity_context_not_found(self):
        client = ScorpioBrokerClient("http://localhost:9090")
        client.session = MagicMock()
        client.session.query.return_value.filter_by.return_value.first.return_value = (
            None
        )

        result = client._get_entity_context("missing_entity")
        self.assertEqual(result, "")
        client.session.close.assert_called_once()

    def test_session_not_initialized(self):
        client = ScorpioBrokerClient("http://localhost:9090")

        mock_session = Mock()
        mock_session.query.side_effect = ValueError("Database session not initialized.")
        client.session = mock_session

        with patch.object(builtins, "print") as mock_print:
            result = client._get_entity_context("test_entity")
            self.assertEqual(result, "")
            mock_print.assert_called_with(
                "Error retrieving entity context: Database session not initialized."
            )

    def test_exception_during_query(self):
        client = ScorpioBrokerClient("http://localhost:9090")
        client.session = MagicMock()
        client.session.query.side_effect = Exception("DB error")

        with patch("builtins.print") as mock_print:
            result = client._get_entity_context("test_entity")
            self.assertEqual(result, "")
            client.session.rollback.assert_called_once()
            client.session.close.assert_called_once()
            mock_print.assert_called_with("Error retrieving entity context: DB error")

    def test_session_not_initialized_for_delete(self):
        client = ScorpioBrokerClient("http://localhost:9090")
        mock_session = Mock()
        mock_session.query.side_effect = ValueError("Database session not initialized.")
        client.session = mock_session

        with patch.object(builtins, "print") as mock_print:
            result = client._delete_entity_context("test_entity")
            self.assertEqual(result, None)
            mock_print.assert_called_with(
                "Error deleting entity context: Database session not initialized."
            )

    def test_entity_context_deleted_successfully(self):
        client = ScorpioBrokerClient("http://localhost:9090")

        mock_session = Mock()
        mock_entity_context = Mock()
        mock_entity_context.is_deleted = False
        mock_session.query().filter_by().first.return_value = mock_entity_context
        client.session = mock_session

        with patch("builtins.print") as mock_print:
            client._delete_entity_context("test_entity")

            self.assertTrue(mock_entity_context.is_deleted)
            mock_session.commit.assert_called_once()
            mock_print.assert_not_called()

    def test_entity_context_not_found_delete(self):
        client = ScorpioBrokerClient("http://localhost:9090")

        mock_session = Mock()
        mock_session.query().filter_by().first.return_value = None
        client.session = mock_session

        with patch("builtins.print") as mock_print:
            client._delete_entity_context("test_entity")
            mock_print.assert_called_with("Entity context not found.")

    def test_delete_entity_context_exception(self):
        client = ScorpioBrokerClient("http://localhost:9090")

        mock_session = Mock()
        mock_session.query().filter_by().first.side_effect = Exception("Test exception")
        client.session = mock_session

        with patch("builtins.print") as mock_print:
            client._delete_entity_context("test_entity")
            mock_print.assert_called_with(
                "Error deleting entity context: Test exception"
            )
            mock_session.rollback.assert_called_once()

    @patch("requests.post")
    @patch.object(ScorpioBrokerClient, "_store_entity_context")
    def test_create_temporal_entity_with_context_success(self, mock_store, mock_post):
        entity = {
            "id": "urn:ngsi-ld:Temp:1",
            CONTEXT_ATTRIBUTE_NAME: {
                "@vocab": "urn:test:"
            },  # Adjust if constant exists
        }
        tenant = "tenant1"
        resp = MagicMock(status_code=201)
        mock_post.return_value = resp

        client = ScorpioBrokerClient("http://broker")
        result = client.create_temporal_entity(entity, tenant)

        expected_headers = client.headers.copy()
        expected_headers.update(
            {NGSILD_TENANT_HEADER: tenant, CONTENT_TYPE_HEADER: CONTENT_TYPE_JSON_LD}
        )
        mock_post.assert_called_once_with(
            url=f"http://broker{NGSI_LD_URL_TEMPORAL}",
            headers=expected_headers,
            json=entity,
            verify=client.verified,
            timeout=client.timeout,
        )
        mock_store.assert_called_once_with(
            entity.get("id"),
            entity.get(CONTEXT_ATTRIBUTE_NAME),  # Adjust if constant exists
            tenant,
        )
        self.assertIs(result, resp)

    @patch("requests.post")
    @patch.object(ScorpioBrokerClient, "_store_entity_context")
    def test_create_temporal_entity_without_context_success(
        self, mock_store, mock_post
    ):
        entity = {"id": "urn:ngsi-ld:Temp:2", "someAttr": 123}
        tenant = "tenant2"
        resp = MagicMock(status_code=200)
        mock_post.return_value = resp

        client = ScorpioBrokerClient("http://broker")
        result = client.create_temporal_entity(entity, tenant)

        expected_headers = client.headers.copy()
        expected_headers.update(
            {NGSILD_TENANT_HEADER: tenant, CONTENT_TYPE_HEADER: CONTENT_TYPE_JSON}
        )
        mock_post.assert_called_once_with(
            url=f"http://broker{NGSI_LD_URL_TEMPORAL}",
            headers=expected_headers,
            json=entity,
            verify=client.verified,
            timeout=client.timeout,
        )
        mock_store.assert_not_called()
        self.assertIs(result, resp)

    @patch("requests.post")
    @patch.object(ScorpioBrokerClient, "_store_entity_context")
    def test_create_temporal_entity_conflict_appending(self, mock_store, mock_post):
        entity = {"id": "IgnoredID", "attr": 5}
        tenant = "tenant3"
        resp1 = MagicMock(status_code=409)
        resp2 = MagicMock(status_code=201)
        mock_post.side_effect = [resp1, resp2]

        client = ScorpioBrokerClient("http://broker")
        result = client.create_temporal_entity(entity, tenant, entity_id="CustomID")

        expected_base = f"http://broker{NGSI_LD_URL_TEMPORAL}"
        expected_append = f"http://broker{NGSI_LD_URL_TEMPORAL}/CustomID/attrs"
        headers_base = client.headers.copy()
        headers_base.update(
            {NGSILD_TENANT_HEADER: tenant, CONTENT_TYPE_HEADER: CONTENT_TYPE_JSON}
        )
        self.assertEqual(mock_post.call_args_list[0][1]["url"], expected_base)
        self.assertEqual(mock_post.call_args_list[1][1]["url"], expected_append)
        mock_store.assert_not_called()
        self.assertIs(result, resp2)

    @patch("requests.post")
    @patch.object(ScorpioBrokerClient, "_store_entity_context")
    def test_create_temporal_entity_error_no_retry(self, mock_store, mock_post):
        entity = {"id": "urn:ngsi-ld:Temp:4", "attr": 6}
        tenant = "tenant4"
        resp = MagicMock(status_code=400)
        mock_post.return_value = resp

        client = ScorpioBrokerClient("http://broker")
        result = client.create_temporal_entity(entity, tenant)

        mock_post.assert_called_once()
        mock_store.assert_not_called()
        self.assertIs(result, resp)

    @patch("requests.get")
    def test_get_temporal_entity_with_link_and_options(self, mock_get):
        mock_resp = MagicMock(status_code=200)
        mock_get.return_value = mock_resp

        client = ScorpioBrokerClient("http://localhost:9090")
        tenant = "tenantX"
        entity_id = "Temp:123"
        entity_type = "Device"
        link_header = "http://example.com/context"
        accept = "application/ld+json"
        options = "keyValues"
        last_n = 5
        temporal_query = TemporalQuery()

        response = client.get_temporal_entity(
            tenant,
            entity_id,
            entity_type,
            link_header,
            accept,
            options,
            last_n,
            temporal_query,
        )

        expected_headers = client.headers.copy()
        expected_headers.update(
            {
                NGSILD_TENANT_HEADER: tenant,
                ACCEPT_HEADER: accept,
                LINK_HEADER: (
                    f'<{link_header}>; rel="{JSON_LD_CONTEXT}"; '
                    f'type="{CONTENT_TYPE_JSON_LD}"'
                ),
            }
        )

        base_url = f"http://localhost:9090{NGSI_LD_URL_TEMPORAL}/{entity_id}"
        expected_url = f"{base_url}?type={entity_type}&options={options}&lastN={last_n}"

        mock_get.assert_called_once_with(
            url=expected_url,
            headers=expected_headers,
            verify=client.verified,
            timeout=client.timeout,
        )
        self.assertIs(response, mock_resp)

    @patch("requests.get")
    def test_get_temporal_entity_without_link_and_without_options(self, mock_get):
        mock_resp = MagicMock(status_code=204)
        mock_get.return_value = mock_resp

        client = ScorpioBrokerClient("http://broker")
        tenant = "tenantY"
        entity_id = "Temp:456"
        entity_type = "Device"
        link_header = ""
        accept = "application/json"
        options = ""
        last_n = 10
        temporal_query = TemporalQuery()

        response = client.get_temporal_entity(
            tenant,
            entity_id,
            entity_type,
            link_header,
            accept,
            options,
            last_n,
            temporal_query,
        )

        expected_headers = client.headers.copy()
        expected_headers.update(
            {
                NGSILD_TENANT_HEADER: tenant,
                ACCEPT_HEADER: accept,
            }
        )

        base_url = f"http://broker{NGSI_LD_URL_TEMPORAL}/{entity_id}"
        expected_url = f"{base_url}?type=Device&lastN={last_n}"

        mock_get.assert_called_once_with(
            url=expected_url,
            headers=expected_headers,
            verify=client.verified,
            timeout=client.timeout,
        )
        self.assertIs(response, mock_resp)

    @patch("requests.get")
    def test_get_temporal_entities_minimal_params(self, mock_get):
        mock_response = MagicMock(
            status_code=200, json=lambda: [{"id": "urn:ngsi-ld:Sensor:001"}]
        )
        mock_get.return_value = mock_response

        client = ScorpioBrokerClient("http://localhost:9090")
        geo_query = GeoQuery()
        temporal_query = TemporalQuery()
        response = client.get_temporal_entities(
            tenant="default_tenant",
            entity_type="Sensor",
            link_header="",
            accept="application/ld+json",
            options="",
            last_n=5,
            geo_query=geo_query,
            temporal_query=temporal_query,
        )

        self.assertEqual(response.status_code, 200)
        mock_get.assert_called_once()
        called_params = mock_get.call_args[1]["params"]
        self.assertEqual(called_params["type"], "Sensor")
        self.assertEqual(called_params["lastN"], 5)
        self.assertNotIn("georel", called_params)
        self.assertNotIn("options", called_params)

    @patch("requests.get")
    def test_get_temporal_entities_all_params(self, mock_get):
        mock_response = MagicMock(
            status_code=200, json=lambda: [{"id": "urn:ngsi-ld:Sensor:002"}]
        )
        mock_get.return_value = mock_response

        client = ScorpioBrokerClient("http://localhost:9090")
        geo_query = GeoQuery(
            geoproperty="location",
            georel="near;maxDistance==1500",
            geometry="Point",
            coordinates="[24.0,60.0]",
        )
        temporal_query = TemporalQuery(
            aggr_methods="avg",
            time_property="observedAt",
            aggr_period_duration="PT1H",
            timerel="after",
            time_at="2024-01-01T00:00:00Z",
            end_time_at="2024-01-02T00:00:00Z",
        )
        response = client.get_temporal_entities(
            tenant="default_tenant",
            entity_type="Sensor",
            link_header="http://example.com/context",
            accept="application/ld+json",
            options="sysAttrs",
            last_n=10,
            geo_query=geo_query,
            temporal_query=temporal_query,
        )

        self.assertEqual(response.status_code, 200)
        mock_get.assert_called_once()

        called_params = mock_get.call_args[1]["params"]
        expected = {
            "type": "Sensor",
            "lastN": 10,
            "options": "sysAttrs",
            "geoproperty": "location",
            "georel": "near;maxDistance==1500",
            "geometry": "Point",
            "coordinates": "[24.0,60.0]",
            "aggrMethods": "avg",
            "timeproperty": "observedAt",
            "aggrPeriodDuration": "PT1H",
            "timerel": "after",
            "timeAt": "2024-01-01T00:00:00Z",
            "endTimeAt": "2024-01-02T00:00:00Z",
        }
        for key, val in expected.items():
            self.assertIn(key, called_params)
            self.assertEqual(called_params[key], val)

        headers = mock_get.call_args[1]["headers"]
        self.assertEqual(headers[NGSILD_TENANT_HEADER], "default_tenant")
        self.assertEqual(headers[ACCEPT_HEADER], "application/ld+json")
        self.assertIn(LINK_HEADER, headers)
        self.assertIn("http://example.com/context", headers[LINK_HEADER])

    @patch("requests.get")
    def test_georel_raw_string_is_passed_through(self, mock_get):
        mock_get.return_value = MagicMock(status_code=200)
        client = ScorpioBrokerClient("http://localhost:9090")

        geo_query = GeoQuery(georel="near;maxDistance==1500")
        temporal_query = TemporalQuery()
        client.get_temporal_entities(
            tenant="t",
            entity_type="E",
            link_header="",
            accept="a",
            options="",
            last_n=1,
            geo_query=geo_query,
            temporal_query=temporal_query,
        )

        called_params = mock_get.call_args[1]["params"]
        self.assertIn("georel", called_params)
        self.assertEqual(called_params["georel"], "near;maxDistance==1500")

    @patch("requests.get")
    def test_georel_encoded_string_is_decoded(self, mock_get):
        from urllib.parse import unquote

        mock_get.return_value = MagicMock(status_code=200)
        client = ScorpioBrokerClient("http://localhost:9090")

        encoded = "near%3BmaxDistance==1500"
        geo_query = GeoQuery(georel=encoded)
        temporal_query = TemporalQuery()
        client.get_temporal_entities(
            tenant="t",
            entity_type="E",
            link_header="",
            accept="a",
            options="",
            last_n=1,
            geo_query=geo_query,
            temporal_query=temporal_query,
        )

        called_params = mock_get.call_args[1]["params"]
        self.assertEqual(called_params["georel"], unquote(encoded))

    @patch("requests.post")
    def test_batch_update_entities(self, mock_post):
        mock_response = MagicMock(status_code=204)
        mock_post.return_value = mock_response

        client = ScorpioBrokerClient("http://localhost:9090")
        entities_with_context = [
            {"id": "urn:ngsi-ld:Device:001", "@context": "https://example.com/context"}
        ]
        entities_without_context = [{"id": "urn:ngsi-ld:Device:002", "type": "Device"}]
        tenant = "default_tenant"

        response = client.batch_update_entities(entities_with_context, tenant)
        self.assertEqual(response.status_code, 204)
        mock_post.assert_called_with(
            url="http://localhost:9090/ngsi-ld/v1/entityOperations/update",
            headers={
                "NGSILD-Tenant": tenant,
                "Content-Type": "application/ld+json",
            },
            json=entities_with_context,
            verify=client.verified,
            timeout=client.timeout,
        )

        mock_post.reset_mock()

        response = client.batch_update_entities(entities_without_context, tenant)
        self.assertEqual(response.status_code, 204)
        mock_post.assert_called_with(
            url="http://localhost:9090/ngsi-ld/v1/entityOperations/update",
            headers={
                "NGSILD-Tenant": tenant,
                "Content-Type": "application/json",
            },
            json=entities_without_context,
            verify=client.verified,
            timeout=client.timeout,
        )

    @patch("requests.post")
    @patch.object(ScorpioBrokerClient, "_delete_entity_context")
    def test_batch_delete_entities_success(self, mock_delete_context, mock_post):
        """Test batch delete when server returns 204."""
        mock_post.return_value = MagicMock(status_code=204)

        client = ScorpioBrokerClient("http://localhost:9090")
        entity_ids = ["urn:ngsi-ld:Entity:001", "urn:ngsi-ld:Entity:002"]
        tenant = "default_tenant"

        response = client.batch_delete_entities(entity_ids, tenant)

        self.assertEqual(response.status_code, 204)
        mock_post.assert_called_once_with(
            url="http://localhost:9090/ngsi-ld/v1/entityOperations/delete",
            headers={
                **client.headers,
                "NGSILD-Tenant": tenant,
                "Content-Type": "application/json",
            },
            json=entity_ids,
            verify=client.verified,
            timeout=client.timeout,
        )
        self.assertEqual(mock_delete_context.call_count, len(entity_ids))
        mock_delete_context.assert_any_call("urn:ngsi-ld:Entity:001")
        mock_delete_context.assert_any_call("urn:ngsi-ld:Entity:002")
