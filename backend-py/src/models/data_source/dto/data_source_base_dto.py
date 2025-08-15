from pydantic import BaseModel


class DataSourceBaseDTO(BaseModel):
    name: str
    connection_string: str
    user: str
    password: str
