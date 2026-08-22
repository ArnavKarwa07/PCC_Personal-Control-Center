import os
import re

backend_dir = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove current_user: dict = Depends(get_current_user) from function signatures
    content = re.sub(r',\s*current_user\s*:\s*(?:dict|UserResponse)\s*=\s*Depends\([^)]*\)', '', content)
    content = re.sub(r'current_user\s*:\s*(?:dict|UserResponse)\s*=\s*Depends\([^)]*\)\s*,?', '', content)
    
    # Remove from docstrings or body where it might be checked (like user_id = current_user.get("id"))
    # Just a simple hack: replace current_user.id with a default hardcoded id or something
    content = re.sub(r'current_user\.get\("id"\)', '"default_user_id"', content)
    content = re.sub(r'current_user\.id', '"default_user_id"', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

api_dir = os.path.join(backend_dir, 'app', 'api', 'v1')
for file in os.listdir(api_dir):
    if file.endswith('.py') and file not in ('router.py', '__init__.py'):
        process_file(os.path.join(api_dir, file))

# Fix router.py
router_path = os.path.join(api_dir, 'router.py')
with open(router_path, 'r', encoding='utf-8') as f:
    router_content = f.read()

router_content = re.sub(r'from \. import .*?\n', lambda m: m.group(0).replace(' auth,', '').replace(', auth', '').replace('auth, ', '').replace(' users,', '').replace(', users', '').replace('users, ', ''), router_content)
router_content = re.sub(r'api_router\.include_router\(auth\.router.*?\n', '', router_content)
router_content = re.sub(r'api_router\.include_router\(users\.router.*?\n', '', router_content)

with open(router_path, 'w', encoding='utf-8') as f:
    f.write(router_content)

# Fix config.py
config_path = os.path.join(backend_dir, 'app', 'core', 'config.py')
with open(config_path, 'r', encoding='utf-8') as f:
    config_content = f.read()
    
config_content = re.sub(r'SECRET_KEY: str.*?\n', '', config_content)
config_content = re.sub(r'ALGORITHM: str.*?\n', '', config_content)
config_content = re.sub(r'ACCESS_TOKEN_EXPIRE_MINUTES: int.*?\n', '', config_content)
if 'GEMINI_API_KEY: str' not in config_content:
    config_content = config_content.replace('class Settings(BaseSettings):', 'class Settings(BaseSettings):\n    GEMINI_API_KEY: str = ""')

with open(config_path, 'w', encoding='utf-8') as f:
    f.write(config_content)

# Fix main.py
main_path = os.path.join(backend_dir, 'app', 'main.py')
with open(main_path, 'r', encoding='utf-8') as f:
    main_content = f.read()

main_content = re.sub(r'from app\.core\.middleware import.*?\n', '', main_content)
main_content = re.sub(r'app\.add_middleware\(JWTAuthMiddleware\)', '', main_content)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(main_content)
