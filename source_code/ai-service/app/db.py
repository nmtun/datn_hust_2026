import os
from contextlib import contextmanager
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

BASE_DIR = Path(__file__).resolve().parents[1]
WORKSPACE_DIR = Path(__file__).resolve().parents[2]
BACKEND_ENV_PATH = WORKSPACE_DIR / "back-end" / ".env"

# Load env
load_dotenv(BACKEND_ENV_PATH, override=False)


def _required_env(*keys: str) -> str:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    raise ValueError(f"Thiếu biến môi trường: {' hoặc '.join(keys)}")


def get_db_config():
    return {
        "host": _required_env("AI_DB_HOST", "DB_HOST"),
        "port": _required_env("AI_DB_PORT", "DB_PORT"),
        "name": _required_env("AI_DB_NAME", "DB_NAME"),
        "user": _required_env("AI_DB_USER", "DB_USER"),
        "password": _required_env("AI_DB_PASSWORD", "DB_PASSWORD"),
    }


def _build_database_url() -> str:
    config = get_db_config()
    return f"mysql+pymysql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['name']}?charset=utf8mb4"


engine = create_engine(
    _build_database_url(),
    pool_pre_ping=True,
    pool_recycle=3600,
)


@contextmanager
def get_connection():
    connection = engine.connect()
    try:
        yield connection
    finally:
        connection.close()


def test_connection() -> bool:
    config = get_db_config()

    try:
        with get_connection() as connection:
            connection.execute(text("SELECT 1"))

        print("✅ Kết nối DB thành công!")
        return True

    except SQLAlchemyError as error:
        print("❌ Kết nối DB thất bại!")
        print(f"Lỗi: {error}")
        return False