import unittest
from unittest.mock import patch, MagicMock, call
from src.routes import routes_loader


class RoutesLoaderTest(unittest.TestCase):
    def setUp(self):
        self.mock_scorpio = MagicMock()
        self.mock_config = MagicMock()
        self.mock_entities_router = MagicMock()
        self.mock_types_router = MagicMock()
        self.mock_auth_router = MagicMock()
        self.mock_data_source_router = MagicMock()
        self.mock_user_roles_router = MagicMock()
        self.mock_auth_token_router = MagicMock()

    @patch("src.routes.routes_loader.AuthTokenRouter")
    @patch("src.routes.routes_loader.UserRolesRouter")
    @patch("src.routes.routes_loader.DataSourceRouter")
    @patch("src.routes.routes_loader.auth.router")
    @patch("src.routes.routes_loader.get_types_router")
    @patch("src.routes.routes_loader.get_entities_router")
    @patch("src.routes.routes_loader.config")
    @patch("src.routes.routes_loader.ScorpioBrokerClient")
    @patch("src.routes.routes_loader.APIRouter")
    def test_get_main_router_success(
        self,
        mock_apirouter,
        mock_scorpio_cls,
        mock_config,
        mock_get_entities,
        mock_get_types,
        mock_auth_router,
        mock_data_source_router,
        mock_user_roles_router,
        mock_auth_token_router,
    ):
        mock_config.CONTEXT_DATA_BROKER_URL = "http://mocked-url"
        mock_router = MagicMock()
        mock_apirouter.return_value = mock_router
        mock_scorpio_instance = MagicMock()
        mock_scorpio_cls.return_value = mock_scorpio_instance
        mock_get_entities.return_value = MagicMock()
        mock_get_types.return_value = MagicMock()

        routes_loader.get_main_router()

        expected_calls = [
            call(mock_auth_router, prefix="/api/v1", tags=["Authentication"]),
            call(mock_get_entities.return_value, prefix="/api/v1", tags=["Entities"]),
            call(mock_get_types.return_value, prefix="/api/v1", tags=["Types"]),
            call(mock_data_source_router, prefix="/api/v1/dstg", tags=["Data Source"]),
            call(mock_user_roles_router, prefix="/api/v1/dstg", tags=["Data Source"]),
            call(mock_auth_token_router, prefix="/api/v1", tags=["Data Source"]),
        ]
        mock_router.include_router.assert_has_calls(expected_calls, any_order=True)

    @patch(
        "src.routes.routes_loader.ScorpioBrokerClient",
        side_effect=Exception("Init failed"),
    )
    @patch("src.routes.routes_loader.config")
    def test_get_main_router_fails_on_scorpio_init(self, mock_config, _):
        mock_config.CONTEXT_DATA_BROKER_URL = "invalid-url"
        with self.assertRaises(Exception) as context:
            routes_loader.get_main_router()
        self.assertIn("Init failed", str(context.exception))

    @patch(
        "src.routes.routes_loader.get_entities_router",
        side_effect=Exception("Entities failed"),
    )
    @patch("src.routes.routes_loader.get_types_router")
    @patch("src.routes.routes_loader.config")
    @patch("src.routes.routes_loader.ScorpioBrokerClient")
    def test_get_main_router_fails_on_entities(
        self, mock_scorpio_cls, mock_config, _, __
    ):
        mock_config.CONTEXT_DATA_BROKER_URL = "http://mocked-url"
        mock_scorpio_cls.return_value = MagicMock()

        with self.assertRaises(Exception) as context:
            routes_loader.get_main_router()
        self.assertIn("Entities failed", str(context.exception))


if __name__ == "__main__":
    unittest.main()
