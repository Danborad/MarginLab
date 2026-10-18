with open("src/lib/ai-styles.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Line 74 (index 73) was dreamy_motion_editorial promptTemplate
print("Line 74:", lines[73])
if lines[73].endswith("`, \n"):
    lines[73] = lines[73][:-4] + '",\n'
    print("Fixed line 74 to end with quote!")

with open("src/lib/ai-styles.ts", "w", encoding="utf-8") as f:
    f.writelines(lines)

# Now check reality_restaged promptTemplate lines
with open("src/lib/ai-styles.ts", "r", encoding="utf-8") as f:
    content = f.read()

rr_id = 'id: "reality_restaged",'
idx = content.find(rr_id)
assert idx != -1

# Print the next 500 characters
print("Around reality_restaged:")
print(content[idx:idx+600])
