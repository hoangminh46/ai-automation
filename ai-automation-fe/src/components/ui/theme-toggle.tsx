"use client";

import { useState, useRef, useCallback, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";

const THEME_OPTIONS = [
  { value: "light", label: "Sáng", icon: Sun },
  { value: "dark", label: "Tối", icon: Moon },
  { value: "system", label: "Hệ thống", icon: Monitor },
] as const;

// React 19 chuẩn: dùng useSyncExternalStore để detect mount, không dùng useEffect + setState
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isMounted = useIsMounted();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Đóng khi focus rời khỏi toàn bộ component
  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsOpen(false);
    }
  }, []);

  // SSR placeholder — tránh hydration mismatch
  if (!isMounted) {
    return <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />;
  }

  const ActiveIcon = resolvedTheme === "dark" ? Moon : Sun;
  const activeLabel = THEME_OPTIONS.find((o) => o.value === theme)?.label ?? "Giao diện";

  return (
    <div className="relative shrink-0" ref={wrapperRef} onBlur={handleBlur}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Chuyển giao diện"
        title={activeLabel}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      >
        <ActiveIcon className="w-4.5 h-4.5" />
      </button>

      {/* Dropdown — mở LÊN TRÊN (bottom-full) để không bị tràn sidebar */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-[60] animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Header label */}
          <div className="px-3 pt-2.5 pb-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Giao diện
            </p>
          </div>

          {/* Options */}
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{opt.label}</span>
                {isActive && <Check className="w-3.5 h-3.5 text-blue-500" />}
              </button>
            );
          })}
          <div className="h-1.5" />
        </div>
      )}
    </div>
  );
}
