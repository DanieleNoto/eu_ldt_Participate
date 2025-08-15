from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, List
from config.database import SessionLocal
from models.data_source.dto.data_source_add_dto import DataSourceAddDTO
from models.data_source.dto.data_source_dto import DataSourceDTO
from models.data_source.dto.data_source_edit_dto import DataSourceEditDTO
from controllers.data_source import data_source_controller as controller

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/datastorage", status_code=201, summary="Store Data", response_model=DataSourceDTO
)
def store_data_route(request: DataSourceAddDTO, db: Session = Depends(get_db)):
    return controller.store_data(request, db)


@router.post("/datastorage/test-connection", summary="Test DataStorage Connection")
def test_connection_route(request: DataSourceAddDTO):
    return controller.test_connection(request)


@router.get(
    "/datastorage/list",
    summary="Get DataStorage List with Filter and Pagination",
    response_model=List[DataSourceDTO],
)
def get_datastorage_list_route(
    name: Optional[str] = Query(None, description="Filter by name"),
    type: Optional[str] = Query(None, description="Filter by type"),
    user: Optional[str] = Query(None, description="Filter by user"),
    limit: int = Query(10, description="Number of items per page"),
    offset: int = Query(0, description="Pagination offset"),
    db: Session = Depends(get_db),
):
    return controller.get_datastorage_list(name, type, user, limit, offset, db)


@router.delete(
    "/datastorage/{id}",
    summary="Logically Delete a DataStorage by ID",
    response_model=DataSourceDTO,
)
def delete_data_storage_route(
    id: int = Path(..., description="The ID of the data storage to delete"),
    db: Session = Depends(get_db),
):
    return controller.delete_data_source(id, db)


@router.put(
    "/datastorage/{id}",
    summary="Update a DataStorage by ID",
    response_model=DataSourceDTO,
)
def update_data_storage_route(
    id: int = Path(..., description="ID of the data storage to update"),
    request: DataSourceEditDTO = ...,
    db: Session = Depends(get_db),
):
    return controller.update_data(id, request, db)
