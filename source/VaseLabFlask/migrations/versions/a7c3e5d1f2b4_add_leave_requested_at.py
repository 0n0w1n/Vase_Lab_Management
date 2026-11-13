"""add LeaveRequestedAt to RequestAssignment

Revision ID: a7c3e5d1f2b4
Revises: 39189c62dc60
Create Date: 2026-11-11 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a7c3e5d1f2b4'
down_revision = '39189c62dc60'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('RequestAssignment', schema=None) as batch_op:
        batch_op.add_column(sa.Column('LeaveRequestedAt', sa.DateTime(), nullable=True))


def downgrade():
    with op.batch_alter_table('RequestAssignment', schema=None) as batch_op:
        batch_op.drop_column('LeaveRequestedAt')
