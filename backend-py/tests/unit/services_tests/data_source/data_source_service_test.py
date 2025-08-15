import unittest
from unittest.mock import patch, MagicMock
from sqlalchemy.orm import Session
from src.models.data_source.dto.data_source_add_dto import DataSourceAddDTO
from src.models.data_source.dto.data_source_edit_dto import DataSourceEditDTO
from src.services.data_source import data_source_service
from src.utils.test_credentials import get_test_credentials
from faker import Faker

faker = Faker()


class DataSourceServiceTest(unittest.TestCase):
    def setUp(self):
        self.patcher_user = patch("src.config.database.DB_USER", "test_user")
        self.patcher_pass = patch("src.config.database.DB_PASSWORD", "test_pass")
        self.patcher_host = patch("src.config.database.DB_HOST", "localhost")
        self.patcher_port = patch("src.config.database.DB_PORT", "5432")
        self.patcher_name = patch("src.config.database.DB_NAME", "test_db")

        self.patcher_user.start()
        self.patcher_pass.start()
        self.patcher_host.start()
        self.patcher_port.start()
        self.patcher_name.start()

        self.addCleanup(self.patcher_user.stop)
        self.addCleanup(self.patcher_pass.stop)
        self.addCleanup(self.patcher_host.stop)
        self.addCleanup(self.patcher_port.stop)
        self.addCleanup(self.patcher_name.stop)

        creds = get_test_credentials()
        self.mock_db = MagicMock(spec=Session)
        self.mock_dto = DataSourceAddDTO(
            name="TestSource",
            type="PostgreSQL",
            connection_string="localhost:5432/testdb",
            user=creds["user"],
            password=creds["password"],
        )

    @patch(
        "src.services.data_source.data_source_service.crypto_service.encrypt",
        return_value="encrypted_pass",
    )
    @patch(
        "src.services.data_source.data_source_service.crypto_service.decrypt",
        return_value="decrypted_pass",
    )
    def test_store_data_source(self, mock_decrypt, mock_encrypt):
        mock_instance = MagicMock()
        mock_instance.id = 1
        mock_instance.type = self.mock_dto.type
        mock_instance.name = self.mock_dto.name
        mock_instance.connection_string = self.mock_dto.connection_string
        mock_instance.user = self.mock_dto.user
        mock_instance.password = "encrypted_pass"
        mock_instance.created_at = "2023-01-01"
        mock_instance.updated_at = "2023-01-01"
        mock_instance.is_deleted = False
        mock_instance.is_hidden = False

        self.mock_db.refresh.side_effect = lambda x: x.__dict__.update(
            mock_instance.__dict__
        )
        result = data_source_service.store_data_source(self.mock_db, self.mock_dto)

        self.assertEqual(result.name, self.mock_dto.name)
        self.assertEqual(result.password, "decrypted_pass")

    @patch("src.services.data_source.data_source_service.psycopg.connect")
    def test_test_connection_postgres_success(self, mock_pg_connect):
        mock_cursor = MagicMock()
        mock_pg_connect.return_value.__enter__.return_value.cursor.return_value = (
            mock_cursor
        )

        result = data_source_service.test_data_source_connection_from_dto(self.mock_dto)
        self.assertIn("connection successful", result)

    @patch("src.services.data_source.data_source_service.MongoClient")
    def test_test_connection_mongo_success(self, mock_mongo):
        self.mock_dto.type = "Mongo DB"
        self.mock_dto.connection_string = "localhost:27017"
        mock_client_instance = MagicMock()
        mock_mongo.return_value = mock_client_instance
        mock_client_instance.server_info.return_value = {}

        result = data_source_service.test_data_source_connection_from_dto(self.mock_dto)
        self.assertIn("MongoDB connection successful", result)

    @patch("src.services.data_source.data_source_service.requests.get")
    def test_test_connection_minio_success(self, mock_requests):
        self.mock_dto.type = "MinIO"
        mock_requests.return_value.status_code = 200
        result = data_source_service.test_data_source_connection_from_dto(self.mock_dto)
        self.assertIn("MinIO connection successful", result)

    @patch("src.services.data_source.data_source_service.requests.get")
    def test_minio_connection_failure(self, mock_requests):
        self.mock_dto.type = "MinIO"
        mock_requests.side_effect = Exception("MinIO error")
        result = data_source_service.test_data_source_connection_from_dto(self.mock_dto)
        self.assertIn("General error", result)

    def test_test_connection_unsupported_type(self):
        self.mock_dto.type = "UnsupportedDB"
        result = data_source_service.test_data_source_connection_from_dto(self.mock_dto)
        self.assertIn("Unsupported data source type", result)

    @patch(
        "src.services.data_source.data_source_service.crypto_service.decrypt",
        return_value="decrypted",
    )
    def test_get_data_storage_list(self, mock_decrypt):
        creds = get_test_credentials()
        mock_result = MagicMock()
        mock_result.id = 1
        mock_result.type = "PostgreSQL"
        mock_result.name = "Example"
        mock_result.connection_string = "localhost"
        mock_result.user = creds["user_admin"]
        mock_result.password = "encrypted_pass"
        mock_result.created_at = "2023-01-01"
        mock_result.updated_at = "2023-01-01"
        mock_result.is_deleted = False
        mock_result.is_hidden = False

        query_mock = MagicMock()
        query_mock.filter.return_value = query_mock
        query_mock.offset.return_value = query_mock
        query_mock.limit.return_value = query_mock
        query_mock.all.return_value = [mock_result]
        self.mock_db.query.return_value = query_mock

        result = data_source_service.get_data_storage_list(self.mock_db)
        self.assertIsInstance(result, list)
        self.assertEqual(result[0].password, "decrypted")

    @patch(
        "src.services.data_source.data_source_service.crypto_service.decrypt",
        return_value="decrypted_pass",
    )
    def test_logically_delete_data_source_success(self, mock_decrypt):
        mock_data_source = MagicMock()
        mock_data_source.id = 1
        mock_data_source.type = "PostgreSQL"
        mock_data_source.name = "TestSource"
        mock_data_source.connection_string = "localhost:5432/testdb"
        mock_data_source.user = faker.uuid4()
        mock_data_source.password = "encrypted_pass"
        mock_data_source.created_at = "2023-01-01"
        mock_data_source.updated_at = "2023-01-01"
        mock_data_source.is_deleted = False
        mock_data_source.is_hidden = False

        self.mock_db.query.return_value.filter.return_value.first.return_value = (
            mock_data_source
        )

        result = data_source_service.logically_delete_data_source(self.mock_db, 1)
        self.assertEqual(result.id, 1)
        self.assertTrue(mock_data_source.is_deleted)
        self.assertEqual(result.password, "decrypted_pass")

    def test_logically_delete_data_source_not_found(self):
        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        with self.assertRaises(ValueError) as context:
            data_source_service.logically_delete_data_source(self.mock_db, 999)
        self.assertEqual(str(context.exception), "Data source not found.")

    @patch(
        "src.services.data_source.data_source_service.crypto_service.encrypt",
        return_value="encrypted_pass",
    )
    @patch(
        "src.services.data_source.data_source_service.crypto_service.decrypt",
        return_value="decrypted_pass",
    )
    def test_update_data_source_success(self, mock_decrypt, mock_encrypt):
        mock_data_source = MagicMock()
        mock_data_source.id = 1
        mock_data_source.type = "PostgreSQL"
        mock_data_source.name = "OldName"
        mock_data_source.connection_string = "localhost"
        mock_data_source.user = faker.uuid4()
        mock_data_source.password = "encrypted_pass"
        mock_data_source.created_at = "2023-01-01"
        mock_data_source.updated_at = "2023-01-01"
        mock_data_source.is_deleted = False
        mock_data_source.is_hidden = False

        self.mock_db.query.return_value.filter.return_value.first.return_value = (
            mock_data_source
        )
        self.mock_db.refresh.side_effect = lambda obj: None

        edit_dto = DataSourceEditDTO(
            name="UpdatedSource",
            connection_string="localhost:5432/updated",
            user="admin",
            password="new_secret",
        )

        result = data_source_service.update_data_source(self.mock_db, 1, edit_dto)
        self.assertEqual(result.name, "UpdatedSource")
        self.assertEqual(result.password, "decrypted_pass")
        mock_encrypt.assert_called_once_with("new_secret")
        mock_decrypt.assert_called_once_with("encrypted_pass")

    def test_update_data_source_not_found(self):
        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        edit_dto = DataSourceEditDTO(
            name="Nonexistent", connection_string="fail", user="none", password="none"
        )

        with self.assertRaises(ValueError) as context:
            data_source_service.update_data_source(self.mock_db, 999, edit_dto)
        self.assertEqual(str(context.exception), "Data source not found.")


if __name__ == "__main__":
    unittest.main()
