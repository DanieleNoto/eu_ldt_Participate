from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.data_source.dto.data_source_add_dto import DataSourceAddDTO
from models.data_source.dto.data_source_edit_dto import DataSourceEditDTO
from services.data_source.data_source_service import (
    store_data_source,
    get_data_storage_list,
    test_data_source_connection_from_dto,
    logically_delete_data_source,
    update_data_source,
)
import logging

logger = logging.getLogger("data_source_controller")

INTERNAL_SERVER_ERROR = "Internal Server Error."


def store_data(request: DataSourceAddDTO, db: Session):
    try:
        return store_data_source(db, request)
    except Exception as e:
        logger.error(f"Unexpected error while storing data: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR)


def test_connection(request: DataSourceAddDTO):
    try:
        return {"message": test_data_source_connection_from_dto(request)}
    except Exception as e:
        logger.error(f"Error while testing connection: {str(e)}")
        raise HTTPException(status_code=500, detail="Connection test failed.")


def get_datastorage_list(name, type, user, limit, offset, db: Session):
    try:
        return get_data_storage_list(db, name, type, user, limit, offset)
    except Exception as e:
        logger.error(f"Error while fetching data storage list: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve data storage list."
        )


def delete_data_source(data_source_id: int, db: Session):
    try:
        return logically_delete_data_source(db, data_source_id)
    except ValueError as ve:
        logger.warning(f"Delete failed: {str(ve)}")
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error during deletion: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR)


def update_data(data_source_id: int, request: DataSourceEditDTO, db: Session):
    try:
        return update_data_source(db, data_source_id, request)
    except ValueError as ve:
        logger.warning(f"Update failed: {str(ve)}")
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error during update: {str(e)}")
        raise HTTPException(status_code=500, detail=INTERNAL_SERVER_ERROR)
