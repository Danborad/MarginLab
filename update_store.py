import re

# Read current file
with open("src/store/useEditorStore.ts", "r") as f:
    text = f.read()

# Check where DEFAULT_ACCOUNTS starts and where useEditorStore begins
lines = text.splitlines()

# Let's inspect lines around DEFAULT_ACCOUNTS
for i, l in enumerate(lines[:120]):
    if "DEFAULT_ACCOUNTS" in l or "EditorState" in l or "useEditorStore = create" in l:
        print(f"Line {i+1}: {l}")
