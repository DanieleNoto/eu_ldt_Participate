import unittest
from unittest.mock import patch, MagicMock, Mock

from faker import Faker
from trino.exceptions import TrinoQueryError

from services.data_query.data_query_catalog import DataQueryCatalog
from services.data_query.data_query_exceptions import (
    QueryExecutionError,
    CatalogDeletionError,
    CatalogMetadataSchemaCreationError,
    CatalogCreationError,
    CatalogMetadataTableCreationError,
)
from services.data_query.data_query_meta_table import DataQueryMetaTable
from services.data_query.data_query_service import DataQueryService


class DataQueryServiceTest(unittest.TestCase):
    def setUp(self):
        self.faker = Faker()
        self.service = DataQueryService("localhost", 8080)
        self.user = self.faker.user_name()
        self.query = "SELECT * FROM test_table"
        self.mock_trino_error = TrinoQueryError(
            {
                "message": "Bad query",
                "errorCode": 1234,
                "errorName": "GENERIC_INTERNAL_ERROR",
                "errorType": "INTERNAL_ERROR",
                "errorLocation": {"lineNumber": 1, "columnNumber": 1},
                "failureInfo": {},
            }
        )

    @patch("services.data_query.data_query_service.connect")
    def test_execute_query_success(self, mock_connect):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [("row1",), ("row2",)]
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        result = self.service.execute_query(self.user, self.query)

        mock_connect.assert_called_once_with(
            host="localhost", port=8080, user=self.user, http_scheme="http"
        )
        mock_conn.cursor.assert_called_once()
        mock_cursor.execute.assert_called_once_with(self.query)
        mock_cursor.fetchall.assert_called_once()
        mock_cursor.close.assert_called_once()
        self.assertEqual(result, [("row1",), ("row2",)])

    def test_is_number_with_numeric_strings(self):
        self.assertTrue(DataQueryService._is_number("123"))
        self.assertTrue(DataQueryService._is_number("123.456"))
        self.assertTrue(DataQueryService._is_number("-5.7"))

    def test_is_number_with_non_numeric_strings(self):
        self.assertFalse(DataQueryService._is_number("abc"))
        self.assertFalse(DataQueryService._is_number(""))
        self.assertFalse(DataQueryService._is_number("12abc"))

    def test_build_with_clause(self):
        variables = {"id": "123", "name": "Alice", "score": "98.6"}
        expected = '"id" = 123,\n    "name" = \'Alice\',\n    "score" = 98.6'
        result = DataQueryService._build_with_clause(variables)
        self.assertEqual(result, expected)

    def test_build_with_clause_with_non_number(self):
        variables = {"x": "abc", "y": "42"}
        expected = '"x" = \'abc\',\n    "y" = 42'
        result = DataQueryService._build_with_clause(variables)
        self.assertEqual(result, expected)

    @patch.object(DataQueryService, "execute_query")
    def test_get_catalogs_success(self, mock_execute_query):
        mock_execute_query.return_value = [["hive"], ["iceberg"], ["delta"]]
        result = self.service.get_catalogs("user")
        self.assertEqual(result, ["hive", "iceberg", "delta"])

    @patch.object(DataQueryService, "execute_query")
    def test_get_catalogs_failure(self, mock_execute_query):
        mock_execute_query.side_effect = QueryExecutionError("DB down")
        with self.assertRaises(QueryExecutionError) as cm:
            self.service.get_catalogs("user")
        self.assertIn("Catalogs not found", str(cm.exception))

    @patch.object(DataQueryService, "execute_query")
    def test_create_catalog_success(self, mock_execute_query):
        catalog = DataQueryCatalog(
            name="my_catalog", type=Mock(value="hive"), variables={"path": "s3a://data"}
        )
        result = self.service.create_catalog("user", catalog)
        self.assertEqual(result, catalog)

    @patch.object(DataQueryService, "execute_query")
    def test_create_catalog_failure(self, mock_execute_query):
        catalog = DataQueryCatalog(
            name="my_catalog", type=Mock(value="hive"), variables={}
        )
        mock_execute_query.side_effect = QueryExecutionError("boom")
        with self.assertRaises(CatalogCreationError):
            self.service.create_catalog("user", catalog)

    @patch.object(DataQueryService, "execute_query")
    def test_delete_catalog_success(self, mock_execute_query):
        catalog = DataQueryCatalog(
            name="my_catalog", type=Mock(value="hive"), variables={}
        )
        result = self.service.delete_catalog("user", catalog)
        self.assertEqual(result, catalog)

    @patch.object(DataQueryService, "execute_query")
    def test_delete_catalog_failure(self, mock_execute_query):
        catalog = DataQueryCatalog(
            name="my_catalog", type=Mock(value="hive"), variables={}
        )
        mock_execute_query.side_effect = QueryExecutionError("fail")
        with self.assertRaises(CatalogDeletionError):
            self.service.delete_catalog("user", catalog)

    @patch.object(DataQueryService, "execute_query")
    def test_create_object_schema_success(self, mock_execute_query):
        result = self.service.create_object_schema("user", "iceberg", "my-bucket")
        self.assertEqual(result, "iceberg")

    @patch.object(DataQueryService, "execute_query")
    def test_create_object_schema_failure(self, mock_execute_query):
        mock_execute_query.side_effect = QueryExecutionError("fail")
        with self.assertRaises(CatalogMetadataSchemaCreationError):
            self.service.create_object_schema("user", "iceberg", "my-bucket")

    @patch.object(DataQueryService, "execute_query")
    def test_delete_object_schema_success(self, mock_execute_query):
        result = self.service.delete_object_schema("user", "iceberg", "my-bucket")
        self.assertEqual(result, "iceberg")

    @patch.object(DataQueryService, "execute_query")
    def test_delete_object_schema_failure(self, mock_execute_query):
        mock_execute_query.side_effect = QueryExecutionError("fail")
        with self.assertRaises(CatalogDeletionError):
            self.service.delete_object_schema("user", "iceberg", "my-bucket")

    @patch.object(DataQueryService, "execute_query")
    def test_delete_object_table_success(self, mock_execute_query):
        table = DataQueryMetaTable(
            name="table_name", type=Mock(), columns=[], variables={}
        )
        self.service.delete_object_table("user", table)
        mock_execute_query.assert_called_once()

    @patch.object(DataQueryService, "execute_query")
    def test_delete_object_table_failure(self, mock_execute_query):
        table = DataQueryMetaTable(
            name="table_name", type=Mock(), columns=[], variables={}
        )
        mock_execute_query.side_effect = QueryExecutionError("fail")
        with self.assertRaises(CatalogDeletionError):
            self.service.delete_object_table("user", table)

    @patch.object(DataQueryService, "_get_connection")
    def test_execute_query_get_connection_success(self, mock_get_connection):
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [("row1",), ("row2",)]
        mock_connection = MagicMock()
        mock_connection.cursor.return_value = mock_cursor
        mock_get_connection.return_value = mock_connection

        query = "SELECT * FROM my_table"
        result = self.service.execute_query("test_user", query)

        mock_cursor.execute.assert_called_once_with(query)
        mock_cursor.fetchall.assert_called_once()
        mock_cursor.close.assert_called_once()
        self.assertEqual(result, [("row1",), ("row2",)])

    @patch.object(DataQueryService, "_get_connection")
    def test_execute_query_generic_error(self, mock_get_connection):
        mock_cursor = MagicMock()
        mock_cursor.execute.side_effect = Exception("Unexpected error")
        mock_connection = MagicMock()
        mock_connection.cursor.return_value = mock_cursor
        mock_get_connection.return_value = mock_connection

        with self.assertRaises(QueryExecutionError) as cm:
            self.service.execute_query("user", "SELECT *")

        self.assertIn("Unexpected error", str(cm.exception))
        mock_cursor.close.assert_called_once()

    @patch.object(DataQueryService, "_get_connection")
    def test_execute_query_trino_error(self, mock_get_connection):
        mock_cursor = MagicMock()
        mock_cursor.execute.side_effect = self.mock_trino_error
        mock_connection = MagicMock()
        mock_connection.cursor.return_value = mock_cursor
        mock_get_connection.return_value = mock_connection

        with self.assertRaises(QueryExecutionError) as cm:
            self.service.execute_query("user", "BAD SQL")

        self.assertIn("Bad query", str(cm.exception))
        mock_cursor.close.assert_called_once()

    @patch.object(DataQueryService, "execute_query")
    def test_create_object_table_success(self, mock_execute_query):
        table = DataQueryMetaTable(
            name="my_table",
            type=Mock(),
            columns=["col1", "col2"],
            variables={"location": "s3a://bucket"},
        )
        result = self.service.create_object_table("user", table)

        self.assertEqual(result, table)
        mock_execute_query.assert_called_once()

    @patch.object(DataQueryService, "execute_query")
    def test_create_object_table_failure(self, mock_execute_query):
        table = DataQueryMetaTable(
            name="my_table",
            type=Mock(),
            columns=["col1"],
            variables={"location": "s3a://bucket"},
        )
        mock_execute_query.side_effect = QueryExecutionError("something went wrong")

        with self.assertRaises(CatalogMetadataTableCreationError) as cm:
            self.service.create_object_table("user", table)

        self.assertIn("Meta table not created", str(cm.exception))
        mock_execute_query.assert_called_once()

    @patch.object(DataQueryService, "execute_query")
    def test_test_connection_success(self, mock_execute_query):
        mock_execute_query.return_value = [(1,)]
        result = self.service.test_connection("user")
        self.assertTrue(result)
        mock_execute_query.assert_called_once_with("user", "SELECT 1")

    @patch.object(DataQueryService, "execute_query")
    def test_test_connection_failure(self, mock_execute_query):
        mock_execute_query.side_effect = Exception("Connection failed")
        result = self.service.test_connection("user")
        self.assertFalse(result)
        mock_execute_query.assert_called_once_with("user", "SELECT 1")
