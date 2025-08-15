from pydantic import BaseModel, Field


class AuthTokenRequest(BaseModel):
    client_id: str = Field(..., description="The client identifier")
    grant_type: str = Field(..., description="The grant type used for authentication")
    client_secret: str = Field(..., description="The secret associated with the client")
    scope: str = Field(..., description="The scope of the requested token")
