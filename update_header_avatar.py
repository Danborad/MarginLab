with open("src/components/layout/Header.tsx", "r") as f:
    text = f.read()

text = text.replace(
    'import { Button } from "../ui/Button";',
    'import { Button } from "../ui/Button";\nimport { AvatarView } from "../ui/AvatarView";'
)

text = text.replace(
    '<span className="text-sm">{currentUser.avatar}</span>',
    '<AvatarView avatar={currentUser.avatar} size="sm" />'
)

with open("src/components/layout/Header.tsx", "w") as f:
    f.write(text)

print("Updated Header.tsx with AvatarView!")
