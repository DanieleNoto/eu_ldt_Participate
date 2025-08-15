import unittest
from cryptography.fernet import Fernet
from services.security.crypto_service import CryptoService


class CryptoServiceTest(unittest.TestCase):
    def setUp(self):
        key = Fernet.generate_key()
        self.fernet = Fernet(key)

        self.crypto_service = CryptoService.__new__(CryptoService)
        self.crypto_service.fernet_key = key
        self.crypto_service.fernet = self.fernet

    def test_encrypt_returns_encrypted_string(self):
        plaintext = "test123"
        encrypted = self.crypto_service.encrypt(plaintext)

        self.assertIsInstance(encrypted, str)
        self.assertNotEqual(plaintext, encrypted)

    def test_decrypt_returns_original_string(self):
        plaintext = "hello world"
        encrypted = self.crypto_service.encrypt(plaintext)
        decrypted = self.crypto_service.decrypt(encrypted)

        self.assertEqual(decrypted, plaintext)

    def test_encrypt_decrypt_is_reversible(self):
        original_text = "ENCRYPT_ME"
        encrypted = self.crypto_service.encrypt(original_text)
        decrypted = self.crypto_service.decrypt(encrypted)

        self.assertEqual(original_text, decrypted)


if __name__ == "__main__":
    unittest.main()
