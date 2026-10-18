with open("src/store/useEditorStore.ts", "r") as f:
    code = f.read()

# Let's inspect EditorState interface
interface_target = "export interface EditorState {"
new_interface = """export type StudioView = "home" | "studio";

export interface EditorState {
  // Navigation View (Home Landing Page vs Studio Workspace)
  currentView: StudioView;
  setCurrentView: (view: StudioView) => void;
  enterAsGuest: () => void;"""

code = code.replace(interface_target, new_interface)

# Initial state in create:
old_init = """    // Multi-user initial state
    currentUser: DEFAULT_ACCOUNTS[0],
    isAuthenticated: true,"""

new_init = """    // Navigation & Multi-user initial state (Opens HomePage first, Not logged in by default)
    currentView: "home",
    currentUser: null,
    isAuthenticated: false,"""

code = code.replace(old_init, new_init)

# Actions in create:
old_modal_ctrl = """    // Multi-user & Auth Modal Controls
    setAuthModalOpen: (open, tab) =>"""

new_modal_ctrl = """    // View & Navigation Actions
    setCurrentView: (view) => setStore({ currentView: view }),
    enterAsGuest: () => setStore({ currentView: "studio" }),

    // Multi-user & Auth Modal Controls
    setAuthModalOpen: (open, tab) =>"""

code = code.replace(old_modal_ctrl, new_modal_ctrl)

# Update login to set currentView = "studio"
code = code.replace(
    'authModalOpen: false,\n          userAccountModalOpen: false,',
    'authModalOpen: false,\n          userAccountModalOpen: false,\n          currentView: "studio",'
)

# Update register to set currentView = "studio"
code = code.replace(
    'authModalOpen: false,\n        userAccountModalOpen: false,\n      });\n\n      try {',
    'authModalOpen: false,\n        userAccountModalOpen: false,\n        currentView: "studio",\n      });\n\n      try {'
)

# Update logout to set currentView = "home"
code = code.replace(
    'authModalOpen: true,\n        authModalTab: "login",\n        userAccountModalOpen: true,\n      });',
    'authModalOpen: false,\n        userAccountModalOpen: false,\n        currentView: "home",\n      });'
)

# In loadFromStorage:
old_load = """        let activeId = await get<string>(STORAGE_ACTIVE_USER_ID_KEY);
        let activeUser = accounts.find((a) => a.id === activeId) || accounts[0];"""

new_load = """        let activeId = await get<string>(STORAGE_ACTIVE_USER_ID_KEY);
        let activeUser = activeId ? accounts.find((a) => a.id === activeId) : null;"""

code = code.replace(old_load, new_load)

old_load_set = """        setStore({
          userAccounts: accounts,
          currentUser: activeUser,
          savedProjects: Array.isArray(savedProjects) ? savedProjects : [],
          customTemplates: Array.isArray(customTemplates) ? customTemplates : [],
          mediaAssets: Array.isArray(mediaAssets) ? mediaAssets : [],
        });"""

new_load_set = """        if (activeUser) {
          setStore({
            userAccounts: accounts,
            currentUser: activeUser,
            isAuthenticated: true,
            savedProjects: Array.isArray(savedProjects) ? savedProjects : [],
            customTemplates: Array.isArray(customTemplates) ? customTemplates : [],
            mediaAssets: Array.isArray(mediaAssets) ? mediaAssets : [],
          });
        } else {
          setStore({
            userAccounts: accounts,
            currentUser: null,
            isAuthenticated: false,
            currentView: "home",
          });
        }"""

code = code.replace(old_load_set, new_load_set)

with open("src/store/useEditorStore.ts", "w") as f:
    f.write(code)

print("Updated useEditorStore.ts with view controls!")
