import os
import re

# Fix DesktopLayout
dl = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\layouts\DesktopLayout.tsx'
with open(dl, 'r', encoding='utf-8') as f: content = f.read()
content = content.replace('{ email: "owner@pcc.local", name: "Owner" }', '{ email: "owner@pcc.local", name: "Owner", role: "owner" }')
with open(dl, 'w', encoding='utf-8') as f: f.write(content)

# Fix MobileLayout
ml = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\layouts\MobileLayout.tsx'
with open(ml, 'r', encoding='utf-8') as f: content = f.read()
content = content.replace('{ email: "owner@pcc.local", name: "Owner" }', '{ email: "owner@pcc.local", name: "Owner", role: "owner" }')
with open(ml, 'w', encoding='utf-8') as f: f.write(content)

# Fix SettingsPage
sp = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\features\settings\SettingsPage.tsx'
with open(sp, 'r', encoding='utf-8') as f: content = f.read()
content = content.replace('{ email: "owner@pcc.local", name: "Owner" }', '{ email: "owner@pcc.local", name: "Owner", role: "owner" }')
content = re.sub(r'useAuthStore\(\(state\)\s*=>\s*state\.logout\)', '(() => {})', content)
content = re.sub(r'useAuthStore\.getState\(\)', '{ user: { email: "owner@pcc.local", name: "Owner", role: "owner" } }', content)
# Check for any remaining useAuthStore
content = content.replace('useAuthStore', '({ email: "owner@pcc.local", name: "Owner", role: "owner" })')
with open(sp, 'w', encoding='utf-8') as f: f.write(content)

# Fix API trim
api_path = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\services\api.ts'
with open(api_path, 'r', encoding='utf-8') as f: api = f.read()
api = re.sub(r'token\s*\?\s*\.trim\(\)', '""', api)
api = re.sub(r'token\?\s*\.trim\(\)', '""', api)
api = re.sub(r'token\?\.\s*trim\(\)', '""', api)
# Let's just find 	oken near trim
api = re.sub(r'token\s*\?\s*\.\s*trim\(\)', '""', api)
api = api.replace('?.trim()', '')
with open(api_path, 'w', encoding='utf-8') as f: f.write(api)

