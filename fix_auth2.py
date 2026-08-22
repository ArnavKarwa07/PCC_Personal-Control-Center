import os
import re

def fix_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'const\s*user\s*=\s*useAuthStore\(\(state\)\s*=>\s*state\.user\);', 'const user = { email: "owner@pcc.local", name: "Owner" };', content)
    content = re.sub(r'const\s*user\s*=\s*useAuthStore\(\(state\)\s*=>\s*state\);', 'const user = { email: "owner@pcc.local", name: "Owner" };', content)
    content = re.sub(r'const\s*\{\s*user\s*\}\s*=\s*useAuthStore\(\);', 'const user = { email: "owner@pcc.local", name: "Owner" };', content)
    content = re.sub(r'useAuthStore\.getState\(\)\.user', '{ email: "owner@pcc.local", name: "Owner" }', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file(r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\features\settings\SettingsPage.tsx')
fix_file(r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\layouts\DesktopLayout.tsx')
fix_file(r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\layouts\MobileLayout.tsx')

api_path = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\services\api.ts'
with open(api_path, 'r', encoding='utf-8') as f:
    api = f.read()

# Fix trim issues on lines 74, 75. It's likely using 	oken?.trim() or similar. 
# Since we replaced token with 
ull earlier (or removed it), let's just find and replace the whole block or comment it.
api = re.sub(r'null\?\.trim\(\)', '""', api)

with open(api_path, 'w', encoding='utf-8') as f:
    f.write(api)

