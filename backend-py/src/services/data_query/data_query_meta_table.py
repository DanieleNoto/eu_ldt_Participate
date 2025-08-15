import re
from enum import Enum
from typing import List, Dict, Any


class MetaTableType(str, Enum):
    CSV = "CSV"
    JSON = "JSON"


class DataQueryMetaTable:
    def __init__(
        self,
        name: str,
        type: MetaTableType,
        columns: List[Any],
        variables: Dict[str, any],
    ):
        self.name = name
        self.type = type
        self.columns = columns
        self.variables = variables

    @staticmethod
    def build_csv_meta_table(
        catalog: str, bucket: str, path: str, columns: List[Any]
    ) -> "DataQueryMetaTable":
        return DataQueryMetaTable.build_meta_table(
            catalog, bucket, path, columns, MetaTableType.CSV
        )

    @staticmethod
    def build_json_meta_table(
        catalog: str, bucket: str, path: str, columns: List[Any]
    ) -> "DataQueryMetaTable":
        return DataQueryMetaTable.build_meta_table(
            catalog, bucket, path, columns, MetaTableType.JSON
        )

    @staticmethod
    def build_meta_table(
        catalog: str,
        bucket: str,
        path: str,
        columns: List[Any],
        table_type: MetaTableType,
    ) -> "DataQueryMetaTable":
        schema = DataQueryMetaTable._sanitize_name(bucket)
        table = DataQueryMetaTable._sanitize_name(path)

        if not DataQueryMetaTable._is_valid_name(
            schema
        ) or not DataQueryMetaTable._is_valid_name(table):
            raise ValueError("Invalid bucket or path name for schema/table")

        name = f"{catalog}.{schema}.{table}"
        variables = {
            "external_location": f"s3a://{bucket}/{path}",
            "format": table_type.value,
        }

        if table_type == MetaTableType.CSV:
            variables["skip_header_line_count"] = 1

        return DataQueryMetaTable(name, table_type, columns, variables)

    @staticmethod
    def _is_valid_name(name: str) -> bool:
        is_valid = re.fullmatch(r"\w+", name) is not None
        return is_valid

    @staticmethod
    def _sanitize_name(name: str) -> str:
        return name.replace("-", "_")
