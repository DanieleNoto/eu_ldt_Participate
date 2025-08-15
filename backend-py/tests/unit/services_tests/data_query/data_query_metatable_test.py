import unittest
from services.data_query.data_query_meta_table import DataQueryMetaTable, MetaTableType


class MetaTableTest(unittest.TestCase):
    def test_sanitize_name(self):
        self.assertEqual(DataQueryMetaTable._sanitize_name("my-bucket"), "my_bucket")
        self.assertEqual(DataQueryMetaTable._sanitize_name("no-dash"), "no_dash")

    def test_is_valid_name(self):
        self.assertTrue(DataQueryMetaTable._is_valid_name("valid_name"))
        self.assertTrue(DataQueryMetaTable._is_valid_name("a123"))
        self.assertFalse(DataQueryMetaTable._is_valid_name("123-invalid"))
        self.assertFalse(DataQueryMetaTable._is_valid_name("invalid-name"))

    def test_build_csv_meta_table(self):
        catalog = "test_catalog"
        bucket = "my_bucket"
        path = "my_table"
        columns = ["col1", "col2"]

        table = DataQueryMetaTable.build_csv_meta_table(catalog, bucket, path, columns)

        self.assertEqual(table.name, "test_catalog.my_bucket.my_table")
        self.assertEqual(table.type, MetaTableType.CSV)
        self.assertEqual(table.columns, columns)
        self.assertEqual(
            table.variables,
            {
                "external_location": "s3a://my_bucket/my_table",
                "format": "CSV",
                "skip_header_line_count": 1,
            },
        )

    def test_build_json_meta_table(self):
        catalog = "test_catalog"
        bucket = "json_bucket"
        path = "json_path"
        columns = ["field1"]

        table = DataQueryMetaTable.build_json_meta_table(catalog, bucket, path, columns)

        self.assertEqual(table.name, "test_catalog.json_bucket.json_path")
        self.assertEqual(table.type, MetaTableType.JSON)
        self.assertEqual(table.columns, columns)
        self.assertEqual(
            table.variables,
            {
                "external_location": "s3a://json_bucket/json_path",
                "format": "JSON",
            },
        )

    def test_invalid_bucket_or_path_raises(self):
        with self.assertRaises(ValueError):
            DataQueryMetaTable.build_csv_meta_table(
                "catalog", "!123bucket", "valid_path", ["col"]
            )

        with self.assertRaises(ValueError):
            DataQueryMetaTable.build_json_meta_table(
                "catalog", "valid_bucket", "invalid-path!", ["col"]
            )
