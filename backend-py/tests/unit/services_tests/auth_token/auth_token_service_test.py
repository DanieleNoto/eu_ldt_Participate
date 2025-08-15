import unittest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from faker import Faker

from src.models.auth_token.dto.auth_token_request import AuthTokenRequest
from src.services.auth_token import auth_token_service

faker = Faker()


class AuthTokenControllerTest(unittest.TestCase):
    def setUp(self):
        self.patcher_base = patch(
            "src.services.auth_token.auth_token_service.AUTH_BASE_URL",
            "https://fake-auth",
        )
        self.patcher_token = patch(
            "src.services.auth_token.auth_token_service.AUTH_TOKEN_URL", "/token"
        )

        self.patcher_base.start()
        self.patcher_token.start()

        self.addCleanup(self.patcher_base.stop)
        self.addCleanup(self.patcher_token.stop)

        self.valid_request = AuthTokenRequest(
            client_id=faker.uuid4(),
            grant_type="client_credentials",
            client_secret=faker.password(length=20),
            scope="my-scope",
        )

    @patch(
        "src.services.auth_token.auth_token_service.requests.post",
        side_effect=Exception("Unexpected"),
    )
    def test_internal_error_scenarios(self, mock_post):
        scenarios = [
            ("missing_token_url", None),
            ("unexpected_exception", Exception("Unexpected")),
        ]

        for label, side_effect in scenarios:
            with self.subTest(label=label):
                if label == "missing_token_url":
                    with (
                        patch(
                            "src.services.auth_token.auth_token_service.AUTH_BASE_URL",
                            "",
                        ),
                        patch(
                            "src.services.auth_token.auth_token_service.AUTH_TOKEN_URL",
                            "",
                        ),
                    ):
                        with self.assertRaises(HTTPException) as context:
                            auth_token_service.request_auth_token(self.valid_request)
                        self.assertEqual(context.exception.status_code, 500)
                else:
                    mock_post.side_effect = side_effect
                    with self.assertRaises(HTTPException) as context:
                        auth_token_service.request_auth_token(self.valid_request)
                    self.assertEqual(context.exception.status_code, 500)

    @patch("src.services.auth_token.auth_token_service.requests.post")
    def test_token_request_failure(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_post.return_value = mock_response

        with self.assertRaises(HTTPException) as context:
            auth_token_service.request_auth_token(self.valid_request)
        self.assertEqual(context.exception.status_code, 500)

    @patch("src.services.auth_token.auth_token_service.requests.post")
    def test_token_request_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"access_token": "abc123"}
        mock_post.return_value = mock_response

        result = auth_token_service.request_auth_token(self.valid_request)
        self.assertEqual(result["access_token"], "abc123")


if __name__ == "__main__":
    unittest.main()
