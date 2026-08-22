import os
import re
import glob

frontend_dir = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src'

api_path = os.path.join(frontend_dir, 'services', 'api.ts')
with open(api_path, 'r', encoding='utf-8') as f:
    api_content = f.read()

# Remove useAuthStore import
api_content = re.sub(r'import\s*\{\s*useAuthStore\s*\}\s*from\s*[\'"].*?authStore[\'"];?\n', '', api_content)
# Remove token auth logic
api_content = re.sub(r'const\s*token\s*=\s*useAuthStore\.getState\(\)\.token;?\n\s*if\s*\(token\)\s*\{\s*headers\.Authorization\s*=\s*Bearer \$\{token\};\s*\}', '', api_content)
# Remove 401 logic
api_content = re.sub(r'if\s*\([^)]*\.status\s*===\s*401\)\s*\{\s*useAuthStore\.getState\(\)\.logout\(\);\s*window\.location\.href\s*=\s*[\'"]/login[\'"];\s*\}', '', api_content)
# Remove fitnessApi
api_content = re.sub(r'export\s*const\s*fitnessApi\s*=\s*\{[^}]*\};?', '', api_content, flags=re.DOTALL)
api_content = re.sub(r'import\s*\{[^}]*FitnessSummary[^}]*\}\s*from\s*[\'"]\.\./types[\'"];?\n?', '', api_content)

with open(api_path, 'w', encoding='utf-8') as f:
    f.write(api_content)

# Clean up stores
store_dir = os.path.join(frontend_dir, 'stores')
if os.path.exists(os.path.join(store_dir, 'authStore.ts')):
    os.remove(os.path.join(store_dir, 'authStore.ts'))

# Clean up router
router_path = os.path.join(frontend_dir, 'routes', 'router.tsx')
with open(router_path, 'r', encoding='utf-8') as f:
    router_content = f.read()

# Remove auth imports and routes
router_content = re.sub(r'import.*?Login.*?\n', '', router_content)
router_content = re.sub(r'import.*?Register.*?\n', '', router_content)
router_content = re.sub(r'\{[^\}]*path:\s*[\'"]/login[\'"][^\}]*\},\s*', '', router_content)
router_content = re.sub(r'\{[^\}]*path:\s*[\'"]/register[\'"][^\}]*\},\s*', '', router_content)

with open(router_path, 'w', encoding='utf-8') as f:
    f.write(router_content)

# Remove backend auth/user related files
backend_api_dir = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend\app\api\v1'
for f in ['users.py', 'auth.py', 'finance.py', 'fitness.py']:
    p = os.path.join(backend_api_dir, f)
    if os.path.exists(p): os.remove(p)

backend_schemas_dir = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend\app\schemas'
for f in ['user.py', 'auth.py', 'finance.py', 'fitness.py']:
    p = os.path.join(backend_schemas_dir, f)
    if os.path.exists(p): os.remove(p)

backend_services_dir = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend\app\services'
for f in ['auth_service.py', 'user_service.py', 'finance_service.py', 'fitness_service.py']:
    p = os.path.join(backend_services_dir, f)
    if os.path.exists(p): os.remove(p)

