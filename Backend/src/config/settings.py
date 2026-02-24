from starlette.config import Config
from starlette.datastructures import Secret

try:
    config = Config(".env")
except FileNotFoundError:
    config = Config()

# Database Configuration
DATABASE_URL = config(
    "DATABASE_URL", cast=Secret, default="postgresql://user:pass@localhost/db"
)
TEST_DATABASE_URL = config("TEST_DATABASE_URL", default=None, cast=Secret)

# Authentication Configuration
BETTER_AUTH_SECRET = config(
    "BETTER_AUTH_SECRET",
    cast=str,
    default="test-secret-key-for-development-only-minimum-32-characters",
)

# Stripe Configuration
STRIPE_SECRET_KEY = config("SB_STRIPE_SECRET_KEY", cast=str, default="sk_test_default")
STRIPE_PRICE_ID = config("SB_PRODUCT_PRICE_ID", cast=str, default="price_default")
STRIPE_WEBHOOK_SECRET = config(
    "STRIPE_WEBHOOK_SECRET", cast=str, default="whsec_default"
)
