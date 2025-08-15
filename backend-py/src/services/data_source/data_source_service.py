from sqlalchemy.orm import Session
from models.data_source.dto.data_source_dto import DataSourceDTO
from models.data_source.dto.data_source_add_dto import DataSourceAddDTO
from models.data_source.dto.data_source_edit_dto import DataSourceEditDTO
from models.data_source.entity.data_source_entity import DataSource
from typing import List, Optional
from pymongo import MongoClient
import psycopg
import requests
from services.security.crypto_service import CryptoService

crypto_service = CryptoService()


def store_data_source(db: Session, dto: DataSourceAddDTO) -> DataSourceDTO:
    new_data_source = DataSource(
        type=dto.type,
        name=dto.name,
        connection_string=dto.connection_string,
        user=dto.user,
        password=crypto_service.encrypt(dto.password),
    )
    db.add(new_data_source)
    db.commit()
    db.refresh(new_data_source)
    return DataSourceDTO(
        id=new_data_source.id,
        type=new_data_source.type,
        name=new_data_source.name,
        connection_string=new_data_source.connection_string,
        user=new_data_source.user,
        password=crypto_service.decrypt(new_data_source.password),
        created_at=new_data_source.created_at,
        updated_at=new_data_source.updated_at,
        is_deleted=new_data_source.is_deleted,
        is_hidden=new_data_source.is_hidden,
    )


def test_data_source_connection_from_dto(data: DataSourceAddDTO) -> str:
    try:
        if data.type in ["PostgreSQL", "TimescaleDB"]:
            pg_url = (
                f"postgresql://{data.user}:{data.password}@{data.connection_string}"
            )
            with psycopg.connect(pg_url) as conn:
                conn.cursor().execute("SELECT 1")
                return f"{data.type} connection successful"

        elif data.type == "Mongo DB":
            mongo_url = (
                f"mongodb://{data.user}:{data.password}@{data.connection_string}"
            )
            client = MongoClient(mongo_url)
            client.server_info()
            return "MongoDB connection successful"

        elif data.type == "MinIO":
            response = requests.get(f"{data.connection_string}")
            if response.status_code == 200:
                return "MinIO connection successful"
            return f"MinIO connection failed with status: {response.status_code}"

        return "Unsupported data source type"

    except Exception as e:
        return f"General error: {str(e)}"


def get_data_storage_list(
    db: Session,
    name: Optional[str] = None,
    type: Optional[str] = None,
    user: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
) -> List[DataSourceDTO]:
    query = db.query(DataSource).filter(~DataSource.is_deleted)

    if name:
        query = query.filter(DataSource.name.ilike(f"%{name}%"))
    if type:
        query = query.filter(DataSource.type.ilike(f"%{type}%"))
    if user:
        query = query.filter(DataSource.user.ilike(f"%{user}%"))

    query = query.offset(offset).limit(limit)
    result = query.all()

    return [
        DataSourceDTO(
            id=ds.id,
            type=ds.type,
            name=ds.name,
            connection_string=ds.connection_string,
            user=ds.user,
            password=crypto_service.decrypt(ds.password),
            created_at=ds.created_at,
            updated_at=ds.updated_at,
            is_deleted=ds.is_deleted,
            is_hidden=ds.is_hidden,
        )
        for ds in result
    ]


def logically_delete_data_source(db: Session, data_source_id: int) -> DataSourceDTO:
    data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
    if not data_source:
        raise ValueError("Data source not found.")

    data_source.is_deleted = True
    db.commit()
    db.refresh(data_source)

    return DataSourceDTO(
        id=data_source.id,
        type=data_source.type,
        name=data_source.name,
        connection_string=data_source.connection_string,
        user=data_source.user,
        password=crypto_service.decrypt(data_source.password),
        created_at=data_source.created_at,
        updated_at=data_source.updated_at,
        is_deleted=data_source.is_deleted,
        is_hidden=data_source.is_hidden,
    )


def update_data_source(
    db: Session, data_source_id: int, dto: DataSourceEditDTO
) -> DataSourceDTO:
    data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
    if not data_source:
        raise ValueError("Data source not found.")

    data_source.name = dto.name
    data_source.connection_string = dto.connection_string
    data_source.user = dto.user
    data_source.password = crypto_service.encrypt(dto.password)

    db.commit()
    db.refresh(data_source)

    return DataSourceDTO(
        id=data_source.id,
        type=data_source.type,
        name=data_source.name,
        connection_string=data_source.connection_string,
        user=data_source.user,
        password=crypto_service.decrypt(data_source.password),
        created_at=data_source.created_at,
        updated_at=data_source.updated_at,
        is_deleted=data_source.is_deleted,
        is_hidden=data_source.is_hidden,
    )
