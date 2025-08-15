import unittest
from unittest.mock import patch
from fastapi import HTTPException
from src.controllers.user_roles import user_roles_controller
from src.models.user_roles.dto.user_roles_dto import UserRolesRequest
from src.models.user_roles.dto.role_dto import Role


class UserRolesControllerTest(unittest.TestCase):
    def setUp(self):
        self.token = "mocked-token"
        self.valid_request = UserRolesRequest(
            user_id="123",
            roles=[
                Role(role_name="admin", state=True).model_dump(),
                Role(role_name="editor", state=True).model_dump(),
            ],
        )

    @patch("src.controllers.user_roles.user_roles_controller.assign_user_roles")
    def test_assign_roles_success(self, mock_assign):
        mock_assign.return_value = {}
        response = user_roles_controller.assign_roles(self.valid_request, self.token)
        self.assertEqual(response, {})
        mock_assign.assert_called_once_with(self.valid_request, self.token)

    @patch("src.controllers.user_roles.user_roles_controller.assign_user_roles")
    def test_assign_roles_http_exception(self, mock_assign):
        mock_assign.side_effect = HTTPException(status_code=403, detail="Forbidden")
        with self.assertRaises(HTTPException) as ctx:
            user_roles_controller.assign_roles(self.valid_request, self.token)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertEqual(ctx.exception.detail, "Forbidden")

    @patch("src.controllers.user_roles.user_roles_controller.assign_user_roles")
    def test_assign_roles_unexpected_error(self, mock_assign):
        mock_assign.side_effect = Exception("Unexpected error")
        with self.assertRaises(HTTPException) as ctx:
            user_roles_controller.assign_roles(self.valid_request, self.token)
        self.assertEqual(ctx.exception.status_code, 500)
        self.assertEqual(ctx.exception.detail, "Internal Server Error")

    @patch(
        "src.controllers.user_roles.user_roles_controller.get_users_from_external_service"
    )
    def test_get_users_from_external_success(self, mock_get_users):
        mock_get_users.return_value = [{"id": "u1", "name": "User1"}]
        response = user_roles_controller.get_users_from_external(self.token)
        self.assertEqual(response, [{"id": "u1", "name": "User1"}])
        mock_get_users.assert_called_once_with(self.token)

    @patch(
        "src.controllers.user_roles.user_roles_controller.get_users_from_external_service"
    )
    def test_get_users_from_external_error(self, mock_get_users):
        mock_get_users.side_effect = Exception("Error fetching users")
        with self.assertRaises(HTTPException) as context:
            user_roles_controller.get_users_from_external(self.token)
        self.assertEqual(context.exception.status_code, 500)
        self.assertEqual(context.exception.detail, "Internal Server Error")

    @patch(
        "src.controllers.user_roles.user_roles_controller.get_roles_from_external_service"
    )
    def test_get_roles_from_external_success(self, mock_get_roles):
        mock_get_roles.return_value = ["admin", "viewer"]
        response = user_roles_controller.get_roles_from_external(self.token)
        self.assertEqual(response, ["admin", "viewer"])
        mock_get_roles.assert_called_once_with(self.token)

    @patch(
        "src.controllers.user_roles.user_roles_controller.get_roles_from_external_service"
    )
    def test_get_roles_from_external_error(self, mock_get_roles):
        mock_get_roles.side_effect = Exception("Error fetching roles")
        with self.assertRaises(HTTPException) as context:
            user_roles_controller.get_roles_from_external(self.token)
        self.assertEqual(context.exception.status_code, 500)
        self.assertEqual(context.exception.detail, "Internal Server Error")
