import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from fastapi import FastAPI
from routes.data_source.data_source_routes import router
from datetime import datetime, timezone

app = FastAPI()
app.include_router(router)

client = TestClient(app)

TEST_CONNECTION_STRING = "localhost:5432/test"


class DataSourceRoutesTest(unittest.TestCase):
    def setUp(self):
        self.payload = {
            "name": "TestSource",
            "type": "PostgreSQL",
            "user": "admin",
            "connection_string": TEST_CONNECTION_STRING,
            "password": "secret",
        }

    @patch("routes.data_source.data_source_routes.controller.store_data")
    def test_store_data_route(self, mock_store_data):
        mock_store_data.return_value = {
            "id": 1,
            "name": "TestSource",
            "type": "PostgreSQL",
            "connection_string": TEST_CONNECTION_STRING,
            "user": "admin",
            "password": "secret",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "is_deleted": False,
            "is_hidden": False,
        }
        response = client.post("/datastorage", json=self.payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["name"], "TestSource")
        mock_store_data.assert_called_once()

    @patch("routes.data_source.data_source_routes.controller.test_connection")
    def test_test_connection_route(self, mock_test_connection):
        mock_test_connection.return_value = {"message": "Connection successful"}
        response = client.post("/datastorage/test-connection", json=self.payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Connection successful")
        mock_test_connection.assert_called_once()

    @patch("routes.data_source.data_source_routes.controller.get_datastorage_list")
    def test_get_datastorage_list_route(self, mock_get_list):
        mock_get_list.return_value = [
            {
                "id": 1,
                "name": "TestSource",
                "type": "PostgreSQL",
                "connection_string": TEST_CONNECTION_STRING,
                "user": "admin",
                "password": "secret",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "is_deleted": False,
                "is_hidden": False,
            }
        ]
        response = client.get(
            "/datastorage/list?name=TestSource&type=PostgreSQL&user=admin"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        self.assertEqual(response.json()[0]["name"], "TestSource")
        mock_get_list.assert_called_once()

    @patch("routes.data_source.data_source_routes.controller.delete_data_source")
    def test_delete_data_storage_route_success(self, mock_delete):
        mock_delete.return_value = {
            "id": 1,
            "name": "TestSource",
            "type": "PostgreSQL",
            "connection_string": TEST_CONNECTION_STRING,
            "user": "admin",
            "password": "secret",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "is_deleted": True,
            "is_hidden": False,
        }
        response = client.delete("/datastorage/1")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["is_deleted"])
        mock_delete.assert_called_once_with(1, unittest.mock.ANY)

    @patch("routes.data_source.data_source_routes.controller.update_data")
    def test_update_data_storage_route(self, mock_update):
        updated_payload = self.payload.copy()
        updated_payload["name"] = "UpdatedSource"

        mock_update.return_value = {
            "id": 1,
            "name": "UpdatedSource",
            "type": "PostgreSQL",
            "connection_string": TEST_CONNECTION_STRING,
            "user": "admin",
            "password": "secret",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "is_deleted": False,
            "is_hidden": False,
        }

        response = client.put("/datastorage/1", json=updated_payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "UpdatedSource")

        args, _ = mock_update.call_args
        self.assertEqual(args[0], 1)
        self.assertEqual(args[1].name, "UpdatedSource")


if __name__ == "__main__":
    unittest.main()
