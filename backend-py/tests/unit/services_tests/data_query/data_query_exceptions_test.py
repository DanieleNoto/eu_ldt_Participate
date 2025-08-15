import unittest

from services.data_query.data_query_exceptions import (
    CatalogCreationError,
    DataQueryServiceError,
    CatalogDeletionError,
    QueryExecutionError,
    CatalogRetrievingError,
    CatalogMetadataSchemaCreationError,
    CatalogMetadataTableCreationError,
)


class DataQueryServiceErrorTest(unittest.TestCase):
    def test_catalog_creation_error(self):
        with self.assertRaises(CatalogCreationError) as context:
            raise CatalogCreationError("Failed to create catalog")

        self.assertIsInstance(context.exception, DataQueryServiceError)
        self.assertEqual(str(context.exception), "Failed to create catalog")

    def test_catalog_deletion_error(self):
        with self.assertRaises(CatalogDeletionError) as context:
            raise CatalogDeletionError("Failed to delete catalog")

        self.assertIsInstance(context.exception, DataQueryServiceError)
        self.assertEqual(str(context.exception), "Failed to delete catalog")

    def test_query_execution_error(self):
        with self.assertRaises(QueryExecutionError) as context:
            raise QueryExecutionError("Query failed")

        self.assertIsInstance(context.exception, DataQueryServiceError)
        self.assertEqual(str(context.exception), "Query failed")

    def test_catalog_retrieving_error(self):
        with self.assertRaises(CatalogRetrievingError) as context:
            raise CatalogRetrievingError("Could not retrieve catalogs")

        self.assertIsInstance(context.exception, DataQueryServiceError)
        self.assertEqual(str(context.exception), "Could not retrieve catalogs")

    def test_metadata_schema_creation_error(self):
        with self.assertRaises(CatalogMetadataSchemaCreationError) as context:
            raise CatalogMetadataSchemaCreationError("Schema creation failed")

        self.assertIsInstance(context.exception, DataQueryServiceError)
        self.assertEqual(str(context.exception), "Schema creation failed")

    def test_metadata_table_creation_error(self):
        with self.assertRaises(CatalogMetadataTableCreationError) as context:
            raise CatalogMetadataTableCreationError("Table creation failed")

        self.assertIsInstance(context.exception, DataQueryServiceError)
        self.assertEqual(str(context.exception), "Table creation failed")
