import re

with open('src/components/modals/AdminManagementModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the broken closing tags
text = re.sub(
    r'</div\s*\{\s*/\*\s*CUSTOM IN-APP CONFIRMATION DIALOG.*?>\s*\);\s*};',
    '''        {/* CUSTOM IN-APP CONFIRMATION DIALOG (ATELIER SYSTEM THEMED) */}
        {confirmDialog && (
          <div
            className="fixed inset-0 z-70 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn select-none"
            onClick={() => setConfirmDialog(null)}
          >
            <div
              className="bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleIn ring-1 ring-black/5 dark:ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    confirmDialog.confirmVariant === "danger"
                      ? "bg-red-500/15 border-red-500/30 text-red-500"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {confirmDialog.title}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                    {confirmDialog.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  取消
                </button>
                <button
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
                >
                  {confirmDialog.confirmLabel || "确认执行"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};''',
    text,
    flags=re.DOTALL
)

with open('src/components/modals/AdminManagementModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Fixed syntax in AdminManagementModal.tsx')
