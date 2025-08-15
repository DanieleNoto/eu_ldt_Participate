import unittest
from unittest.mock import patch, MagicMock, ANY

from fastapi.testclient import TestClient

from config import config
from controllers.context.temporals import get_temporals_router
from services.context_brokering_clients.scorpio_broker_client import (
    ScorpioBrokerClient,
)

context_brokering_client = ScorpioBrokerClient(config.CONTEXT_DATA_BROKER_URL)
USER = "API USER"

client = TestClient(get_temporals_router(context_brokering_client, USER))


class TestTemporalAPI(unittest.TestCase):
    def setUp(self):
        self.base_headers = {"scope": "test-scope"}

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.create_temporal_entity"
    )
    def test_create_temporal_entity_success(self, mock_create):
        mock_response = MagicMock(status_code=201)
        mock_response.json.return_value = {"id": "urn:test:1"}
        mock_response.reason = {"id": "urn:test:1"}
        mock_response.headers = {"Location": "fake"}
        mock_create.return_value = mock_response

        payload = {
            "id": "urn:test:1",
            "type": "Vehicle",
            "brandName": [
                {"type": "Property", "value": "Tesla", "instanceId": "urn:1"}
            ],
        }
        response = client.post(
            "/temporal/entities", json=payload, headers=self.base_headers
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {"message": {"id": "urn:test:1"}})
        expected_body = {**payload, "name": None}
        mock_create.assert_called_once_with(expected_body, "test-scope")

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.create_temporal_entity"
    )
    def test_create_temporal_entity_failure(self, mock_create):
        mock_response = MagicMock(status_code=500)
        mock_response.json.return_value = {"error": "Oops"}
        mock_response.reason = {"error": "Oops"}
        mock_response.headers = {"Location": "fake"}
        mock_create.return_value = mock_response

        payload = {"id": "urn:test:2", "type": "Sensor"}
        response = client.post(
            "/temporal/entities", json=payload, headers=self.base_headers
        )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"error": "Oops"})
        expected_body = {**payload, "name": None}
        mock_create.assert_called_once_with(expected_body, "test-scope")

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.get_temporal_entities"
    )
    def test_get_temporal_entities_success(self, mock_get):
        mock_resp = MagicMock(status_code=200)
        mock_resp.json.return_value = [{"id": "urn:test:3"}]
        mock_resp.headers = {"Content-Type": "application/ld+json"}
        mock_get.return_value = mock_resp

        params = {
            "type": "Room",
            "geoproperty": "location",
            "georel": "near;maxDistance==100",
            "geometry": "Point",
            "coordinates": "[1,2]",
        }
        headers = {
            **self.base_headers,
            "Link": "<http://example.com>",
            "Accept": "application/ld+json",
            "options": "sysAttrs",
            "aggrMethods": "avg",
            "timeproperty": "modifiedAt",
            "aggrPeriodDuration": "PT1H",
            "timerel": "after",
            "timeAt": "2022-01-01T00:00:00Z",
            "endTimeAt": "2022-01-02T00:00:00Z",
            "attrs": "speed",
        }
        response = client.get("/temporal/entities", params=params, headers=headers)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [{"id": "urn:test:3"}])
        mock_get.assert_called_once_with(
            tenant="test-scope",
            entity_type="Room",
            link_header="<http://example.com>",
            accept="application/ld+json",
            options="sysAttrs",
            last_n=100,
            geo_query=ANY,
            temporal_query=ANY,
        )

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.get_temporal_entities"
    )
    def test_get_temporal_entities_failure(self, mock_get):
        mock_resp = MagicMock(status_code=500)
        mock_resp.json.return_value = {"error": "Internal"}
        mock_resp.headers = {"Content-Type": "application/json"}
        mock_get.return_value = mock_resp

        response = client.get("/temporal/entities", headers=self.base_headers)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"error": "Internal"})
        mock_get.assert_called_once()

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.delete_temporal_entity"
    )
    def test_delete_temporal_entity(self, mock_delete):
        mock_resp = MagicMock(status_code=204)
        mock_resp.headers = {}
        mock_delete.return_value = mock_resp

        response = client.delete(
            "/temporal/entities/urn:test:4", headers=self.base_headers
        )
        self.assertEqual(response.status_code, 204)
        mock_delete.assert_called_once_with("test-scope", "urn:test:4")

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.get_temporal_entity"
    )
    def test_get_temporal_entity_success(self, mock_get_single):
        mock_resp = MagicMock(status_code=200)
        mock_resp.json.return_value = {"id": "urn:test:5"}
        mock_resp.headers = {"Content-Type": "application/ld+json"}
        mock_get_single.return_value = mock_resp

        headers = {
            **self.base_headers,
            "Link": "link",
            "Accept": "application/ld+json",
            "options": "sysAttrs",
            "aggrMethods": "",
            "timeproperty": "",
            "aggrPeriodDuration": "",
            "timerel": "",
            "timeAt": "",
            "endTimeAt": "",
            "attrs": "",
        }
        response = client.get(
            "/temporal/entities/urn:test:5", params={"type": "Thing"}, headers=headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"id": "urn:test:5"})
        mock_get_single.assert_called_once_with(
            tenant="test-scope",
            entity_id="urn:test:5",
            entity_type="Thing",
            link_header="link",
            accept="application/ld+json",
            options="sysAttrs",
            last_n=100,
            temporal_query=ANY,
        )

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.get_temporal_entity"
    )
    def test_get_temporal_entity_failure(self, mock_get_single):
        mock_resp = MagicMock(status_code=404)
        mock_resp.json.return_value = {"error": "Not found"}
        mock_resp.headers = {"Content-Type": "application/json"}
        mock_get_single.return_value = mock_resp

        response = client.get(
            "/temporal/entities/does-not-exist", headers=self.base_headers
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"error": "Not found"})
        mock_get_single.assert_called_once()
