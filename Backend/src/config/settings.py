"""Centralized runtime configuration.

This module intentionally validates critical settings at import time so
misconfigured deployments fail fast instead of producing delayed runtime
failures in request handlers.
"""

from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	# Keep configuration loading strict and explicit. This makes deployment
	# failures obvious when required keys are missing, while still ignoring
	# unrelated host-level variables provided by cloud platforms.
	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		extra="ignore",
	)

	database: Literal["PROD", "TEST"] = Field(default="PROD", alias="DATABASE")

	backend_prod_database_url: str = Field(alias="BACKEND_PROD_DATABASE_URL")
	backend_test_database_url: str = Field(alias="BACKEND_TEST_DATABASE_URL")

	cors_origins: str = Field(default="http://localhost:3000,http://localhost:3001", alias="CORS_ORIGINS")
	frontend_origin: str = Field(default="http://localhost:3000", alias="FRONTEND_ORIGIN")

	better_auth_secret: str = Field(alias="BETTER_AUTH_SECRET")

	stripe_secret_key: str = Field(alias="STRIPE_SECRET_KEY")
	stripe_price_id: str = Field(alias="STRIPE_PRODUCT_PRICE_ID")
	stripe_webhook_secret: str = Field(alias="STRIPE_WEBHOOK_SECRET")

	app_url: str = Field(default="http://localhost:3000", alias="APP_URL")

	access_token_expiry_seconds: int = Field(default=1800, alias="ACCESS_TOKEN_EXPIRY_SECONDS")
	refresh_token_expiry_days: int = Field(default=14, alias="REFRESH_TOKEN_EXPIRY_DAYS")
	refresh_token_leeway_seconds: int = Field(default=30, alias="REFRESH_TOKEN_LEEWAY_SECONDS")

	refresh_cookie_name: str = Field(default="feeders_refresh_token", alias="REFRESH_COOKIE_NAME")
	refresh_cookie_secure: bool = Field(default=False, alias="REFRESH_COOKIE_SECURE")
	refresh_cookie_samesite: str = Field(default="lax", alias="REFRESH_COOKIE_SAMESITE")
	refresh_cookie_path: str = Field(default="/", alias="REFRESH_COOKIE_PATH")

	@property
	def database_url(self) -> str:
		# A single accessor keeps all callers agnostic to PROD/TEST switching,
		# preventing accidental mixed-environment reads throughout the codebase.
		if self.database == "TEST":
			return self.backend_test_database_url.strip()
		return self.backend_prod_database_url.strip()

	@property
	def cors_origins_list(self) -> list[str]:
		values = [origin.strip() for origin in self.cors_origins.split(",")]
		return [origin for origin in values if origin]


settings = Settings()
