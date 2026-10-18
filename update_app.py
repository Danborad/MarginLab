with open("src/App.tsx", "r") as f:
    text = f.read()

import_line = 'import { UserAccountModal } from "./components/modals/UserAccountModal";\n'
if "UserAccountModal" not in text:
    text = text.replace('import { ProjectManagerModal } from "./components/modals/ProjectManagerModal";\n', 'import { ProjectManagerModal } from "./components/modals/ProjectManagerModal";\n' + import_line)
    text = text.replace('<ProjectManagerModal />', '<ProjectManagerModal />\n      <UserAccountModal />')
    with open("src/App.tsx", "w") as f:
        f.write(text)
    print("Updated App.tsx with UserAccountModal")
else:
    print("Already in App.tsx")
