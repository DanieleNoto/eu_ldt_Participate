import unittest
from unittest.mock import patch, MagicMock
import requests
import json

from services.data_query.data_query_connection_service import SupersetConnectionService

BASE_URL = "http://localhost:8088"
TEST_TOKEN = "mock_access_token"
TEST_USERNAME = "test_admin"
TEST_PASSWORD = "test_password"


class TestSupersetConnectionService(unittest.TestCase):
    def mock_response(self, status_code=200, json_data=None, text_data=""):
        mock_resp = MagicMock()
        mock_resp.status_code = status_code
        mock_resp.text = text_data

        if json_data is not None:
            mock_resp.json.return_value = json_data
        else:
            mock_resp.json.side_effect = json.JSONDecodeError(
                "Expecting value", "doc", 0
            )

        def raise_for_status():
            if status_code >= 400:
                http_error = requests.exceptions.HTTPError(f"{status_code} Error")
                http_error.response = mock_resp
                raise http_error

        mock_resp.raise_for_status = raise_for_status

        return mock_resp

    @patch("requests.post")
    def test_get_access_token_success(self, mock_post):
        mock_post.return_value = self.mock_response(
            status_code=200, json_data={"access_token": TEST_TOKEN}
        )
        service = SupersetConnectionService(
            username=TEST_USERNAME, password=TEST_PASSWORD
        )
        self.assertEqual(service.access_token, TEST_TOKEN)

    # CORRECTED TEST
    @patch("requests.post")
    @patch("services.data_query.data_query_connection_service.logger.error")
    def test_get_access_token_failure(self, mock_logger, mock_post):
        mock_post.return_value = self.mock_response(status_code=401)
        service = SupersetConnectionService(
            username=TEST_USERNAME, password=TEST_PASSWORD
        )
        self.assertIsNone(service.access_token)
        self.assertTrue(
            mock_logger.call_args[0][0].startswith(
                "Error authenticating with Superset:"
            )
        )

    @patch("requests.post")
    @patch("services.data_query.data_query_connection_service.logger.error")
    def test_get_access_token_no_token_in_response(self, mock_logger, mock_post):
        mock_post.return_value = self.mock_response(
            status_code=200, json_data={"msg": "success"}
        )
        service = SupersetConnectionService(
            username=TEST_USERNAME, password=TEST_PASSWORD
        )
        self.assertIsNone(service.access_token)
        mock_logger.assert_called_with(
            "Error: Access token not found in Superset's response."
        )

    @patch("services.data_query.data_query_connection_service.logger.error")
    def test_get_access_token_no_credentials(self, mock_logger):
        service = SupersetConnectionService(username=None, password=None)
        self.assertIsNone(service.access_token)
        mock_logger.assert_called_with(
            "Error: Superset API username or password cannot be empty."
        )

    @patch(
        "services.data_query.data_query_connection_service.SupersetConnectionService._get_access_token",
        return_value=None,
    )
    def test_methods_with_no_token(self, mock_get_token):
        service = SupersetConnectionService(
            username="user", password="pass"
        )  # Prevent auth call
        self.assertIsNone(service.access_token)

        self.assertEqual(service._get_auth_headers(), {})
        self.assertIsNone(service.get_database_by_name("any_db"))
        self.assertIsNone(service.add_trino_connection("any_catalog"))
        self.assertFalse(service.delete_connection(123))

    @patch(
        "services.data_query.data_query_connection_service.SupersetConnectionService._get_access_token",
        return_value=TEST_TOKEN,
    )
    @patch("requests.get")
    def test_get_database_by_name_found(self, mock_get, mock_get_token):
        db_name = "existing_db"
        expected_response = {
            "count": 1,
            "result": [{"id": 1, "database_name": db_name}],
        }
        mock_get.return_value = self.mock_response(json_data=expected_response)
        service = SupersetConnectionService(username="user", password="pass")
        result = service.get_database_by_name(db_name)
        self.assertIsNotNone(result)
        self.assertEqual(result["id"], 1)

    @patch(
        "services.data_query.data_query_connection_service.SupersetConnectionService._get_access_token",
        return_value=TEST_TOKEN,
    )
    @patch("requests.get")
    def test_get_database_by_name_not_found(self, mock_get, mock_get_token):
        expected_response = {"count": 0, "result": []}
        mock_get.return_value = self.mock_response(json_data=expected_response)
        service = SupersetConnectionService(username="user", password="pass")
        result = service.get_database_by_name("non_existing_db")
        self.assertIsNone(result)

    @patch(
        "services.data_query.data_query_connection_service.SupersetConnectionService._get_access_token",
        return_value=TEST_TOKEN,
    )
    @patch("requests.get")
    def test_get_database_by_name_request_exception(self, mock_get, mock_get_token):
        mock_get.side_effect = requests.exceptions.RequestException("Network Error")
        service = SupersetConnectionService(username="user", password="pass")
        result = service.get_database_by_name("any_db")
        self.assertIsNone(result)

    @patch(
        "services.data_query.data_query_connection_service.SupersetConnectionService._get_access_token",
        return_value=TEST_TOKEN,
    )
    @patch("requests.post")
    @patch("requests.get")
    def test_add_trino_connection_success(self, mock_get, mock_post, mock_get_token):
        catalog_name = "new_catalog"
        mock_get.return_value = self.mock_response(json_data={"count": 0, "result": []})
        mock_post.return_value = self.mock_response(
            status_code=201, json_data={"id": 123, "database_name": catalog_name}
        )
        service = SupersetConnectionService(username="user", password="pass")
        result = service.add_trino_connection(catalog_name)
        self.assertIsNotNone(result)
        self.assertEqual(result["id"], 123)

    @patch(
        "services.data_query.data_query_connection_service.SupersetConnectionService._get_access_token",
        return_value=TEST_TOKEN,
    )
    @patch("requests.get")
    def test_add_trino_connection_already_exists(self, mock_get, mock_get_token):
        catalog_name = "existing_catalog"
        existing_db_response = {
            "count": 1,
            "result": [{"id": 456, "database_name": catalog_name}],
        }
        mock_get.return_value = self.mock_response(json_data=existing_db_response)
        service = SupersetConnectionService(username="user", password="pass")
        result = service.add_trino_connection(catalog_name)
        self.assertIsNotNone(result)
        self.assertEqual(result["id"], 456)

    @patch(
        "services.data_query.data_query_connection_service.SupersetConnectionService._get_access_token",
        return_value=TEST_TOKEN,
    )
    @patch("requests.post")
    @patch("requests.get")
    @patch("services.data_query.data_query_connection_service.logger.error")
    def test_add_trino_connection_422_error_with_json(
        self, mock_logger, mock_get, mock_post, mock_get_token
    ):
        mock_get.return_value = self.mock_response(json_data={"count": 0, "result": []})
        error_json = {"message": "Validation error on field X"}
        mock_post.return_value = self.mock_response(
            status_code=422, json_data=error_json
        )

        service = SupersetConnectionService(username="user", password="pass")
        result = service.add_trino_connection("failing_catalog")

        self.assertIsNone(result)
        self.assertIn("422 Unprocessable Entity", mock_logger.call_args_list[0][0][0])
        self.assertIn(
            json.dumps(error_json, indent=2), mock_logger.call_args_list[1][0][0]
        )

    @patch(
        "services.data_query.data_query_connection_service.SupersetConnectionService._get_access_token",
        return_value=TEST_TOKEN,
    )
    @patch("requests.post")
    @patch("requests.get")
    @patch("services.data_query.data_query_connection_service.logger.error")
    def test_add_trino_connection_422_error_no_json(
        self, mock_logger, mock_get, mock_post, mock_get_token
    ):
        mock_get.return_value = self.mock_response(json_data={"count": 0, "result": []})
        mock_post.return_value = self.mock_response(
            status_code=422, text_data="Invalid payload"
        )

        service = SupersetConnectionService(username="user", password="pass")
        result = service.add_trino_connection("failing_catalog")

        self.assertIsNone(result)
        self.assertIn(
            "response body was not valid JSON: Invalid payload",
            mock_logger.call_args[0][0],
        )

    @patch(
        "services.data_query.data_query_connection_service.SupersetConnectionService._get_access_token",
        return_value=TEST_TOKEN,
    )
    @patch("requests.delete")
    def test_delete_connection_success(self, mock_delete, mock_get_token):
        mock_delete.return_value = self.mock_response(status_code=200)
        service = SupersetConnectionService(username="user", password="pass")
        result = service.delete_connection(db_id=999)
        self.assertTrue(result)

    @patch(
        "services.data_query.data_query_connection_service.SupersetConnectionService._get_access_token",
        return_value=TEST_TOKEN,
    )
    @patch("requests.delete")
    @patch("services.data_query.data_query_connection_service.logger.error")
    def test_delete_connection_failure(self, mock_logger, mock_delete, mock_get_token):
        mock_delete.return_value = self.mock_response(status_code=404)
        service = SupersetConnectionService(username="user", password="pass")
        result = service.delete_connection(db_id=999)
        self.assertFalse(result)
        self.assertTrue(
            mock_logger.call_args[0][0].startswith("Error deleting connection '999':")
        )
