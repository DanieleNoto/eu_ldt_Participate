class DataQueryServiceError(Exception):
    """Base exception for the Trino query service."""


class CatalogCreationError(DataQueryServiceError):
    """Error creating a catalog."""


class CatalogDeletionError(DataQueryServiceError):
    """Error deleting a catalog."""


class QueryExecutionError(DataQueryServiceError):
    """Error executing a query."""


class CatalogRetrievingError(DataQueryServiceError):
    """Error retrieving catalogs."""


class CatalogMetadataSchemaCreationError(DataQueryServiceError):
    """Error creating metatable."""


class CatalogMetadataTableCreationError(DataQueryServiceError):
    """Error creating metatable."""
