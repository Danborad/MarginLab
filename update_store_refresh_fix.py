with open("src/store/useEditorStore.ts", "r") as f:
    text = f.read()

# Update loadFromStorage so that activeUser keeps currentView: "studio"
old_load = """        if (activeUser) {
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
          });"""

new_load = """        if (activeUser) {
          const userDoc = await get<CollageDocument>(getStorageUserDocKey(activeUser.id));
          const savedProjects = (await get<SavedProject[]>(getStorageUserProjectsKey(activeUser.id))) || [];
          const customTemplates = (await get<CustomTemplate[]>(getStorageUserTemplatesKey(activeUser.id))) || [];
          const mediaAssets = (await get<UserMediaAsset[]>(getStorageUserMediaKey(activeUser.id))) || [];

          setStore({
            userAccounts: accounts,
            currentUser: activeUser,
            isAuthenticated: true,
            currentView: "studio", // Stay in studio workspace on browser F5 refresh
            savedProjects: Array.isArray(savedProjects) ? savedProjects : [],
            customTemplates: Array.isArray(customTemplates) ? customTemplates : [],
            mediaAssets: Array.isArray(mediaAssets) ? mediaAssets : [],
          });"""

text = text.replace(old_load, new_load)

# Update updateUserProfile to ensure STORAGE_ACTIVE_USER_ID_KEY is also saved
old_update_prof = """      await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);
      return { success: true, message: "个人资料更新成功" };"""

new_update_prof = """      await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);
      await set(STORAGE_ACTIVE_USER_ID_KEY, currentId);
      return { success: true, message: "个人资料更新成功" };"""

text = text.replace(old_update_prof, new_update_prof)

with open("src/store/useEditorStore.ts", "w") as f:
    f.write(text)

print("Updated useEditorStore.ts (F5 refresh & profile persistence fix)!")
