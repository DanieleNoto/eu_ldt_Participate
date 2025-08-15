import unittest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from src.services.user_roles import user_roles_service
from src.models.user_roles.dto.user_roles_dto import UserRolesRequest
from src.models.user_roles.dto.role_dto import Role


class UserRolesServiceTest(unittest.TestCase):
    def setUp(self):
        self.patcher_auth = patch(
            "src.services.user_roles.user_roles_service.AUTH_BASE_URL",
            "https://fake-auth",
        )
        self.patcher_users = patch(
            "src.services.user_roles.user_roles_service.USERS_URL", "/users"
        )
        self.patcher_roles = patch(
            "src.services.user_roles.user_roles_service.ROLES_URL",
            "/clients/{client_id}/roles",
        )
        self.patcher_assign = patch(
            "src.services.user_roles.user_roles_service.ASSIGN_ROLES_URL",
            "/users/{user_id}/roles",
        )

        self.patcher_auth.start()
        self.patcher_users.start()
        self.patcher_roles.start()
        self.patcher_assign.start()

        self.addCleanup(self.patcher_auth.stop)
        self.addCleanup(self.patcher_users.stop)
        self.addCleanup(self.patcher_roles.stop)
        self.addCleanup(self.patcher_assign.stop)

        valid_role = Role(role_name="admin", state=True)
        invalid_role = Role(role_name=" ", state=True)

        self.valid_request = UserRolesRequest(
            user_id="valid_user", roles=[valid_role.model_dump()]
        )
        self.invalid_user_id_request = UserRolesRequest(
            user_id=" ", roles=[valid_role.model_dump()]
        )
        self.invalid_role_name_request = UserRolesRequest(
            user_id="valid_user", roles=[invalid_role.model_dump()]
        )

    @patch("src.services.user_roles.user_roles_service.requests.patch")
    @patch("src.services.user_roles.user_roles_service.extract_client_id_from_token")
    def test_assign_user_roles_valid(self, mock_extract_client_id, mock_patch):
        mock_extract_client_id.return_value = "mock-client"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_patch.return_value = mock_response

        result = user_roles_service.assign_user_roles(
            self.valid_request, "mocked.token"
        )
        self.assertEqual(result, {})
        mock_extract_client_id.assert_called_once_with("mocked.token")
        mock_patch.assert_called_once()

    def test_assign_user_roles_missing_user_id(self):
        with self.assertRaises(HTTPException) as context:
            user_roles_service.assign_user_roles(
                self.invalid_user_id_request, "mocked.token"
            )
        self.assertEqual(context.exception.status_code, 500)

    def test_assign_user_roles_missing_role_name(self):
        with self.assertRaises(HTTPException) as context:
            user_roles_service.assign_user_roles(
                self.invalid_role_name_request, "mocked.token"
            )
        self.assertEqual(context.exception.status_code, 500)

    @patch("src.services.user_roles.user_roles_service.requests.get")
    def test_get_users_from_external_service_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {
                "id": "1",
                "username": "testuser",
                "email": "test@example.com",
                "roles": [
                    {
                        "role_id": "r1",
                        "role_name": "admin",
                        "roleID": "r1",
                        "roleName": "admin",
                    }
                ],
                "credentials": [
                    {
                        "type": "password",
                        "value": "secret",
                        "createdAt": "2024-01-01T00:00:00Z",
                        "data": [],
                    }
                ],
            }
        ]
        mock_get.return_value = mock_response

        result = user_roles_service.get_users_from_external_service("token")

        self.assertEqual(result[0].id, "1")
        self.assertEqual(result[0].username, "testuser")
        self.assertEqual(result[0].email, "test@example.com")
        self.assertEqual(result[0].roles[0].role_id, "r1")
        self.assertEqual(result[0].roles[0].role_name, "admin")
        self.assertEqual(result[0].credentials[0].type, "password")

    @patch("src.services.user_roles.user_roles_service.requests.get")
    def test_get_users_from_external_service_failure(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_get.return_value = mock_response

        with self.assertRaises(HTTPException) as context:
            user_roles_service.get_users_from_external_service("token")
        self.assertEqual(context.exception.status_code, 500)

    @patch("src.services.user_roles.user_roles_service.extract_client_id_from_token")
    @patch("src.services.user_roles.user_roles_service.requests.get")
    def test_get_roles_from_external_service_success(
        self, mock_get, mock_extract_client_id
    ):
        mock_extract_client_id.return_value = "abc123"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"clientID": "abc123", "roleID": "1", "roleName": "admin"}
        ]
        mock_get.return_value = mock_response

        result = user_roles_service.get_roles_from_external_service("mocked.token")
        self.assertTrue(
            all(role.__class__.__name__ == "RoleResponse" for role in result)
        )
        self.assertEqual(result[0].role_id, "1")

    @patch("src.services.user_roles.user_roles_service.extract_client_id_from_token")
    @patch("src.services.user_roles.user_roles_service.requests.get")
    def test_get_roles_from_external_service_failure(
        self, mock_get, mock_extract_client_id
    ):
        mock_extract_client_id.return_value = "mock-client"
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_get.return_value = mock_response

        with self.assertRaises(HTTPException) as context:
            user_roles_service.get_roles_from_external_service("token")
        self.assertEqual(context.exception.status_code, 500)


if __name__ == "__main__":
    unittest.main()
