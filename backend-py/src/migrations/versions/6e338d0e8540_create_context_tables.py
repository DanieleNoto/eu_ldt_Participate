from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP

revision = "6e338d0e8540_create_context_tables"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE SCHEMA IF NOT EXISTS data_platform")
    op.execute("ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(64)")
    op.create_table(
        "dp_contexts",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("context", sa.String, nullable=False, unique=True),
        schema="data_platform",
    )

    op.create_table(
        "entity_contexts",
        sa.Column("entity_id", sa.String, primary_key=True),
        sa.Column(
            "context_id",
            sa.Integer,
            sa.ForeignKey("data_platform.dp_contexts.id"),
            nullable=False,
        ),
        sa.Column("tenant", sa.String, nullable=False),
        sa.Column(
            "created_at",
            TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "modified",
            TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        schema="data_platform",
    )


def downgrade():
    op.drop_table("entity_contexts", schema="data_platform")
    op.drop_table("dp_contexts", schema="data_platform")
