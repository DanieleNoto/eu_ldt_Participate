"""Migration: update_contexts_table

Revision ID: 0a4ae817ae33
Revises: 836aa2ab6fa7_create_data_source_table
Created on: 2025-04-23 12:38:46.243805
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0a4ae817ae33_update_contexts_table"
down_revision = "836aa2ab6fa7_create_data_source_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.rename_table("dp_contexts", "contexts", schema="data_platform")

    op.add_column(
        "contexts",
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        schema="data_platform",
    )
    op.add_column(
        "contexts",
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        schema="data_platform",
    )
    op.add_column(
        "contexts",
        sa.Column(
            "is_deleted", sa.BOOLEAN(), nullable=False, server_default=sa.text("false")
        ),
        schema="data_platform",
    )
    op.add_column(
        "contexts",
        sa.Column(
            "is_hidden", sa.BOOLEAN(), nullable=False, server_default=sa.text("false")
        ),
        schema="data_platform",
    )


def downgrade() -> None:
    op.drop_column("contexts", "is_hidden", schema="data_platform")
    op.drop_column("contexts", "is_deleted", schema="data_platform")
    op.drop_column("contexts", "updated_at", schema="data_platform")
    op.drop_column("contexts", "created_at", schema="data_platform")

    op.rename_table("contexts", "dp_contexts", schema="data_platform")
