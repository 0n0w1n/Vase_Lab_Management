"""rename UserName to FullName

Revision ID: 3ae30227b45a
Revises: c3c83ae309bd
Create Date: 2026-09-15 06:16:30.557564

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3ae30227b45a'
down_revision = 'c3c83ae309bd'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("Users", "UserName", new_column_name="UserFullName",
                    existing_type=sa.String(length=255), existing_nullable=False)



def downgrade():
    op.alter_column("Users", "UserFullName", new_column_name="UserName",
                    existing_type=sa.String(length=255), existing_nullable=False)
