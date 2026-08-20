"""
app/core/security.py
----------------------
Password hashing via PBKDF2-HMAC-SHA256 (stdlib only, no extra dependency).
Not bcrypt/argon2, but real salted+iterated hashing — not plaintext, not a
fake check.
"""

import hashlib
import secrets

PBKDF2_ITERATIONS = 200_000


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    """Returns (hash_hex, salt_hex). Generates a new random salt if none given."""
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), PBKDF2_ITERATIONS)
    return digest.hex(), salt


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    computed_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(computed_hash, expected_hash)
