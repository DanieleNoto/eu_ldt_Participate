import os


def get_test_credentials():
    return {
        "user": os.getenv("TEST_DATA_USERNAME", "test_user"),
        "password": os.getenv("TEST_DATA_PASSWORD", "test_pass"),
        "user_admin": os.getenv("TEST_DATA_USERNAME_ADMIN", "admin"),
        "password_admin": os.getenv("TEST_DATA_PASSWORD_ADMIN", "encrypted"),
    }
