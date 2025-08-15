import unittest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from sqlalchemy.orm import Session
from controllers.data_source import data_source_controller
from models.data_source.dto.data_source_add_dto import DataSourceAddDTO
from models.data_source.dto.data_source_edit_dto import DataSourceEditDTO

TEST_SOURCE_NAME = "Test Source"
INTERNAL_ERROR_MSG = "Internal Server Error"


class DataSourceControllerTest(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock(spec=Session)
        self.valid_dto = DataSourceAddDTO(
            name=TEST_SOURCE_NAME,
            type="PostgreSQL",
            user="admin",
            connection_string="localhost:5432/db",
            password="secret",
        )

    @patch("controllers.data_source.data_source_controller.store_data_source")
    def test_store_data_success(self, mock_store):
        mock_store.return_value = {"id": 1, "name": TEST_SOURCE_NAME}
        result = data_source_controller.store_data(self.valid_dto, self.mock_db)
        self.assertEqual(result, {"id": 1, "name": TEST_SOURCE_NAME})
        mock_store.assert_called_once_with(self.mock_db, self.valid_dto)

    @patch(
        "controllers.data_source.data_source_controller.store_data_source",
        side_effect=Exception("DB error"),
    )
    def test_store_data_error(self, mock_store):
        with self.assertRaises(HTTPException) as context:
            data_source_controller.store_data(self.valid_dto, self.mock_db)
        self.assertEqual(context.exception.status_code, 500)
        self.assertIn(INTERNAL_ERROR_MSG, context.exception.detail)

    @patch(
        "controllers.data_source.data_source_controller.test_data_source_connection_from_dto"
    )
    def test_test_connection_success(self, mock_test):
        mock_test.return_value = "Connection successful"
        result = data_source_controller.test_connection(self.valid_dto)
        self.assertEqual(result, {"message": "Connection successful"})
        mock_test.assert_called_once_with(self.valid_dto)

    @patch(
        "controllers.data_source.data_source_controller.test_data_source_connection_from_dto",
        side_effect=Exception("Conn error"),
    )
    def test_test_connection_error(self, mock_test):
        with self.assertRaises(HTTPException) as context:
            data_source_controller.test_connection(self.valid_dto)
        self.assertEqual(context.exception.status_code, 500)
        self.assertIn("Connection test failed", context.exception.detail)

    @patch("controllers.data_source.data_source_controller.get_data_storage_list")
    def test_get_datastorage_list_success(self, mock_get):
        mock_get.return_value = [{"id": 1, "name": TEST_SOURCE_NAME}]
        result = data_source_controller.get_datastorage_list(
            "Test", "PostgreSQL", "admin", 10, 0, self.mock_db
        )
        self.assertIsInstance(result, list)
        mock_get.assert_called_once_with(
            self.mock_db, "Test", "PostgreSQL", "admin", 10, 0
        )

    @patch(
        "controllers.data_source.data_source_controller.get_data_storage_list",
        side_effect=Exception("Query error"),
    )
    def test_get_datastorage_list_error(self, mock_get):
        with self.assertRaises(HTTPException) as context:
            data_source_controller.get_datastorage_list(
                "Test", "PostgreSQL", "admin", 10, 0, self.mock_db
            )
        self.assertEqual(context.exception.status_code, 500)
        self.assertIn("Failed to retrieve data storage list.", context.exception.detail)

    @patch(
        "controllers.data_source.data_source_controller.logically_delete_data_source"
    )
    def test_delete_data_source_success(self, mock_delete):
        mock_delete.return_value = {
            "id": 1,
            "name": TEST_SOURCE_NAME,
            "is_deleted": True,
        }
        result = data_source_controller.delete_data_source(1, self.mock_db)
        self.assertTrue(result["is_deleted"])
        mock_delete.assert_called_once_with(self.mock_db, 1)

    @patch(
        "controllers.data_source.data_source_controller.logically_delete_data_source",
        side_effect=ValueError("Data source not found."),
    )
    def test_delete_data_source_not_found(self, mock_delete):
        with self.assertRaises(HTTPException) as context:
            data_source_controller.delete_data_source(99, self.mock_db)
        self.assertEqual(context.exception.status_code, 404)
        self.assertIn("not found", context.exception.detail)

    @patch(
        "controllers.data_source.data_source_controller.logically_delete_data_source",
        side_effect=Exception("Unexpected error"),
    )
    def test_delete_data_source_error(self, mock_delete):
        with self.assertRaises(HTTPException) as context:
            data_source_controller.delete_data_source(1, self.mock_db)
        self.assertEqual(context.exception.status_code, 500)
        self.assertIn(INTERNAL_ERROR_MSG, context.exception.detail)

    @patch("controllers.data_source.data_source_controller.update_data_source")
    def test_update_data_success(self, mock_update):
        dto = DataSourceEditDTO(
            name="Updated Source",
            type="PostgreSQL",
            user="admin",
            connection_string="localhost:5432/new_db",
            password="new_secret",
        )
        mock_update.return_value = {"id": 1, "name": "Updated Source"}
        result = data_source_controller.update_data(1, dto, self.mock_db)
        self.assertEqual(result["name"], "Updated Source")
        mock_update.assert_called_once_with(self.mock_db, 1, dto)

    @patch(
        "controllers.data_source.data_source_controller.update_data_source",
        side_effect=ValueError("Data source not found."),
    )
    def test_update_data_not_found(self, mock_update):
        dto = DataSourceEditDTO(
            name="Invalid",
            type="PostgreSQL",
            user="admin",
            connection_string="localhost:5432/fail",
            password="fail",
        )
        with self.assertRaises(HTTPException) as context:
            data_source_controller.update_data(999, dto, self.mock_db)
        self.assertEqual(context.exception.status_code, 404)
        self.assertIn("not found", context.exception.detail)

    @patch(
        "controllers.data_source.data_source_controller.update_data_source",
        side_effect=Exception("Unexpected error"),
    )
    def test_update_data_error(self, mock_update):
        dto = DataSourceEditDTO(
            name="Error Source",
            type="PostgreSQL",
            user="admin",
            connection_string="localhost:5432/err",
            password="err",
        )
        with self.assertRaises(HTTPException) as context:
            data_source_controller.update_data(1, dto, self.mock_db)
        self.assertEqual(context.exception.status_code, 500)
        self.assertIn(INTERNAL_ERROR_MSG, context.exception.detail)


if __name__ == "__main__":
    unittest.main()
