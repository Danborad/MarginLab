with open("index.html", "r") as f:
    text = f.read()

# Update viewport meta for mobile touch apps
old_meta = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
new_meta = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />\n    <meta name="apple-mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />'

text = text.replace(old_meta, new_meta)

with open("index.html", "w") as f:
    f.write(text)

print("Updated index.html viewport for mobile!")
