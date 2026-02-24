from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from ..main import app
from ..src.config.db import get_session
from ..src.config.settings import TEST_DATABASE_URL
import pytest

# Fix: Replace "postgresql://" with "postgresql+psycopg2://"
connection_string = str(TEST_DATABASE_URL).replace(
    "postgresql://", "postgresql+psycopg2://"
)

engine = create_engine(
    connection_string,
    connect_args={"sslmode": "require"},
    pool_recycle=300
)  
    
@pytest.fixture(name = "session")
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session: # so with keyword is a context manager which create and destroy session
        yield session  # Yield is use to Pause and Give
    SQLModel.metadata.drop_all(engine)

# We build function here so that we can return session otherwise we can't because on upper function we are yielding not returning and to call automatically we will build a function.

@pytest.fixture(name="client")
def client_fixture(session: Session):
    # Step 1: Define a function to return the test session
    def get_session_override():
        return session

    # Step 2: Override FastAPI dependency to use test session
    app.dependency_overrides[get_session] = get_session_override

    # Step 3: Yield the client to be used in tests
    client = TestClient(app)
    yield client

    # Step 4: Clean up after test
    app.dependency_overrides.clear()


