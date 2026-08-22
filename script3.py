import os
import re

backend_dir = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend'

api_dir = os.path.join(backend_dir, 'app', 'api', 'v1')
for file in os.listdir(api_dir):
    if file.endswith('.py'):
        filepath = os.path.join(api_dir, file)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace default_user_id with the UUID
        content = content.replace('"default_user_id"', '"00000000-0000-0000-0000-000000000001"')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

config_path = os.path.join(backend_dir, 'app', 'core', 'config.py')
with open(config_path, 'r', encoding='utf-8') as f:
    config_content = f.read()

if 'DEFAULT_OWNER_ID' not in config_content:
    config_content = config_content.replace('class Settings(BaseSettings):', 'class Settings(BaseSettings):\n    DEFAULT_OWNER_ID: str = "00000000-0000-0000-0000-000000000001"')

with open(config_path, 'w', encoding='utf-8') as f:
    f.write(config_content)

env_path = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\.env'
env_ex_path = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\.env.example'

for p in [env_path, env_ex_path]:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'GEMINI_API_KEY' not in content:
            val = 'AIzaSyBk_example_key_placeholder' if p.endswith('.env') else ''
            content += f'\nGEMINI_API_KEY={val}\n'
            
        if 'tauri.localhost' not in content:
            # Simple append to CORS_ORIGINS
            content = re.sub(r'(CORS_ORIGINS=.*)', r'\1,http://tauri.localhost,https://tauri.localhost', content)
            
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)

import uuid
from datetime import datetime

alembic_dir = os.path.join(backend_dir, 'alembic', 'versions')
migration_file = os.path.join(alembic_dir, f'drop_deprecated_tables.py')

mig_content = '''"""drop_deprecated_tables

Revision ID: drop_deprecated_tables
Revises: 
Create Date: 2026-08-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'drop_deprecated_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table('finances')


def downgrade() -> None:
    op.create_table('finances',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
'''
with open(migration_file, 'w', encoding='utf-8') as f:
    f.write(mig_content)

