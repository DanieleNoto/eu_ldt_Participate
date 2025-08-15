import unittest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from config import config
from controllers.context.types import get_types_router
from services.context_brokering_clients.scorpio_broker_client import (
    ScorpioBrokerClient,
)

context_brokering_client = ScorpioBrokerClient(config.CONTEXT_DATA_BROKER_URL)
USER = "API USER"
client = TestClient(get_types_router(context_brokering_client, USER))


class TestGetTypesRouter(unittest.TestCase):
    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.get_types"
    )
    def test_get_types(self, mock_get_types):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = ["Room", "Building"]
        mock_get_types.return_value = mock_response

        response = client.get("/types", headers={"scope": "scope1"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), ["Room", "Building"])
        mock_get_types.assert_called_once_with("scope1", "")

    @patch(
        "services.context_brokering_clients.scorpio_broker_client.ScorpioBrokerClient.get_types"
    )
    def test_get_types_failure(self, mock_get_types):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "urn:ngsi-ld:EntityTypeList:1",
            "type": "EntityTypeList",
            "ngsi-ld:typeList": [],
        }
        mock_get_types.return_value = mock_response

        response = client.get("/types", headers={"scope": "scope1"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": "urn:ngsi-ld:EntityTypeList:1",
                "type": "EntityTypeList",
                "ngsi-ld:typeList": [],
            },
        )
