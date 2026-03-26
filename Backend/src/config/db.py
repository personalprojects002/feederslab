from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from src.config.settings import DATABASE_URL

# Convert connection string to asyncpg format
connection_string = str(DATABASE_URL).replace("postgresql://", "postgresql+asyncpg://")
# Remove sslmode parameter as asyncpg handles it differently
connection_string = connection_string.replace("?sslmode=require", "")
connection_string = connection_string.replace("&sslmode=require", "")

engine = create_async_engine(
    connection_string,
    pool_pre_ping=True,
    connect_args={"ssl": True}
)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_session():
    async with async_session_maker() as session:
        yield session
