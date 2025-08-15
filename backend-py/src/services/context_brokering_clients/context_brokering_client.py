import abc

from requests import Response

IMPLEMENT_THIS_METHOD_MESSAGE = "you must implement this method"


class ContextBrokeringClient(abc.ABC):
    def get_entities(self, tenant, entity_type, link_header, accept) -> []:
        raise NotImplementedError(IMPLEMENT_THIS_METHOD_MESSAGE)  # pragma: no cover

    def create_entity(self, entity_id, entity, tenant) -> Response:
        raise NotImplementedError(IMPLEMENT_THIS_METHOD_MESSAGE)  # pragma: no cover

    def delete_entity(self, tenant: str, entity_id: str) -> Response:
        raise NotImplementedError(IMPLEMENT_THIS_METHOD_MESSAGE)  # pragma: no cover

    def update_entity(
        self,
        tenant: str,
        entity_id: str,
        link_header: str,
        updated_attributes: dict,
        attribute: str = None,
    ) -> Response:
        raise NotImplementedError(IMPLEMENT_THIS_METHOD_MESSAGE)  # pragma: no cover
