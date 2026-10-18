with open("src/App.tsx", "r") as f:
    text = f.read()

text = text.replace(
    'import { UserAccountModal } from "./components/modals/UserAccountModal";',
    'import { UserAccountModal } from "./components/modals/UserAccountModal";\nimport { ReplacePhotoModal } from "./components/modals/ReplacePhotoModal";'
)

text = text.replace(
    '<UserAccountModal />\n    </div>',
    '<UserAccountModal />\n      <ReplacePhotoModal />\n    </div>'
)

with open("src/App.tsx", "w") as f:
    f.write(text)

print("Updated App.tsx with ReplacePhotoModal!")
