import asyncio
import unittest
from datetime import timedelta
import jwt
from unittest.mock import patch
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient
from faker import Faker
from passlib.context import CryptContext

from src.config import config
from src.controllers.context.auth import (
    authenticate_user,
    get_user,
    create_access_token,
    verify_password,
    fake_users_db,
    verify_token,
    router,
    get_current_user,
)
from fastapi import HTTPException, status

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
fake = Faker()


class TestAuthFunctions(unittest.TestCase):
    def setUp(self):
        self.patcher_correct_password = patch(
            "src.config.config.CORRECT_PASSWORD", "secret"
        )
        self.patcher_wrong_password = patch(
            "src.config.config.WRONG_PASSWORD", "wrongpassword"
        )

        self.patcher_correct_password.start()
        self.patcher_wrong_password.start()

        self.addCleanup(self.patcher_correct_password.stop)
        self.addCleanup(self.patcher_wrong_password.stop)

    @classmethod
    def setUpClass(cls):
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)
        cls.client = TestClient(app)

    def test_verify_password(self):
        hashed = fake_users_db["johndoe"]["hashed_password"]
        self.assertTrue(verify_password(config.CORRECT_PASSWORD, hashed))
        self.assertFalse(verify_password(config.WRONG_PASSWORD, hashed))

    def test_get_user(self):
        user = get_user(fake_users_db, "johndoe")
        self.assertIsNotNone(user)
        self.assertEqual(user.username, "johndoe")

        user = get_user(fake_users_db, "nonexistent")
        self.assertIsNone(user)

    def test_authenticate_user(self):
        user = authenticate_user(fake_users_db, "johndoe", config.CORRECT_PASSWORD)
        self.assertIsNotNone(user)
        self.assertEqual(user.username, "johndoe")

        user = authenticate_user(fake_users_db, "johndoe", config.WRONG_PASSWORD)
        self.assertFalse(user)

        user = authenticate_user(fake_users_db, "nonexistent", config.CORRECT_PASSWORD)
        self.assertFalse(user)

    def test_create_access_token(self):
        data = {"sub": "johndoe"}
        token = create_access_token(data, timedelta(minutes=30))
        decoded_data = jwt.decode(
            token, config.SECRET_KEY, algorithms=[config.ALGORITHM]
        )
        self.assertEqual(decoded_data["sub"], "johndoe")

    def test_verify_token(self):
        user = authenticate_user(fake_users_db, "johndoe", config.CORRECT_PASSWORD)
        token = create_access_token({"sub": user.username}, timedelta(minutes=30))
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        token_data = verify_token(credentials)
        self.assertEqual(token_data.username, "johndoe")

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="invalid_token"
        )
        with self.assertRaises(HTTPException):
            verify_token(credentials)

    def test_login_for_access_token(self):
        username = fake.user_name()
        password = fake.password()
        wrong_password = fake.password()
        hashed_password = pwd_context.hash(password)

        fake_users_db[username] = {
            "username": username,
            "full_name": fake.name(),
            "email": fake.email(),
            "hashed_password": hashed_password,
            "disabled": False,
            "role": "viewer",
        }

        response = self.client.post(
            "/token",
            json={"username": username, "password": password},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())

        response = self.client.post(
            "/token",
            json={"username": username, "password": wrong_password},
        )
        self.assertEqual(response.status_code, 401)

        response = self.client.post(
            "/token",
            json={"username": "nonexistent_user", "password": password},
        )
        self.assertEqual(response.status_code, 401)

    def test_get_current_user_success(self):
        token = create_access_token({"sub": "johndoe"}, timedelta(minutes=30))
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user = asyncio.run(get_current_user(credentials))
        self.assertIsNotNone(user)
        self.assertEqual(user.username, "johndoe")

    def test_get_current_user_invalid_token(self):
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="bad.token.value"
        )
        with self.assertRaises(HTTPException) as cm:
            asyncio.run(get_current_user(credentials))
        self.assertEqual(cm.exception.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_current_user_no_sub(self):
        payload = {"not_sub": "value"}
        token = jwt.encode(payload, config.SECRET_KEY, algorithm=config.ALGORITHM)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        with self.assertRaises(HTTPException) as cm:
            asyncio.run(get_current_user(credentials))
        self.assertEqual(cm.exception.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_current_user_user_not_found(self):
        token = create_access_token({"sub": "ghost"}, timedelta(minutes=30))
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        with self.assertRaises(HTTPException) as cm:
            asyncio.run(get_current_user(credentials))
        self.assertEqual(cm.exception.status_code, status.HTTP_401_UNAUTHORIZED)
