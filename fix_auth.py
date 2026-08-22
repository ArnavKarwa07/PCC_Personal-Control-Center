import os
import re

def strip_auth(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove useAuthStore imports
    content = re.sub(r'import.*?useAuthStore.*?from.*?authStore[\'\"];?\n', '', content)
    
    # Simple regex to remove logout button logic or just let the typescript compiler complain less
    # In SettingsPage, DesktopLayout, MobileLayout
    if 'useAuthStore' in content:
        content = re.sub(r'const\s*\{\s*logout\s*\}\s*=\s*useAuthStore\(\);', 'const logout = () => {};', content)
        content = re.sub(r'const\s*logout\s*=\s*useAuthStore\(\(state\)\s*=>\s*state\.logout\);', 'const logout = () => {};', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

strip_auth(r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\features\settings\SettingsPage.tsx')
strip_auth(r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\layouts\DesktopLayout.tsx')
strip_auth(r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\layouts\MobileLayout.tsx')

api_path = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\services\api.ts'
with open(api_path, 'r', encoding='utf-8') as f:
    api = f.read()

api = re.sub(r'import\s*\{\s*useAuthStore\s*\}\s*from\s*[\'"].*?authStore[\'"];?\n', '', api)
api = re.sub(r'FitnessSummary,\s*', '', api)
api = re.sub(r',\s*FitnessSummary', '', api)
api = re.sub(r'WorkoutItem,\s*', '', api)
api = re.sub(r',\s*WorkoutItem', '', api)

# Remove the useAuthStore inside interceptors
api = re.sub(r'useAuthStore\.getState\(\)\.token', 'null', api)
api = re.sub(r'useAuthStore\.getState\(\)\.logout\(\);', '', api)

with open(api_path, 'w', encoding='utf-8') as f:
    f.write(api)
