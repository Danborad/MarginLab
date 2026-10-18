with open("src/lib/ai-styles.ts", "r", encoding="utf-8") as f:
    c = f.read()

bad_start = '    promptTemplate:\n      "A cinematic tableau photograph in the strict visual language of \\"Reality Restaged\\"'
good_start = '    promptTemplate:\n      `A cinematic tableau photograph in the strict visual language of "Reality Restaged"'
assert bad_start in c, "bad_start not found"
c = c.replace(bad_start, good_start, 1)

bad_end = '{moodNotes} {textInstruction}",'
good_end = '{moodNotes} {textInstruction}`, '
assert bad_end in c, "bad_end not found"
c = c.replace(bad_end, good_end, 1)

# Also fix any escaped quotes inside backticks if needed
sub_block_old = '`A cinematic tableau photograph in the strict visual language of "Reality Restaged"'
sub_block_new = '`A cinematic tableau photograph in the strict visual language of "Reality Restaged"'

with open("src/lib/ai-styles.ts", "w", encoding="utf-8") as f:
    f.write(c)

print("Fixed promptTemplate backticks!")
