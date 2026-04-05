from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from src.config.settings import settings

def _build_asyncpg_connection_string(raw_database_url: str) -> str:
    """Normalize DSN for SQLAlchemy asyncpg driver.

    asyncpg does not support libpq query params like sslmode/channel_binding.
    Removing them via URL parsing avoids malformed DSNs such as
    `.../neondb&channel_binding=require`.
    """
    async_url = raw_database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    split = urlsplit(async_url)

    blocked_keys = {"sslmode", "channel_binding"}
    # Removing unsupported libpq params at parse-time avoids subtle DSN
    # corruption that can point asyncpg at a non-existent database name.
    kept_params = [
        (key, value)
        for key, value in parse_qsl(split.query, keep_blank_values=True)
        if key not in blocked_keys
    ]

    normalized_query = urlencode(kept_params, doseq=True)
    return urlunsplit((split.scheme, split.netloc, split.path, normalized_query, split.fragment))


connection_string = _build_asyncpg_connection_string(str(settings.database_url))

# Create async engine
engine = create_async_engine(
    connection_string,
    pool_pre_ping=True,
    # Neon and similar managed Postgres providers require SSL; we enforce it
    # here so local and cloud behavior stay aligned.
    connect_args={"ssl": True}  # Asyncpg handles SSL here
)

# Create session maker
async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Dependency to get async session
async def get_session():
    async with async_session_maker() as session:
        yield session


















# from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
# from sqlalchemy.orm import sessionmaker
# from src.config.settings import DATABASE_URL

# # Convert connection string to asyncpg format
# connection_string = str(DATABASE_URL).replace("postgresql://", "postgresql+asyncpg://")
# # Remove sslmode parameter as asyncpg handles it differently
# connection_string = connection_string.replace("?sslmode=require", "")
# connection_string = connection_string.replace("&sslmode=require", "")

# engine = create_async_engine(
#     connection_string,
#     pool_pre_ping=True,
#     connect_args={"ssl": True}
# )
# async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# async def get_session():
#     async with async_session_maker() as session:
#         yield session
