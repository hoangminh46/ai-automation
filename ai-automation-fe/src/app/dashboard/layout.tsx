"use client";

import { ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Database,
  FlaskConical,
  LogOut,
  MessageSquare,
  PanelLeft,
  Radio,
  Store,
  type LucideIcon,
} from "lucide-react";

import { ExpiryWarningBanner } from "@/components/billing/expiry-warning-banner";
import { QuotaWarningBanner } from "@/components/billing/quota-warning-banner";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { useTenantStore } from "@/store/tenant-store";

type MenuItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const MENU_ITEMS: MenuItem[] = [
  { name: "Cửa hàng của tôi", href: "/dashboard", icon: Store },
  { name: "Binh đoàn Bot AI", href: "/dashboard/agents", icon: Bot },
  { name: "Tri thức (RAG)", href: "/dashboard/knowledge", icon: Database },
  { name: "Playground", href: "/dashboard/playground", icon: FlaskConical },
  { name: "Kênh liên kết", href: "/dashboard/channels", icon: Radio },
  { name: "Live Chat CRM", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Sử dụng", href: "/dashboard/usage", icon: BarChart3 },
  { name: "Gói dịch vụ", href: "/dashboard/billing", icon: CreditCard },
];

const SIDEBAR_STORAGE_KEY = "dashboard-sidebar-collapsed";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("Đang tải...");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  });

  const activeTenant = useTenantStore((state) => state.activeTenant);
  const fetchTenants = useTenantStore((state) => state.fetchTenants);
  const clearStore = useTenantStore((state) => state.clearStore);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || "Seller");
      }
    });
  }, [supabase.auth]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((previous) => {
      const next = !previous;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    clearStore();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans dark:bg-slate-900">
      <aside
        className={`relative flex h-full shrink-0 flex-col border-r border-blue-500/30 bg-[linear-gradient(180deg,#2563eb_0%,#1d4ed8_48%,#1e3a8a_100%)] text-white shadow-[18px_0_40px_rgba(37,99,235,0.18)] transition-all duration-300 ${
          isSidebarCollapsed ? "w-24" : "w-72"
        }`}
      >
        <div
          className={`flex h-20 items-center border-b border-white/12 ${
            isSidebarCollapsed ? "justify-center px-4" : "justify-between px-5"
          }`}
        >
          <div className={`flex min-w-0 items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
              <Image
                src="/draft-image/logo2.png"
                alt="Mine Chatbot"
                width={34}
                height={34}
                className="h-8 w-8 object-contain"
                priority
              />
            </div>

            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-[0.02em] text-white">Mine Chatbot</p>
                <p className="text-xs text-blue-100/80">CRM & Chatbot Automation</p>
              </div>
            )}
          </div>

          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Thu gọn sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {isSidebarCollapsed && (
          <div className="px-3 pt-4">
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-10 w-full items-center justify-center rounded-xl border border-white/12 bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Mở rộng sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        <nav className={`flex-1 overflow-y-auto py-5 ${isSidebarCollapsed ? "px-3" : "px-4"}`}>
          <div className="space-y-2">
            {MENU_ITEMS.map((item) => {
              const isActive =
                item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isSidebarCollapsed ? item.name : undefined}
                  className={`group flex items-center rounded-2xl transition-all duration-200 ${
                    isActive
                      ? "bg-white/15 text-white ring-1 ring-white/20 shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
                      : "text-white/92 hover:bg-white/12"
                  }`}
                >
                  <span
                    className={`flex shrink-0 items-center justify-center ${
                      isSidebarCollapsed ? "h-12 w-full" : "h-12 w-12"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </span>

                  {!isSidebarCollapsed && (
                    <span className="pr-4 text-sm font-medium tracking-[0.01em]">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className={`border-t border-white/12 p-4 ${isSidebarCollapsed ? "space-y-3" : "space-y-2"}`}>
          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? "Đăng xuất" : undefined}
            className={`flex w-full items-center rounded-2xl border border-white/10 bg-white/10 py-3 text-sm font-medium text-white transition hover:bg-white/15 ${
              isSidebarCollapsed ? "justify-center px-3" : "gap-3 px-4"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSidebar}
              className="rounded-lg p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
              aria-label={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <TenantSwitcher />
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="h-6 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />
            <div className="hidden text-right sm:block">
              <p className="max-w-[150px] truncate text-sm font-medium text-slate-900 dark:text-white">{email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Chủ cửa hàng</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white shadow-inner">
              {email.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <QuotaWarningBanner />
        <ExpiryWarningBanner />

        {pathname.startsWith("/dashboard/chat") ? (
          <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900">{children}</div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <div className="mx-auto w-full max-w-7xl p-6 md:p-8">{children}</div>
          </div>
        )}
      </main>
    </div>
  );
}
