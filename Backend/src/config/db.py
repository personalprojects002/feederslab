from sqlmodel import Session, create_engine

from src.config.settings import DATABASE_URL

connection_string = str(DATABASE_URL).replace("postgresql://", "postgresql+psycopg2://")
engine = create_engine(
    connection_string, connect_args={"sslmode": "require"}, pool_recycle=300
)


def get_session():
    with (
        Session(engine) as session
    ):  # so with keyword is a context manager which create and destroy session
        yield session  # Yield is use to Pause and Give


# # 1. THIS IS YOUR ORIGINAL CODE (The "Automatic" Way)
# def get_session():
#     with Session(engine) as session: # <--- Step A: Open connection
#         yield session                # <--- Step B: Pause & Give connection
#     # <--- Step C: (Hidden) Connection closes automatically here after use

# # 2. THIS IS THE "BEHIND THE SCENES" VIEW (The "Manual" Way)
# def get_session_manual():
#     session = Session(engine)        # <--- Step A: Open connection
#     try:
#         yield session                # <--- Step B: Pause & Give connection
#     finally:
#         session.close()              # <--- Step C: This runs ONLY AFTER the yield is finished
