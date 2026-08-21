"""Add Teams Calendar, Slack, GitLab, and Jira integration providers

Revision ID: b71239c8e412
Revises: 4a3652a9cb85
Create Date: 2026-08-20 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b71239c8e412'
down_revision: Union[str, None] = '4a3652a9cb85'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op schema modification for SQLite compatibility as VARCHAR handles Enum strings
    with op.batch_alter_table('integrations', schema=None):
        pass


def downgrade() -> None:
    with op.batch_alter_table('integrations', schema=None):
        pass
