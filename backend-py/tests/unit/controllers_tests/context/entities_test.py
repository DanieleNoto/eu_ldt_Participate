import unittest
from unittest.mock import patch, MagicMock

from fastapi.testclient import TestClient

from config import config
from controllers.context.entities import get_entities_router
from services.context_brokering_clients.scorpio_broker_client import (
    ScorpioBrokerClient,
)

context_brokering_client = ScorpioBrokerClient(config.CONTEXT_DATA_BROKER_URL)
USER = "API USER"

client = TestClient(get_entities_router(context_brokering_client, USER))


class TestAPI(unittest.TestCase):
    def test_options_entities(self):
        response = client.options("/entities")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {})

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.get_entities"
    )
    def test_get_entities(self, mock_get_entities):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"id": "urn:ngsi-ld:Room:Room1", "type": "Room"}
        ]
        mock_response.headers = {
            "Content-Type": "application/json",
            "NGSILD-EntityMap": "map-value",
        }
        mock_get_entities.return_value = mock_response

        response = client.get(
            "/entities",
            headers={
                "type": "Room",
                "scope": "scope1",
                "Link": "some-link-header",
                "Accept": "application/ld+json",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), [{"id": "urn:ngsi-ld:Room:Room1", "type": "Room"}]
        )
        mock_get_entities.assert_called_once_with(
            "scope1", "", "some-link-header", "application/ld+json"
        )

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.get_entities"
    )
    def test_get_entities_failure(self, mock_get_entities):
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {"error": "Not Found"}
        mock_get_entities.return_value = mock_response

        response = client.get(
            "/entities",
            headers={
                "type": "Room",
                "scope": "scope1",
                "Link": "some-link-header",
                "Accept": "application/ld+json",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.reason_phrase, "Bad Request")
        mock_get_entities.assert_called_once_with(
            "scope1", "", "some-link-header", "application/ld+json"
        )

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.get_entity"
    )
    def test_get_entity(self, mock_get_entity):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "urn:ngsi-ld:Room:Room1",
            "type": "Room",
        }
        mock_response.headers = {
            "Content-Type": "application/json",
            "NGSILD-EntityMap": "map-value",
        }
        mock_get_entity.return_value = mock_response

        response = client.get(
            "/entities/urn:ngsi-ld:Room:Room1",
            headers={"scope": "scope1", "Accept": "application/ld+json"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"id": "urn:ngsi-ld:Room:Room1", "type": "Room"}
        )
        mock_get_entity.assert_called_once_with(
            "scope1", "urn:ngsi-ld:Room:Room1", "application/ld+json", ""
        )

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.delete_entity"
    )
    def test_delete_entity(self, mock_delete_entity):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.reason = "Entity deleted"
        mock_response.headers = {"Location": "http://example.com/entity"}
        mock_response.json.return_value = {"message": "Entity deleted"}

        mock_delete_entity.return_value = mock_response

        response = client.delete(
            "/entities/urn:ngsi-ld:Room:Room1", headers={"scope": "scope1"}
        )

        assert response.status_code == 200
        assert response.json() == {"message": "Entity deleted"}
        assert response.headers.get("Location") == "http://example.com/entity"

        mock_delete_entity.assert_called_once_with("scope1", "urn:ngsi-ld:Room:Room1")

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.delete_entity"
    )
    def test_delete_entity_failure(self, mock_delete_entity):
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.json.return_value = {"error": "Not Found"}
        mock_delete_entity.return_value = mock_response

        response = client.delete(
            "/entities/urn:ngsi-ld:Room:RoomNotExist", headers={"scope": "scope1"}
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"error": "Not Found"})
        mock_delete_entity.assert_called_once_with(
            "scope1", "urn:ngsi-ld:Room:RoomNotExist"
        )

    @patch("services.context_brokering_clients.scorpio_broker_client.requests.patch")
    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.get_entity"
    )
    def test_merge_entity_success(self, mock_get_entity, mock_requests_patch):
        mock_get_response = MagicMock()
        mock_get_response.status_code = 200
        mock_get_response.json.return_value = {
            "id": "urn:ngsi-ld:Room:Room1",
            "type": "Room",
            "temperature": {"value": 20, "type": "Property"},
        }
        mock_get_entity.return_value = mock_get_response

        mock_patch_response = MagicMock()
        mock_patch_response.status_code = 204
        mock_requests_patch.return_value = mock_patch_response

        updated_attributes = {"temperature": {"value": 22, "type": "Property"}}

        client_instance = ScorpioBrokerClient("http://example.com")
        response = client_instance.merge_entity(
            tenant="scope1",
            entity_id="urn:ngsi-ld:Room:Room1",
            updated_attributes=updated_attributes,
        )

        self.assertEqual(response.status_code, 204)
        mock_get_entity.assert_called_once_with(
            "scope1", "urn:ngsi-ld:Room:Room1", "application/ld+json", ""
        )
        mock_requests_patch.assert_called_once()
        args, kwargs = mock_requests_patch.call_args
        self.assertTrue(kwargs["json"]["type"] == "Room")
        self.assertTrue(kwargs["json"]["temperature"]["value"] == 22)

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.get_entity"
    )
    def test_merge_entity_get_entity_failure(self, mock_get_entity):
        mock_get_response = MagicMock()
        mock_get_response.status_code = 404
        mock_get_response.json.return_value = {"error": "Not Found"}
        mock_get_entity.return_value = mock_get_response

        client_instance = ScorpioBrokerClient("http://example.com")
        response = client_instance.merge_entity(
            tenant="scope1",
            entity_id="urn:ngsi-ld:Room:Room1",
            updated_attributes={"temperature": {"value": 22, "type": "Property"}},
        )

        self.assertEqual(response.status_code, 404)
        mock_get_entity.assert_called_once()
