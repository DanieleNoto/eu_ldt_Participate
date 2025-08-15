import unittest
from unittest.mock import patch
from fastapi import HTTPException
from faker import Faker

from src.controllers.auth_token import auth_token_controller
from src.models.auth_token.dto.auth_token_request import AuthTokenRequest

faker = Faker()


class AuthTokenControllerUnitTest(unittest.TestCase):
    def setUp(self):
        self.valid_request = AuthTokenRequest(
            client_id=faker.uuid4(),
            grant_type="client_credentials",
            client_secret=faker.password(length=20),
            scope="openid",
        )

    @patch("src.controllers.auth_token.auth_token_controller.request_auth_token")
    def test_get_auth_token_success(self, mock_request_auth_token):
        mock_request_auth_token.return_value = {"access_token": "abc123"}
        response = auth_token_controller.get_auth_token(self.valid_request)
        self.assertEqual(response, {"access_token": "abc123"})
        mock_request_auth_token.assert_called_once_with(self.valid_request)

    @patch("src.controllers.auth_token.auth_token_controller.request_auth_token")
    def test_get_auth_token_http_exception(self, mock_request_auth_token):
        mock_request_auth_token.side_effect = HTTPException(
            status_code=401, detail="Invalid credentials"
        )
        with self.assertRaises(HTTPException) as context:
            auth_token_controller.get_auth_token(self.valid_request)
        self.assertEqual(context.exception.status_code, 401)
        self.assertEqual(context.exception.detail, "Invalid credentials")

    @patch("src.controllers.auth_token.auth_token_controller.request_auth_token")
    def test_get_auth_token_unexpected_exception(self, mock_request_auth_token):
        mock_request_auth_token.side_effect = Exception("Unexpected failure")
        with self.assertRaises(HTTPException) as context:
            auth_token_controller.get_auth_token(self.valid_request)
        self.assertEqual(context.exception.status_code, 500)
        self.assertEqual(context.exception.detail, "Internal Server Error")
