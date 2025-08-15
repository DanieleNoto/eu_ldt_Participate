import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from fastapi import FastAPI, Response
from src.routes.user_roles.user_roles_routes import router
from src.models.user_roles.dto.user_roles_dto import UserRolesRequest

app = FastAPI()
app.include_router(router)

client = TestClient(app)


class UserRolesRoutesTest(unittest.TestCase):
    def setUp(self):
        self.payload = {
            "user_id": "123456",
            "roles": [
                {"role_name": "admin", "state": True},
                {"role_name": "editor", "state": True},
            ],
        }
        self.token = "Bearer test-token"
        self.headers = {"Authorization": self.token}

    @patch("src.routes.user_roles.user_roles_routes.controller.assign_roles")
    def test_assign_roles_route(self, mock_assign_roles):
        mock_assign_roles.return_value = Response(status_code=201)
        response = client.post("/role", json=self.payload, headers=self.headers)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.content, b"")  # Cuerpo vacío
        expected_object = UserRolesRequest(**self.payload)
        self.assertEqual(
            mock_assign_roles.call_args.args[0].dict(), expected_object.model_dump()
        )

    @patch("src.routes.user_roles.user_roles_routes.controller.get_users_from_external")
    def test_get_users_external(self, mock_get_users):
        mock_get_users.return_value = [{"id": "123", "name": "Test User"}]
        response = client.get("/users", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["name"], "Test User")
        mock_get_users.assert_called_once_with("test-token")

    @patch("src.routes.user_roles.user_roles_routes.controller.get_roles_from_external")
    def test_get_roles_external(self, mock_get_roles):
        mock_get_roles.return_value = [{"id": "1", "role": "admin"}]
        response = client.get("/roles", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["role"], "admin")
        mock_get_roles.assert_called_once_with("test-token")


if __name__ == "__main__":
    unittest.main()
