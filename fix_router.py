import os
import re

filepath = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend\app\api\v1\router.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any include_router lines with auth, users, finance, fitness
content = re.sub(r'.*?include_router.*?auth.*?\n', '', content)
content = re.sub(r'.*?include_router.*?users.*?\n', '', content)
content = re.sub(r'.*?include_router.*?finance.*?\n', '', content)
content = re.sub(r'.*?include_router.*?fitness.*?\n', '', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

