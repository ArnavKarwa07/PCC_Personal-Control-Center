import os
import re

# SettingsPage fix
sp = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\features\settings\SettingsPage.tsx'
with open(sp, 'r', encoding='utf-8') as f: content = f.read()
content = content.replace('({ email: "owner@pcc.local", name: "Owner", role: "owner" })', '(() => ({ email: "owner@pcc.local", name: "Owner", role: "owner" }))')
with open(sp, 'w', encoding='utf-8') as f: f.write(content)

# API interceptor fix
api = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend\src\services\api.ts'
with open(api, 'r', encoding='utf-8') as f: content = f.read()

interceptor_regex = r'apiClient\.interceptors\.request\.use\(\(config\)\s*=>\s*\{.*?\n\s*return\s*config;\s*\}\);'
new_interceptor = '''apiClient.interceptors.request.use((config) => {
  return config;
});'''
content = re.sub(interceptor_regex, new_interceptor, content, flags=re.DOTALL)

with open(api, 'w', encoding='utf-8') as f: f.write(content)

