"""Migration: update_contexts_table

Revision ID: af54bd2281e1
Revises: 0a4ae817ae33_update_contexts_table
Created on: 2025-04-23 12:40:07.978183
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "af54bd2281e1_update_entity_table"
down_revision = "0a4ae817ae33_update_contexts_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "entity_contexts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        schema="data_platform",
    )

    op.execute(
        """
        CREATE SEQUENCE IF NOT EXISTS data_platform.entity_contexts_id_seq OWNED BY data_platform.entity_contexts.id;
        ALTER TABLE data_platform.entity_contexts ALTER COLUMN id SET DEFAULT nextval('data_platform.entity_contexts_id_seq');
    """
    )

    op.drop_constraint(
        "entity_contexts_pkey",
        "entity_contexts",
        schema="data_platform",
        type_="primary",
    )
    op.create_primary_key(
        "entity_contexts_pkey", "entity_contexts", ["id"], schema="data_platform"
    )

    op.alter_column(
        "entity_contexts",
        "entity_id",
        existing_type=sa.String(),
        nullable=False,
        schema="data_platform",
    )

    op.create_foreign_key(
        "fk_context_id_contexts",
        "entity_contexts",
        "contexts",
        ["context_id"],
        ["id"],
        source_schema="data_platform",
        referent_schema="data_platform",
    )

    op.alter_column(
        "entity_contexts",
        "modified",
        new_column_name="updated_at",
        schema="data_platform",
        nullable=False,
        server_default=sa.text("NOW()"),
    )

    op.add_column(
        "entity_contexts",
        sa.Column(
            "is_deleted", sa.BOOLEAN(), nullable=False, server_default=sa.text("false")
        ),
        schema="data_platform",
    )
    op.add_column(
        "entity_contexts",
        sa.Column(
            "is_hidden", sa.BOOLEAN(), nullable=False, server_default=sa.text("false")
        ),
        schema="data_platform",
    )


def downgrade() -> None:
    op.drop_column("entity_contexts", "is_hidden", schema="data_platform")
    op.drop_column("entity_contexts", "is_deleted", schema="data_platform")

    op.alter_column(
        "entity_contexts",
        "updated_at",
        new_column_name="modified",
        schema="data_platform",
        nullable=False,
        server_default=sa.text("NOW()"),
    )

    op.drop_constraint(
        "entity_contexts_context_id_fkey",
        "entity_contexts",
        schema="data_platform",
        type_="foreignkey",
    )
    op.drop_constraint(
        "entity_contexts_pkey",
        "entity_contexts",
        schema="data_platform",
        type_="primary",
    )

    op.create_primary_key(
        "entity_contexts_pkey", "entity_contexts", ["entity_id"], schema="data_platform"
    )

    op.drop_column("entity_contexts", "id", schema="data_platform")
    op.execute("DROP SEQUENCE IF EXISTS data_platform.entity_contexts_id_seq")
