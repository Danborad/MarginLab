import re

with open("src/components/modals/AdminManagementModal.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Fix 1: handleCopyUrl
old_copy = """  const handleCopyUrl = (url: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setStyleFeedback({ type: "success", text: {editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"} });
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch (e) {
      setStyleFeedback({ type: "success", text: {editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"} });
    }
  };"""

new_copy = """  const handleCopyUrl = (url: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setStyleFeedback({ type: "success", text: `已复制 GitHub 仓库地址: ${url}` });
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch (e) {
      setStyleFeedback({ type: "success", text: `GitHub 地址: ${url}` });
    }
  };"""
text = text.replace(old_copy, new_copy)

# Fix 2: handleToggleStatus description
old_ban_desc = """        title: "封禁创作者账号",
        description: {editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"},"""
new_ban_desc = """        title: "封禁创作者账号",
        description: `确定要封禁创作者【${user.name}】(@${user.username}) 吗？封禁后该账号将无法登录工作台。`,"""
text = text.replace(old_ban_desc, new_ban_desc)

# Fix 3: handleConfirmResetPassword feedback
old_reset_feedback = """      setFeedback({ type: "success", text: {editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"} });"""
new_reset_feedback = """      setFeedback({ type: "success", text: `创作者【${uName}】的密码已成功重置！` });"""
text = text.replace(old_reset_feedback, new_reset_feedback)

# Fix 4: handleDeleteUser description
old_del_desc = """      title: "危险操作：彻底删除创作者",
      description: {editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"},"""
new_del_desc = """      title: "危险操作：彻底删除创作者",
      description: `确定要彻底删除创作者【${user.name}】(@${user.username}) 吗？该操作不可撤销，且会抹除其所有素材与项目！`,"""
text = text.replace(old_del_desc, new_del_desc)

# Fix 5: handleFetchModels feedback text
old_models_text = """        text: res.message || {editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"},"""
new_models_text = """        text: res.message || `成功拉取 ${res.models.length} 个可用模型`,"""
text = text.replace(old_models_text, new_models_text)

# Fix 6: Tab buttons className
old_tab_users = """            <button
              onClick={() => setOpen(true, "users")}
              className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
            >"""
new_tab_users = """            <button
              onClick={() => setOpen(true, "users")}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "users"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-studio-muted hover:text-studio-text"
              }`}
            >"""
text = text.replace(old_tab_users, new_tab_users)

old_tab_ai = """            <button
              onClick={() => setOpen(true, "ai_config")}
              className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
            >"""
new_tab_ai = """            <button
              onClick={() => setOpen(true, "ai_config")}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "ai_config"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-studio-muted hover:text-studio-text"
              }`}
            >"""
text = text.replace(old_tab_ai, new_tab_ai)

old_tab_styles = """            <button
              onClick={() => setOpen(true, "styles")}
              className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
            >"""
new_tab_styles = """            <button
              onClick={() => setOpen(true, "styles")}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "styles"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-studio-muted hover:text-studio-text"
              }`}
            >"""
text = text.replace(old_tab_styles, new_tab_styles)

# Fix 7: Tab 1 feedback className
old_feedback_users = """            {/* Feedback Alert */}
            {feedback && (
              <div
                className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
              >"""
new_feedback_users = """            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
                  feedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >"""
text = text.replace(old_feedback_users, new_feedback_users)

# Fix 8: handleRefreshUsers button icon
old_refresh_users = """                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRefreshUsers}
                  disabled={isRefreshing}
                  className="px-3 shrink-0 cursor-pointer"
                  title="刷新用户列表"
                >
                  <RefreshCw className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}} />
                </Button>"""
new_refresh_users = """                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRefreshUsers}
                  disabled={isRefreshing}
                  className="px-3 shrink-0 cursor-pointer"
                  title="刷新用户列表"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-studio-accent" : ""}`} />
                </Button>"""
text = text.replace(old_refresh_users, new_refresh_users)

# Fix 9: filterType buttons
old_filter_btns = """                    <button
                      key={tab.id}
                      onClick={() => setFilterType(tab.id as any)}
                      className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                    >"""
new_filter_btns = """                    <button
                      key={tab.id}
                      onClick={() => setFilterType(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        filterType === tab.id
                          ? "bg-studio-accent text-zinc-950 font-semibold"
                          : "text-studio-muted hover:text-studio-text"
                      }`}
                    >"""
text = text.replace(old_filter_btns, new_filter_btns)

# Fix 10: user item container
old_user_card = """                  return (
                    <div
                      key={user.id}
                      className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                    >"""
new_user_card = """                  return (
                    <div
                      key={user.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isBanned
                          ? "bg-red-950/10 border-red-500/20 opacity-80"
                          : "bg-studio-panel border-studio-border/70 hover:border-studio-border"
                      }`}
                    >"""
text = text.replace(old_user_card, new_user_card)

# Fix 11: handleToggleAdminRole button
old_role_btn = """                        {!isRootAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleAdminRole(user)}
                            className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                            title={user.isAdmin ? "撤销管理员权限" : "赋予管理员权限"}
                          >"""
new_role_btn = """                        {!isRootAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleAdminRole(user)}
                            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                              user.isAdmin
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                                : "bg-studio-card/80 border-studio-border/60 text-studio-muted hover:text-studio-text"
                            }`}
                            title={user.isAdmin ? "撤销管理员权限" : "赋予管理员权限"}
                          >"""
text = text.replace(old_role_btn, new_role_btn)

# Fix 12: handleToggleStatus button
old_status_btn = """                        {!isRootAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                            title={isBanned ? "解封账号" : "封禁账号"}
                          >"""
new_status_btn = """                        {!isRootAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isBanned
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                                : "bg-red-500/15 border-red-500/30 text-red-300 hover:bg-red-500/25"
                            }`}
                            title={isBanned ? "解封账号" : "封禁账号"}
                          >"""
text = text.replace(old_status_btn, new_status_btn)

# Fix 13: aiFeedback className
old_ai_feedback = """            {aiFeedback && (
              <div
                className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
              >"""
new_ai_feedback = """            {aiFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                  aiFeedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >"""
text = text.replace(old_ai_feedback, new_ai_feedback)

# Fix 14: handleFetchModels icon
old_fetch_icon = """                <button
                  type="button"
                  id="admin-fetch-models-btn"
                  onClick={handleFetchModels}
                  disabled={isFetchingModels}
                  className="px-2.5 py-1 rounded-lg bg-studio-accent/15 hover:bg-studio-accent/25 border border-studio-accent/40 text-studio-accent text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="从当前配置的 Base URL 与 API Key 接口拉取支持的模型列表"
                >
                  <RefreshCw className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}} />"""
new_fetch_icon = """                <button
                  type="button"
                  id="admin-fetch-models-btn"
                  onClick={handleFetchModels}
                  disabled={isFetchingModels}
                  className="px-2.5 py-1 rounded-lg bg-studio-accent/15 hover:bg-studio-accent/25 border border-studio-accent/40 text-studio-accent text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="从当前配置的 Base URL 与 API Key 接口拉取支持的模型列表"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingModels ? "animate-spin text-studio-accent" : ""}`} />"""
text = text.replace(old_fetch_icon, new_fetch_icon)

# Fix 15: modelSearchFilter placeholder
old_model_search = """                  <input
                    type="text"
                    value={modelSearchFilter}
                    onChange={(e) => setModelSearchFilter(e.target.value)}
                    placeholder={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                    className="w-full pl-8 pr-3 py-1.5 bg-studio-card border border-studio-border/60 focus:border-studio-accent rounded-lg text-[11px] text-studio-text placeholder:text-studio-muted/50 focus:outline-none font-mono"
                  />"""
new_model_search = """                  <input
                    type="text"
                    value={modelSearchFilter}
                    onChange={(e) => setModelSearchFilter(e.target.value)}
                    placeholder="按名称过滤模型 (如 dalle, flux, grok)..."
                    className="w-full pl-8 pr-3 py-1.5 bg-studio-card border border-studio-border/60 focus:border-studio-accent rounded-lg text-[11px] text-studio-text placeholder:text-studio-muted/50 focus:outline-none font-mono"
                  />"""
text = text.replace(old_model_search, new_model_search)

# Fix 16: model item button
old_model_btn = """                        <button
                          key={mId}
                          type="button"
                          onClick={() => setModel(mId)}
                          className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}>
                              {mId}
                            </span>"""
new_model_btn = """                        <button
                          key={mId}
                          type="button"
                          onClick={() => setModel(mId)}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-studio-accent/20 border-studio-accent text-studio-text shadow-sm"
                              : "bg-studio-panel/70 border-studio-border/50 text-studio-muted hover:text-studio-text hover:border-studio-border"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[11px] font-mono font-semibold truncate ${isSelected ? "text-studio-accent" : ""}`}>
                              {mId}
                            </span>"""
text = text.replace(old_model_btn, new_model_btn)

# Fix 17: aspect ratio buttons
old_ratio_btn = """                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSize(r.id)}
                      className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                      title={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                    >
                      {/* Wireframe Rect Icon */}
                      <div className="w-7 h-7 flex items-center justify-center">
                        {r.isAuto ? (
                          <div
                            className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                          >
                            Auto
                          </div>
                        ) : (
                          <div
                            className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                            style={{ width: r.iconW, height: r.iconH }}
                          />
                        )}
                      </div>"""
new_ratio_btn = """                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSize(r.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-studio-accent/20 border-studio-accent text-studio-accent shadow-sm"
                          : "bg-studio-panel/80 border-studio-border/60 text-studio-muted hover:text-studio-text hover:border-studio-border"
                      }`}
                      title={`${r.label} - ${r.desc}`}
                    >
                      {/* Wireframe Rect Icon */}
                      <div className="w-7 h-7 flex items-center justify-center">
                        {r.isAuto ? (
                          <div
                            className={`w-6 h-6 rounded border-2 border-dashed flex items-center justify-center text-[9px] font-mono font-bold ${
                              isSelected ? "border-studio-accent text-studio-accent" : "border-studio-muted/70 text-studio-muted"
                            }`}
                          >
                            Auto
                          </div>
                        ) : (
                          <div
                            className={`rounded-sm border-2 ${
                              isSelected ? "border-studio-accent bg-studio-accent/20" : "border-studio-muted/70 bg-transparent"
                            }`}
                            style={{ width: r.iconW, height: r.iconH }}
                          />
                        )}
                      </div>"""
text = text.replace(old_ratio_btn, new_ratio_btn)

# Fix 18: test AI icon
old_test_ai_icon = """              <Button
                type="button"
                variant="secondary"
                disabled={isTestingAi || !apiKey}
                onClick={handleTestAi}
                className="text-xs py-2.5 px-4 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}} />"""
new_test_ai_icon = """              <Button
                type="button"
                variant="secondary"
                disabled={isTestingAi || !apiKey}
                onClick={handleTestAi}
                className="text-xs py-2.5 px-4 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingAi ? "animate-spin text-studio-accent" : ""}`} />"""
text = text.replace(old_test_ai_icon, new_test_ai_icon)

# Fix 19: styleFeedback className
old_style_feedback = """        {/* Tab 3: STYLE TEMPLATES MANAGEMENT */}
        {activeTab === "styles" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Feedback Alert */}
            {styleFeedback && (
              <div
                className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
              >"""
new_style_feedback = """        {/* Tab 3: STYLE TEMPLATES MANAGEMENT */}
        {activeTab === "styles" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Feedback Alert */}
            {styleFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
                  styleFeedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >"""
text = text.replace(old_style_feedback, new_style_feedback)

# Fix 20: refresh styles icon
old_ref_styles_icon = """                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    setIsRefreshingStyles(true);
                    await fetchAiStyles(true);
                    setIsRefreshingStyles(false);
                  }}
                  disabled={isRefreshingStyles}
                  className="px-3 shrink-0 cursor-pointer"
                  title="刷新模板列表"
                >
                  <RefreshCw className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}} />
                </Button>"""
new_ref_styles_icon = """                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    setIsRefreshingStyles(true);
                    await fetchAiStyles(true);
                    setIsRefreshingStyles(false);
                  }}
                  disabled={isRefreshingStyles}
                  className="px-3 shrink-0 cursor-pointer"
                  title="刷新模板列表"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStyles ? "animate-spin text-studio-accent" : ""}`} />
                </Button>"""
text = text.replace(old_ref_styles_icon, new_ref_styles_icon)

# Fix 21: style status filter buttons
old_style_status_btns = """                  <button
                    onClick={() => setStyleStatusFilter("all")}
                    className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setStyleStatusFilter("enabled")}
                    className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                  >
                    仅开启
                  </button>
                  <button
                    onClick={() => setStyleStatusFilter("disabled")}
                    className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                  >
                    仅停用
                  </button>"""
new_style_status_btns = """                  <button
                    onClick={() => setStyleStatusFilter("all")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      styleStatusFilter === "all"
                        ? "bg-studio-accent text-zinc-950 font-semibold"
                        : "text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setStyleStatusFilter("enabled")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      styleStatusFilter === "enabled"
                        ? "bg-studio-accent text-zinc-950 font-semibold"
                        : "text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    仅开启
                  </button>
                  <button
                    onClick={() => setStyleStatusFilter("disabled")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      styleStatusFilter === "disabled"
                        ? "bg-studio-accent text-zinc-950 font-semibold"
                        : "text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    仅停用
                  </button>"""
text = text.replace(old_style_status_btns, new_style_status_btns)

# Fix 22: style item container
old_style_card = """              {filteredStyles.map((style) => {
                const isEnabled = style.enabled !== false;
                const isCore = style.id === "dreamy_motion_editorial" || style.id === "fantasy_qiqiguaiguai";

                return (
                  <div
                    key={style.id}
                    className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                  >"""
new_style_card = """              {filteredStyles.map((style) => {
                const isEnabled = style.enabled !== false;
                const isCore = style.id === "dreamy_motion_editorial" || style.id === "fantasy_qiqiguaiguai";

                return (
                  <div
                    key={style.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start justify-between gap-4 ${
                      isEnabled
                        ? "bg-studio-card border-studio-border/80 hover:border-studio-border"
                        : "bg-studio-panel/50 border-studio-border/40 opacity-70"
                    }`}
                  >"""
text = text.replace(old_style_card, new_style_card)

# Fix 23: toggle style status button
old_toggle_style_btn = """                      {/* Toggle Enable/Disable Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStyleStatus(style)}
                        className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                        title={isEnabled ? "点击停用此风格" : "点击开启此风格"}
                      >"""
new_toggle_style_btn = """                      {/* Toggle Enable/Disable Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStyleStatus(style)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isEnabled
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                            : "bg-studio-panel border-studio-border text-studio-muted hover:text-studio-text"
                        }`}
                        title={isEnabled ? "点击停用此风格" : "点击开启此风格"}
                      >"""
text = text.replace(old_toggle_style_btn, new_toggle_style_btn)

# Fix 24: style edit form toggleEnabled button
old_edit_toggle_btn = """                    <button
                      type="button"
                      onClick={() => setStyleEnabled(!styleEnabled)}
                      className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                    >"""
new_edit_toggle_btn = """                    <button
                      type="button"
                      onClick={() => setStyleEnabled(!styleEnabled)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        styleEnabled
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                          : "bg-studio-card border-studio-border text-studio-muted hover:text-studio-text"
                      }`}
                    >"""
text = text.replace(old_edit_toggle_btn, new_edit_toggle_btn)

# Fix 25: confirm dialog icon and button
old_confirm_icon = """              <div className="flex items-start gap-3.5">
                <div
                  className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                >
                  <AlertCircle className="w-5 h-5" />
                </div>"""
new_confirm_icon = """              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    confirmDialog.confirmVariant === "danger"
                      ? "bg-red-500/15 border-red-500/30 text-red-500"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <AlertCircle className="w-5 h-5" />
                </div>"""
text = text.replace(old_confirm_icon, new_confirm_icon)

old_confirm_exec_btn = """                <button
                  type="button"
                  onClick={() => {
                    const action = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    action();
                  }}
                  className={{editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}}
                >"""
new_confirm_exec_btn = """                <button
                  type="button"
                  onClick={() => {
                    const action = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    action();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    confirmDialog.confirmVariant === "danger"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950"
                  }`}
                >"""
text = text.replace(old_confirm_exec_btn, new_confirm_exec_btn)

# Check remaining occurrences of {editingStyle ?
remaining = len(re.findall(r'\{editingStyle\s*\?', text))
print("Remaining {editingStyle ? count:", remaining)

with open("src/components/modals/AdminManagementModal.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Repaired AdminManagementModal.tsx successfully!")
