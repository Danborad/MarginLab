with open("src/components/panels/MediaPanel.tsx", "r") as f:
    text = f.read()

text = text.replace(
    'import { UserMediaAsset } from "../../types/document";',
    'import { UserMediaAsset } from "../../types/document";\nimport { AvatarView } from "../ui/AvatarView";'
)

text = text.replace(
    '<span>{currentUser.avatar}</span>',
    '<AvatarView avatar={currentUser.avatar} size="xs" />'
)

with open("src/components/panels/MediaPanel.tsx", "w") as f:
    f.write(text)

print("Updated MediaPanel.tsx with AvatarView!")
