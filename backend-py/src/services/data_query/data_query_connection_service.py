import requests
import json
from typing import Optional, Dict, Any
from config.logger_config import logger
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.abspath("../../../../compose-files/secrets.env"))

SUPERSET_API_URL = os.getenv("SUPERSET_API_URL", "http://localhost:8088")
SUPERSET_USERNAME = os.getenv("SUPERSET_ADMIN_USERNAME", "admin")
SUPERSET_PASSWORD = os.getenv("DATA_QUERY_SUPERSET_ROOT_PASSWORD")

TRINO_HOST = "data-query:8080"
TRINO_USER = "test"


class SupersetConnectionService:
    def __init__(
        self,
        base_url=SUPERSET_API_URL,
        username=SUPERSET_USERNAME,
        password=SUPERSET_PASSWORD,
    ):
        self.base_url = base_url
        self.username = username
        self.password = password
        self.access_token = self._get_access_token()

    def _get_access_token(self) -> Optional[str]:
        if not self.username or not self.password:
            logger.error("Error: Superset API username or password cannot be empty.")
            return None

        endpoint = f"{self.base_url}/api/v1/security/login"
        payload = {
            "username": self.username,
            "password": self.password,
            "provider": "db",
        }
        try:
            response = requests.post(endpoint, json=payload, timeout=5)
            response.raise_for_status()
            token = response.json().get("access_token")
            if not token:
                logger.error("Error: Access token not found in Superset's response.")
                return None
            logger.info("Successfully authenticated with Superset.")
            return token
        except requests.exceptions.RequestException as e:
            logger.error(f"Error authenticating with Superset: {e}")
            return None

    def _get_auth_headers(self) -> Dict[str, str]:
        if not self.access_token:
            return {}
        return {"Authorization": f"Bearer {self.access_token}"}

    def get_database_by_name(self, db_name: str) -> Optional[Dict[str, Any]]:
        if not self.access_token:
            return None

        endpoint = f"{self.base_url}/api/v1/database/"
        query_filter = f"?q=(filters:!((col:database_name,opr:eq,value:'{db_name}')))"
        try:
            response = requests.get(
                endpoint + query_filter, headers=self._get_auth_headers(), timeout=5
            )
            response.raise_for_status()
            data = response.json()
            return data["result"][0] if data.get("count", 0) > 0 else None
        except requests.exceptions.RequestException:
            return None

    def add_trino_connection(self, catalog_name: str) -> Optional[Dict[str, Any]]:
        if not self.access_token:
            return None

        existing_db = self.get_database_by_name(catalog_name)
        if existing_db:
            logger.info(
                f"Connection '{catalog_name}' already exists (ID: {existing_db['id']}). Skipping creation."
            )
            return existing_db

        endpoint = f"{self.base_url}/api/v1/database/"
        sqlalchemy_uri = f"trino://{TRINO_USER}@{TRINO_HOST}/{catalog_name}"

        payload = {
            "database_name": catalog_name,
            "sqlalchemy_uri": sqlalchemy_uri,
            "engine": "trino",
            "expose_in_sqllab": True,
        }

        logger.info(f"Attempting to create connection '{catalog_name}'...")
        try:
            response = requests.post(
                endpoint, headers=self._get_auth_headers(), json=payload, timeout=5
            )
            response.raise_for_status()
            logger.info(f"Connection '{catalog_name}' created successfully via API.")
            return response.json()
        except requests.exceptions.RequestException as e:
            if e.response and e.response.status_code == 422:
                try:
                    error_details = e.response.json()
                    logger.error(
                        "Error: Superset API returned a 422 Unprocessable Entity with these details:"
                    )
                    logger.error(json.dumps(error_details, indent=2))
                except json.JSONDecodeError:
                    logger.error(
                        f"Error: Received a 422 Unprocessable Entity, but the response body was not valid JSON: {e.response.text}"
                    )
            else:
                logger.error(f"Unexpected error creating connection: {e}")
            return None

    def delete_connection(self, db_id: int) -> bool:
        if not self.access_token:
            return False

        endpoint = f"{self.base_url}/api/v1/database/{db_id}"
        try:
            response = requests.delete(
                endpoint, headers=self._get_auth_headers(), timeout=5
            )
            response.raise_for_status()
            logger.info(f"Connection with ID '{db_id}' deleted successfully.")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Error deleting connection '{db_id}': {e}")
            return False
