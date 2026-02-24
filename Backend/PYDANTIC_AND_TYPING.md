# Pydantic and typing (simple notes)

## Where Pydantic is used and why

- Pydantic models live in [Backend/src/routes/schemas.py](Backend/src/routes/schemas.py). These classes (like `BoardCreateRequest`, `BoardUpdateRequest`, `BoardResponse`, `CheckoutRequest`, `CheckoutResponse`, `PortalResponse`) define the shape of request and response data. Pydantic uses them to validate input, convert types, and serialize output.
  - See the request/response schemas in [Backend/src/routes/schemas.py](Backend/src/routes/schemas.py#L7-L77).
- The API routes use these schemas to validate incoming JSON and to control response shapes:
  - Boards routes declare request bodies and response models like `body: BoardCreateRequest` and `response_model=BoardResponse` in [Backend/src/routes/boards.py](Backend/src/routes/boards.py#L12-L113).
  - Billing routes use `CheckoutRequest`, `CheckoutResponse`, and `PortalResponse` the same way in [Backend/src/routes/billing.py](Backend/src/routes/billing.py#L23-L75).

In simple words: Pydantic is used to make sure the API gets the right fields and types from the client, and to return clean, predictable JSON back.

## Is static typing used? If yes, where

Yes. This code uses Python type hints (static typing) in several places. These hints help editors and linters understand types, but they do not enforce types at runtime by themselves.

- Function parameters and return shapes are typed in the routes, for example `board_id: int`, `body: BoardCreateRequest`, `user_email: CurrentUser`, and `session: Session` in [Backend/src/routes/boards.py](Backend/src/routes/boards.py#L12-L141).
- Response models are typed as lists, e.g. `response_model=list[BoardResponse]` in [Backend/src/routes/boards.py](Backend/src/routes/boards.py#L42-L47).
- Data models use type annotations for database fields, like `id: int | None`, `board_name: str`, and `created_at: datetime` in [Backend/src/models/board.py](Backend/src/models/board.py#L10-L16).
- User model fields are typed with `str`, `bool`, and `Optional[datetime]` in [Backend/src/models/user.py](Backend/src/models/user.py#L20-L31).

In simple words: static typing is used as type hints across the routes and models to make the code clearer and safer for tools, but Python still runs dynamically.
