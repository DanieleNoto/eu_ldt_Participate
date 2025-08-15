import unittest

from faker import Faker

from services.data_query.data_query_catalog import (
    DataQueryCatalogType,
    DataQueryCatalog,
)


class DataQueryCatalogTest(unittest.TestCase):
    def setUp(self):
        self.faker = Faker()
        self.mongodb_name = "test"
        self.mongodb_type = DataQueryCatalogType.MONGODB
        self.mongodb_host = "localhost"
        self.mongodb_port = 27017
        self.mongodb_user = self.faker.user_name()
        self.mongodb_password = self.faker.password()
        self.mongodb_variables = {
            "mongodb.connection-url": f"mongodb://{self.mongodb_user}:{self.mongodb_password}@{self.mongodb_host}:{self.mongodb_port}/"
        }
        self.mongodb_catalog = DataQueryCatalog(
            self.mongodb_name, self.mongodb_type, self.mongodb_variables
        )

    def test_catalog_name(self):
        self.assertEqual(self.mongodb_catalog.name, self.mongodb_name)

    def test_catalog_type(self):
        self.assertEqual(self.mongodb_catalog.type, self.mongodb_type)

    def test_catalog_variables(self):
        self.assertEqual(self.mongodb_catalog.variables, self.mongodb_variables)

    def test_build_mongodb_catalog(self):
        name = "mongodb"
        host = "localhost"
        port = 27017
        user = "user"
        password = self.faker.password()

        catalog = DataQueryCatalog.build_mongodb_catalog(
            name, host, port, user, password
        )

        expected_variables = {
            "mongodb.connection-url": f"mongodb://{user}:{password}@{host}:{port}/"
        }

        self.assertEqual(catalog.name, name)
        self.assertEqual(catalog.type, DataQueryCatalogType.MONGODB)
        self.assertEqual(catalog.variables, expected_variables)

    def test_build_postgresql_catalog(self):
        name = "postgres_test"
        host = "localhost"
        port = 5432
        database = "testdb"
        user = self.faker.user_name()
        password = self.faker.password()

        catalog = DataQueryCatalog.build_postgresql_catalog(
            name, host, port, database, user, password
        )

        expected_variables = {
            "connection-url": f"jdbc:postgresql://{host}:{port}/{database}",
            "connection-user": user,
            "connection-password": password,
        }

        self.assertEqual(catalog.name, name)
        self.assertEqual(catalog.type, DataQueryCatalogType.POSTGRESQL)
        self.assertEqual(catalog.variables, expected_variables)

    def test_build_timescaledb_catalog(self):
        name = "timescaledb_test"
        host = "localhost"
        port = 5432
        database = "metrics"
        user = self.faker.user_name()
        password = self.faker.password()

        catalog = DataQueryCatalog.build_timescaledb_catalog(
            name, host, port, database, user, password
        )

        expected_variables = {
            "connection-url": f"jdbc:postgresql://{host}:{port}/{database}",
            "connection-user": user,
            "connection-password": password,
        }

        self.assertEqual(catalog.name, name)
        self.assertEqual(catalog.type, DataQueryCatalogType.POSTGRESQL)
        self.assertEqual(catalog.variables, expected_variables)

    def test_build_minio_catalog(self):
        name = "minio_test"
        hive_host = "hive-host"
        hive_port = 9083
        minio_endpoint = "http://minio:9000"
        minio_user = self.faker.user_name()
        minio_password = self.faker.password()

        catalog = DataQueryCatalog.build_minio_catalog(
            name,
            hive_host,
            hive_port,
            minio_endpoint,
            minio_user,
            minio_password,
        )

        expected_variables = {
            "hive.metastore.uri": f"thrift://{hive_host}:{hive_port}",
            "hive.non-managed-table-creates-enabled": "true",
            "hive.non-managed-table-writes-enabled": "true",
            "fs.native-s3.enabled": "true",
            "s3.endpoint": minio_endpoint,
            "s3.region": "us-east-1",
            "s3.path-style-access": "true",
            "s3.aws-access-key": minio_user,
            "s3.aws-secret-key": minio_password,
        }

        self.assertEqual(catalog.name, name)
        self.assertEqual(catalog.type, DataQueryCatalogType.HIVE)
        self.assertEqual(catalog.variables, expected_variables)
