from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP

revision = "836aa2ab6fa7_create_data_source_table"
down_revision = "6e338d0e8540_create_context_tables"
branch_labels = None
depends_on = None

DEFAULT_TIMESTAMP_NOW = sa.text("NOW()")
DEFAULT_FALSE = sa.text("FALSE")


def upgrade():
    op.create_table(
        "data_source",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "created_at",
            TIMESTAMP,
            nullable=False,
            server_default=DEFAULT_TIMESTAMP_NOW,
        ),
        sa.Column(
            "updated_at",
            TIMESTAMP,
            nullable=False,
            server_default=DEFAULT_TIMESTAMP_NOW,
            onupdate=DEFAULT_TIMESTAMP_NOW,
        ),
        sa.Column(
            "is_deleted", sa.Boolean, nullable=False, server_default=DEFAULT_FALSE
        ),
        sa.Column(
            "is_hidden", sa.Boolean, nullable=False, server_default=DEFAULT_FALSE
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("connection_string", sa.Text, nullable=False),
        sa.Column("user", sa.String(255), nullable=False),
        sa.Column("password", sa.String(255), nullable=False),
        schema="data_platform",
    )


def downgrade():
    op.drop_table("data_source", schema="data_platform")

    op.execute("ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(32)")

    op.execute("DROP SCHEMA IF EXISTS data_platform CASCADE")
