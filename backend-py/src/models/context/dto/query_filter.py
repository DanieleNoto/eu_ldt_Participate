from pydantic import BaseModel, Field


class QueryFilter(BaseModel):
    geoproperty: str | None = Field(
        None,
        title="GeoProperty",
        description="Property used for geospatial queries",
    )
    georel: str | None = Field(
        None, alias="georel", title="GeoRel", description="Spatial relationship"
    )
    geometry: str | None = Field(
        None, title="Geometry", description="Geometric shape type"
    )
    coordinates: str | None = Field(
        None, title="Coordinates", description="Coordinates for the geometric shape"
    )

    class Config:
        json_schema_extra = {"description": "Query Filter (GeoJSON parameters)"}
