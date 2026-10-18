with open("src/lib/ai-styles.ts", "r", encoding="utf-8") as f:
    c = f.read()

target = '{moodNotes} {textInstruction}",\n    negativePrompt:\n      "floating in the clouds'
replacement = '{moodNotes} {textInstruction}`,\n    negativePrompt:\n      "floating in the clouds'
assert target in c, "target not found"
c = c.replace(target, replacement, 1)

with open("src/lib/ai-styles.ts", "w", encoding="utf-8") as f:
    f.write(c)

print("Replaced with backtick successfully!")
