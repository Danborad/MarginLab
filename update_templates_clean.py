import re

with open("src/lib/templates.ts") as f:
    content = f.read()

# 1. Remove s21-dreamy-motion-editorial and s21-dreamy-motion-dual
start_templates = content.find("export const TEMPLATES: TemplateDefinition[] = [")
m = re.search(r"\{\s*id:\s*['"]vogue-fullbleed-cover['"]", content)
vogue_start = m.start()

prefix = content[:start_templates] + "export const TEMPLATES: TemplateDefinition[] = [
  "
suffix = content[vogue_start:]
new_content = prefix + suffix

# 2. Replace all remaining dark/colored tbg defaults with #FFFFFF
new_content = re.sub(r"tbg\s*=\s*['"][^'"]+['"]", "tbg = '#FFFFFF'", new_content)

# 3. Replace hardcoded dark backgroundColor with #FFFFFF
new_content = re.sub(r"backgroundColor:\s*['"]#[0-9a-fA-F]{6}['"]", "backgroundColor: '#FFFFFF'", new_content)

# 4. In cinema-ultrawide-title: fix text colors on white
new_content = new_content.replace("color: '#E5C49F',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Bottom Subtitle Quote'", "color: '#1C1B1A',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Bottom Subtitle Quote'")
new_content = new_content.replace("color: '#C5C0B8',", "color: '#555555',")

# 5. In polaroid templates: ensure white background rect and dark text
new_content = new_content.replace("fill: '#FFFDF9',", "fill: '#FFFFFF', stroke: '#E5E2DA', strokeWidth: 1,")

# 6. In advancedTemplateConfigs: replace all bg with #FFFFFF
new_content = re.sub(r"bg:\s*['"][^'"]+['"]", "bg: '#FFFFFF'", new_content)

# 7. In advancedTemplateDocument: fix dark layout text colors
new_content = new_content.replace("text('Title', config.title, margin, Math.round(th * .05), tw * .9, th * .16, 78, '#F5F5F2',", "text('Title', config.title, margin, Math.round(th * .05), tw * .9, th * .16, 78, '#111111',")
new_content = new_content.replace("text('Subtitle', config.subtitle, margin, Math.round(th * .77), tw * .6, th * .1, 16, '#F5F5F2',", "text('Subtitle', config.subtitle, margin, Math.round(th * .77), tw * .6, th * .1, 16, '#333333',")

new_content = new_content.replace("text('Title', config.title, margin, th * .72, tw * .65, th * .1, 42, '#F6F1E9',", "text('Title', config.title, margin, th * .72, tw * .65, th * .1, 42, '#111111',")
new_content = new_content.replace("text('Subtitle', config.subtitle, margin, th * .84, tw * .7, th * .08, 14, '#D0B08A',", "text('Subtitle', config.subtitle, margin, th * .84, tw * .7, th * .08, 14, '#8C6D4A',")

new_content = new_content.replace("text('Title', config.title, margin, margin, tw * .6, th * .12, 48, '#E6E0D3',", "text('Title', config.title, margin, margin, tw * .6, th * .12, 48, '#111111',")
new_content = new_content.replace("text('Subtitle', config.subtitle, tw * .63, margin, tw * .3, th * .1, 13, '#E6E0D3',", "text('Subtitle', config.subtitle, tw * .63, margin, tw * .3, th * .1, 13, '#555555',")
new_content = new_content.replace("line('Bottom Rule', margin, th * .86, tw - margin * 2, 2, '#E6E0D3'),", "line('Bottom Rule', margin, th * .86, tw - margin * 2, 2, '#111111'),")
new_content = new_content.replace("sticker('Index Tag', margin, th * .89, tw * .22, 30, 'archival-tag', 'ARCHIVE / 006', '#E6E0D3')", "sticker('Index Tag', margin, th * .89, tw * .22, 30, 'archival-tag', 'ARCHIVE / 006', '#111111')")

new_content = new_content.replace("text('Title', config.title, margin, margin, tw * .9, th * .17, 78, '#FFFFFF',", "text('Title', config.title, margin, margin, tw * .9, th * .17, 78, '#111111',")
new_content = new_content.replace("text('Subtitle', config.subtitle, margin, th * .74, tw * .8, th * .1, 13, '#6CF2C2',", "text('Subtitle', config.subtitle, margin, th * .74, tw * .8, th * .1, 13, '#047857',")
new_content = new_content.replace("line('Data Rule', margin, th * .7, tw * .75, 3, '#6CF2C2'),", "line('Data Rule', margin, th * .7, tw * .75, 3, '#047857'),")
new_content = new_content.replace("sticker('Data Tag', tw * .76, margin, tw * .16, 32, 'archival-tag', 'LIVE', '#6CF2C2')", "sticker('Data Tag', tw * .76, margin, tw * .16, 32, 'archival-tag', 'LIVE', '#047857')")

new_content = new_content.replace("text('Title', config.title, margin, margin, tw * .6, th * .12, 50, '#F3D36B',", "text('Title', config.title, margin, margin, tw * .6, th * .12, 50, '#1E3A8A',")
new_content = new_content.replace("text('Subtitle', config.subtitle, margin, th * .78, tw * .8, th * .1, 13, '#F3D36B',", "text('Subtitle', config.subtitle, margin, th * .78, tw * .8, th * .1, 13, '#1E3A8A',")
new_content = new_content.replace("line('Axis', tw * .65, margin, 2, th - margin * 2, '#F3D36B'),", "line('Axis', tw * .65, margin, 2, th - margin * 2, '#1E3A8A'),")
new_content = new_content.replace("line('Axis 2', margin, th * .18, tw - margin * 2, 2, '#F3D36B'),", "line('Axis 2', margin, th * .18, tw - margin * 2, 2, '#1E3A8A'),")
new_content = new_content.replace("sticker('Drawing', tw * .72, th * .8, tw * .18, 30, 'grid-cross', 'A—07', '#F3D36B')", "sticker('Drawing', tw * .72, th * .8, tw * .18, 30, 'grid-cross', 'A—07', '#1E3A8A')")

new_content = new_content.replace("config.bg", "'#FFFFFF'")

with open("src/lib/templates.ts", "w") as f:
    f.write(new_content)

print("Saved updated src/lib/templates.ts successfully")