import os
from alembic import command
from alembic.config import Config


def run_migrations():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, ".."))
    alembic_cfg = Config(os.path.join(root_dir, "config", "alembic.ini"))

    migrations_path = os.path.join(root_dir, "migrations")
    alembic_cfg.set_main_option("script_location", migrations_path)

    command.upgrade(alembic_cfg, "head")
