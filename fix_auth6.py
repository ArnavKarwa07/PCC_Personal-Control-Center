import os
import re

# Fix SettingsPage
sp = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\features\settings\SettingsPage.tsx'
with open(sp, 'r', encoding='utf-8') as f: content = f.read()
content = re.sub(r'const\s*\{\s*user.*?\}\s*=\s*\(\(\)\s*=>\s*\{.*?\n', 'const user = { email: "owner@pcc.local", name: "Owner", role: "owner" };\nconst setUser = () => {};\n', content)
with open(sp, 'w', encoding='utf-8') as f: f.write(content)

# Fix API trim
api_path = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\services\api.ts'
with open(api_path, 'r', encoding='utf-8') as f: api = f.read()
api = re.sub(r'.*?trim.*?\n', '\n', api)
with open(api_path, 'w', encoding='utf-8') as f: f.write(api)

