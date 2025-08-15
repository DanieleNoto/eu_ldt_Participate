from dotenv import load_dotenv
import os

load_dotenv()


LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

CONTEXT_DATA_BROKER_URL = os.getenv("CONTEXT_DATA_BROKER_URL")

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "00")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
FERNET_KEY = os.getenv("FERNET_KEY", "vbs_VZKcfNhHd3y7HsdOIdhz7l60Ue06GlA-OGT5nho=")

SECRET_KEY = os.getenv(
    "SECRET_KEY", "5aec5d2698c68772452b6d166f21586a0e94c3e787ac97fe7027598d8e5f9d07"
)

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)
WRONG_PASSWORD = os.getenv("WRONG_PASSWORD")
CORRECT_PASSWORD = os.getenv("CORRECT_PASSWORD")

AUTH_BASE_URL = os.getenv("AUTH_BASE_URL")
AUTH_TOKEN_URL = os.getenv("AUTH_TOKEN_URL")
USERS_URL = os.getenv("USERS_URL")
ROLES_URL = os.getenv("ROLES_URL")
ASSIGN_ROLES_URL = os.getenv("ASSIGN_ROLES_URL")
