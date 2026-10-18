with open("src/components/layout/LeftSidebar.tsx", "r") as f:
    c = f.read()

c = c.replace(
    'onClick={() => handleMobileNavClick(item.id)}',
    'id={`mobile-nav-${item.id}`}\n                onClick={() => handleMobileNavClick(item.id)}'
)

with open("src/components/layout/LeftSidebar.tsx", "w") as f:
    f.write(c)

print("Updated LeftSidebar.tsx with mobile nav IDs")
