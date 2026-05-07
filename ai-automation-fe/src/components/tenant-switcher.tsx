"use client";

import { useState, useRef, useEffect } from "react";
import { Store, ChevronDown, Check } from "lucide-react";
import { useTenantStore } from "@/store/tenant-store";

export function TenantSwitcher() {
  const tenants = useTenantStore(state => state.tenants);
  const activeTenant = useTenantStore(state => state.activeTenant);
  const setActiveTenant = useTenantStore(state => state.setActiveTenant);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSwitchTenant = (tenant: typeof tenants[0]) => {
    setActiveTenant(tenant);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
      >
        <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[140px] truncate">
          {activeTenant ? activeTenant.name : "Chọn cửa hàng"}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown — chỉ switch */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-56 overflow-y-auto p-2">
            {tenants.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Chưa có cửa hàng nào</p>
            ) : (
              tenants.map((tenant) => {
                const isActive = activeTenant?.id === tenant.id;
                return (
                  <button
                    key={tenant.id}
                    onClick={() => handleSwitchTenant(tenant)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      isActive
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`flex-1 text-sm font-medium truncate ${
                      isActive
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}>
                      {tenant.name}
                    </span>
                    {isActive && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
