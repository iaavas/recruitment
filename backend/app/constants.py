import os

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 50
SECRET_KEY = os.getenv("SECRET_KEY", "dev-fallback-key-change-in-prod")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))