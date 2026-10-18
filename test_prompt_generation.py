import json

with open("server_data/ai_styles.json", "r", encoding="utf-8") as f:
    styles = json.load(f)

for s in styles:
    if s["id"] == "reality_restaged":
        print("Found reality_restaged!")
        print("Prompt length:", len(s["promptTemplate"]))
