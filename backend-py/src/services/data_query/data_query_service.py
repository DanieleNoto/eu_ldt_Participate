from typing import List

from trino.dbapi import connect
from trino.exceptions import TrinoUserError, TrinoExternalError, TrinoQueryError

from config.logger_config import logger
from services.data_query.data_query_catalog import DataQueryCatalog
from services.data_query.data_query_exceptions import (
    QueryExecutionError,
    CatalogCreationError,
    CatalogDeletionError,
    CatalogMetadataSchemaCreationError,
    CatalogMetadataTableCreationError,
)
from services.data_query.data_query_meta_table import DataQueryMetaTable


class DataQueryService:
    def __init__(
        self,
        host: str,
        port: int,
    ):
        self.host = host
        self.port = port

        self._connection = None

    def _get_connection(self, user: str):
        if self._connection is None:
            self._connection = connect(
                host=self.host,
                port=self.port,
                user=user,
                http_scheme="http",
            )
        return self._connection

    def execute_query(self, user: str, query: str) -> list[tuple]:
        conn = self._get_connection(user)
        cursor = conn.cursor()
        try:
            cursor.execute(query)
            response = cursor.fetchall()
            return response
        except (
            TrinoUserError,
            TrinoQueryError,
            TrinoExternalError,
            ConnectionError,
        ) as err:
            logger.error(f"Error executing query to Trino: {err}")
            raise QueryExecutionError(str(err)) from err
        except Exception as err:
            logger.error(err)
            raise QueryExecutionError(str(err)) from err
        finally:
            cursor.close()

    def get_catalogs(self, user: str) -> List:
        logger.info("Getting all catalogs")
        query = """
            SHOW CATALOGS
        """
        try:
            response = self.execute_query(user, query)
            catalogs = [catalog[0] for catalog in response]
            return catalogs
        except QueryExecutionError as e:
            raise QueryExecutionError(f"Catalogs not found': {e}") from e

    def create_catalog(self, user: str, catalog: DataQueryCatalog) -> DataQueryCatalog:
        logger.info(f"Creating catalog {catalog.name} of type {catalog.type.value}")
        with_clause = DataQueryService._build_with_clause(catalog.variables)
        query = f"""
            CREATE CATALOG {catalog.name}
            USING {catalog.type.value}
            WITH (
                {with_clause}
            )
        """
        try:
            self.execute_query(user, query)
            return catalog
        except QueryExecutionError as e:
            raise CatalogCreationError(
                f"Catalog not created '{catalog.name}': {e}"
            ) from e

    def delete_catalog(self, user: str, catalog: DataQueryCatalog) -> DataQueryCatalog:
        logger.info(f"Dropping catalog {catalog.name} of type {catalog.type.value}")
        query = f"""
            DROP CATALOG {catalog.name}
        """
        try:
            self.execute_query(user, query)
            return catalog
        except QueryExecutionError as e:
            raise CatalogDeletionError(
                f"Catalog not created '{catalog.name}': {e}"
            ) from e

    def create_object_schema(self, user: str, catalog: str, bucket: str):
        schema = bucket.replace("-", "_")
        logger.info(
            f"Creating metadata schema in {catalog}.{schema} linked with bucket {bucket}"
        )
        query = f"""
            CREATE SCHEMA {catalog}.{schema} WITH (location = 's3a://{bucket}/')
        """
        try:
            self.execute_query(user, query)
            return catalog
        except QueryExecutionError as e:
            raise CatalogMetadataSchemaCreationError(
                f"Schema not created {catalog}.{bucket} {e}"
            ) from e

    def create_object_table(self, user: str, meta_table: DataQueryMetaTable):
        logger.info(f"Creating metadata table in {meta_table.name}")

        sql_columns = ", ".join(
            f"{column_name} VARCHAR" for column_name in meta_table.columns
        )
        with_clause = DataQueryService._build_with_clause(meta_table.variables)
        query = f"""
            CREATE TABLE {meta_table.name}(
                    {sql_columns}
                )
                WITH (
                    {with_clause}
                )
        """
        try:
            self.execute_query(user, query)
            return meta_table
        except QueryExecutionError as e:
            raise CatalogMetadataTableCreationError(
                f"Meta table not created '{meta_table.name}': {e}"
            ) from e

    def delete_object_schema(self, user: str, catalog: str, bucket: str):
        schema = bucket.replace("-", "_")
        logger.info(f"Dropping object schema {catalog}.{schema}")
        query = f"""
            DROP SCHEMA {catalog}.{schema}
        """
        try:
            self.execute_query(user, query)
            return catalog
        except QueryExecutionError as e:
            raise CatalogDeletionError(
                f"Object schema not deleted '{catalog}{schema}': {e}"
            ) from e

    def delete_object_table(self, user: str, meta_table: DataQueryMetaTable):
        logger.info(f"Dropping object table {meta_table.name}")
        query = f"""
            DROP TABLE {meta_table.name}
        """
        try:
            self.execute_query(user, query)
        except QueryExecutionError as e:
            raise CatalogDeletionError(
                f"Object table not deleted '{meta_table.name}': {e}"
            ) from e

    @staticmethod
    def _is_number(value):
        try:
            float(value)
            return True
        except ValueError:
            return False

    @staticmethod
    def _build_with_clause(variables: dict) -> str:
        return ",\n    ".join(
            f'"{key}" = {value}'
            if DataQueryService._is_number(value)
            else f"\"{key}\" = '{value}'"
            for key, value in variables.items()
        )

    def test_connection(self, user) -> bool:
        try:
            self.execute_query(user, "SELECT 1")
            return True
        except Exception as e:
            print(f"Connection error: {e}")
            return False


if __name__ == "__main__":
    dq = DataQueryService("localhost", 8082)

    USER = "test"

    mongodb_catalog = DataQueryCatalog.build_mongodb_catalog(
        "mongodb", "mongodb", 27017, "ldt_user_root", "..."
    )

    mongodb_catalog = dq.create_catalog(USER, mongodb_catalog)
    dq.delete_catalog(USER, mongodb_catalog)
    catalogs = dq.get_catalogs(USER)
    print(f"Catalogs: {catalogs}")

    dq.create_object_schema(USER, "object", "test")

    csv_metatable = DataQueryMetaTable.build_csv_meta_table(
        "object", "test", "test", ["name", "value"]
    )

    dq.create_object_table(USER, csv_metatable)
    dq.delete_object_table(USER, csv_metatable)
    dq.delete_object_schema(USER, "object", "test")
