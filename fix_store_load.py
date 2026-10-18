with open("src/store/useEditorStore.ts", "r") as f:
    text = f.read()

idx = text.find("loadFromStorage: async () => {")
idx_end = text.find("return false;\n    },\n  };\n});")

new_load_func = """loadFromStorage: async () => {
      try {
        let accounts = await get<UserAccount[]>(STORAGE_ACCOUNTS_KEY);
        if (!Array.isArray(accounts) || accounts.length === 0) {
          accounts = DEFAULT_ACCOUNTS;
          await set(STORAGE_ACCOUNTS_KEY, accounts);
        }

        let activeId = await get<string>(STORAGE_ACTIVE_USER_ID_KEY);
        let activeUser = activeId ? accounts.find((a) => a.id === activeId) : null;

        if (activeUser) {
          const userDoc = await get<CollageDocument>(getStorageUserDocKey(activeUser.id));
          const savedProjects = (await get<SavedProject[]>(getStorageUserProjectsKey(activeUser.id))) || [];
          const customTemplates = (await get<CustomTemplate[]>(getStorageUserTemplatesKey(activeUser.id))) || [];
          const mediaAssets = (await get<UserMediaAsset[]>(getStorageUserMediaKey(activeUser.id))) || [];

          setStore({
            userAccounts: accounts,
            currentUser: activeUser,
            isAuthenticated: true,
            savedProjects: Array.isArray(savedProjects) ? savedProjects : [],
            customTemplates: Array.isArray(customTemplates) ? customTemplates : [],
            mediaAssets: Array.isArray(mediaAssets) ? mediaAssets : [],
          });

          if (userDoc && userDoc.canvas && Array.isArray(userDoc.elements)) {
            setStore({ document: userDoc, past: [], future: [] });
          } else {
            setStore({ document: TEMPLATES[0].createDocument(), past: [], future: [] });
          }
        } else {
          setStore({
            userAccounts: accounts,
            currentUser: null,
            isAuthenticated: false,
            currentView: "home",
          });
        }
        return true;
      } catch (err) {
        console.warn("Failed to load from IndexedDB:", err);
      }
      return false;
    },"""

if idx != -1 and idx_end != -1:
    text = text[:idx] + new_load_func + "\n  };\n});"
    with open("src/store/useEditorStore.ts", "w") as f:
        f.write(text)
    print("Fixed loadFromStorage successfully!")
else:
    print("Could not locate indices", idx, idx_end)
