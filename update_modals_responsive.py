with open("src/components/modals/AuthModal.tsx", "r") as f:
    content = f.read()

# Make modal width responsive
content = content.replace("w-full max-w-2xl overflow-hidden", "w-[95vw] max-w-2xl overflow-hidden")
content = content.replace("w-full max-w-md mx-auto py-2", "w-full max-w-lg mx-auto py-1")

# Make register inputs stacked on mobile
content = content.replace('<div className="grid grid-cols-2 gap-2.5">', '<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">')

# Make tabs scrollable on mobile
content = content.replace('className="flex items-center border-b border-studio-border bg-studio-card/50 px-4 pt-2 gap-2"', 'className="flex items-center border-b border-studio-border bg-studio-card/50 px-3 sm:px-4 pt-2 gap-1.5 overflow-x-auto no-scrollbar shrink-0"')

with open("src/components/modals/AuthModal.tsx", "w") as f:
    f.write(content)
print("Updated AuthModal.tsx")
