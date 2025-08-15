from cryptography.fernet import Fernet
from config.config import FERNET_KEY


class CryptoService:
    def __init__(self):
        self.fernet_key = FERNET_KEY
        self.fernet = Fernet(self.fernet_key)

    def encrypt(self, plain_text: str) -> str:
        return self.fernet.encrypt(plain_text.encode()).decode()

    def decrypt(self, encrypted_text: str) -> str:
        return self.fernet.decrypt(encrypted_text.encode()).decode()
