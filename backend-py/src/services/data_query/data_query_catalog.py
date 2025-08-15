from enum import Enum


class DataQueryCatalogType(str, Enum):
    HIVE = "hive"
    POSTGRESQL = "postgresql"
    MONGODB = "mongodb"


class DataQueryCatalog:
    def __init__(self, name: str, type: DataQueryCatalogType, variables: dict):
        self.name = name
        self.type = type
        self.variables = variables

    @staticmethod
    def build_mongodb_catalog(
        name: str, host: str, port: int, user: str, password: str
    ):
        return DataQueryCatalog(
            name,
            DataQueryCatalogType.MONGODB,
            {"mongodb.connection-url": f"mongodb://{user}:{password}@{host}:{port}/"},
        )

    @staticmethod
    def build_postgresql_catalog(
        name: str, host: str, port: int, database: str, user: str, password: str
    ):
        return DataQueryCatalog(
            name,
            DataQueryCatalogType.POSTGRESQL,
            {
                "connection-url": f"jdbc:postgresql://{host}:{port}/{database}",
                "connection-user": user,
                "connection-password": password,
            },
        )

    @staticmethod
    def build_timescaledb_catalog(
        name: str, host: str, port: int, database: str, user: str, password: str
    ):
        return DataQueryCatalog.build_postgresql_catalog(
            name, host, port, database, user, password
        )

    @staticmethod
    def build_minio_catalog(
        name: str,
        hive_host: str,
        hive_port: int,
        minio_endpoint: str,
        minio_user: str,
        minio_password: str,
    ):
        return DataQueryCatalog(
            name,
            DataQueryCatalogType.HIVE,
            {
                "hive.metastore.uri": f"thrift://{hive_host}:{hive_port}",
                "hive.non-managed-table-creates-enabled": "true",
                "hive.non-managed-table-writes-enabled": "true",
                "fs.native-s3.enabled": "true",
                "s3.endpoint": minio_endpoint,
                "s3.region": "us-east-1",
                "s3.path-style-access": "true",
                "s3.aws-access-key": minio_user,
                "s3.aws-secret-key": minio_password,
            },
        )
