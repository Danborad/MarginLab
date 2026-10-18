with open('src/components/modals/AdminManagementModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace any broken header
import re
text = re.sub(r'`编辑风格化模板 · [^`]+`', '{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}', text)

with open('src/components/modals/AdminManagementModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated header")
