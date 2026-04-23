"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Bot, 
  Store, 
  MessageSquare, 
  Database, 
  LogOut, 
  PanelLeft,
  ChevronDown,
  FlaskConical,
  Radio
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTenantStore } from "@/store/tenant-store";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Menu cho Sidebar
const MENU_ITEMS = [
  { name: "Cửa hàng của tôi", href: "/dashboard", icon: <Store className="w-5 h-5" /> },
  { name: "Binh đoàn Bot AI", href: "/dashboard/agents", icon: <Bot className="w-5 h-5" /> },
  { name: "Tri thức (RAG)", href: "/dashboard/knowledge", icon: <Database className="w-5 h-5" /> },
  { name: "Playground", href: "/dashboard/playground", icon: <FlaskConical className="w-5 h-5" /> },
  { name: "Kênh liên kết", href: "/dashboard/channels", icon: <Radio className="w-5 h-5" /> },
  { name: "Live Chat CRM", href: "/dashboard/chat", icon: <MessageSquare className="w-5 h-5" /> },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("Đang tải...");
  
  // Dùng selector chuẩn của Zustand để ép React cập nhật UI trên Layout (Đừng destructuring trực tiếp)
  const activeTenant = useTenantStore(state => state.activeTenant);
  const fetchTenants = useTenantStore(state => state.fetchTenants);
  const clearStore = useTenantStore(state => state.clearStore);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email || "Seller");
    });
  }, [supabase.auth]);

  const handleLogout = async () => {
    // 1. Dọn dẹp cache màn hình (Zustand Cache)
    clearStore();
    // 2. Ép xoá sạch token khỏi server và cookie browser
    await supabase.auth.signOut();
    // 3. Router Refresh để huỷ data thừa
    router.refresh();
    router.push("/login"); // Middleware sẽ chặn và kick hẳn về login
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      
      {/* 1. SIDEBAR TRÁI */}
      <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all">
        {/* Logo App */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-blue-600 rounded-lg mr-3">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">AI M-Suite</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto w-full py-4 px-3 space-y-1">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm ${
                  isActive 
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Theme + Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-50 dark:bg-slate-900/60">
            {/* Logout — chiếm phần lớn diện tích */}
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-all font-medium text-sm"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Đăng xuất</span>
            </button>

            {/* Divider dọc */}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />

            {/* Theme toggle icon — compact */}
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* 2. KHU VỰC NỘI DUNG CHÍNH */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-10 w-full shrink-0">
          <div className="flex items-center gap-2">
            <button className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg lg:hidden">
              <PanelLeft className="w-5 h-5" />
            </button>
            {/* Vùng này chuẩn bị cho Component chọn Cửa hàng (Tenant Selector) */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {activeTenant ? activeTenant.name : "Tạo mới cửa hàng"}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Chủ cửa hàng</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
              {email.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Area (Các trang con sẽ đổ vào đây) */}
        {pathname.startsWith("/dashboard/chat") ? (
          <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900">
            {children}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
