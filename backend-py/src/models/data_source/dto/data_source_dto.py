from datetime import datetime
from models.data_source.dto.data_source_base_dto import DataSourceBaseDTO


class DataSourceDTO(DataSourceBaseDTO):
    id: int
    type: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    is_hidden: bool

    class Config:
        from_attributes = True
