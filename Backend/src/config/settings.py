import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def _get_env(key: str, default: str = "") -> str:
    """Get environment variable with optional default"""
    return os.getenv(key, default).strip()

# Database Configuration
DATABASE_ENV = _get_env("DATABASE", "PROD")

# Use PROD or TEST database based on DATABASE env variable
if DATABASE_ENV == "PROD":
    DATABASE_URL = _get_env(
        "BACKEND_PROD_DATABASE_URL", "postgresql://user:pass@localhost/db"
    )
    TEST_DATABASE_URL = _get_env("BACKEND_TEST_DATABASE_URL", "")
else:
    DATABASE_URL = _get_env(
        "BACKEND_TEST_DATABASE_URL", "postgresql://user:pass@localhost/db"
    )
    TEST_DATABASE_URL = _get_env("BACKEND_PROD_DATABASE_URL", "")

# Authentication Configuration
BETTER_AUTH_SECRET = _get_env(
    "BETTER_AUTH_SECRET",
    "test-secret-key-for-development-only-minimum-32-characters",
)

# Stripe Configuration
STRIPE_SECRET_KEY = _get_env("STRIPE_SECRET_KEY", "sk_test_default")
STRIPE_PRICE_ID = _get_env("STRIPE_PRODUCT_PRICE_ID", "price_default")
STRIPE_WEBHOOK_SECRET = _get_env(
    "STRIPE_WEBHOOK_SECRET", "whsec_default"
)
