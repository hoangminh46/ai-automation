"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Mail, Lock, Loader2, ArrowRight, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        // LUỒNG ĐĂNG KÝ
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
          // Trường hợp Supabase bắt cấu hình xác thực Email
          setSuccessMsg("Đăng ký thành công! Vui lòng kiểm tra hòm thư Email để xác thực (Hoặc anh có thể tắt tính năng Confirm Email trong phần Auth Providers của cài đặt Supabase để không cần check mail).");
        } else {
          // Đăng ký và login luôn
          router.refresh();
          router.push("/dashboard");
        }
      } else {
        // LUỒNG ĐĂNG NHẬP
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw new Error("Email hoặc Mật khẩu không chính xác.");
        }

        router.refresh();
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã có lỗi xảy ra");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Nửa trái: Cover Image & Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 border-r border-slate-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

        <div className="z-10 flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl w-fit">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <span className="text-xl font-bold text-white mt-4 block">
            AI M-Suite
          </span>
        </div>

        <div className="z-10 mb-10">
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">
            Hệ thống AI Chatbot tự động trực page, học kiến thức nghiệp vụ và chốt sale mạnh mẽ 24/7.
          </p>
        </div>
      </div>

      {/* Nửa phải: Form Đăng Nhập / Đăng Ký */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile Header Branding */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold dark:text-white">AI M-Suite</span>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-all">
              {isSignUp ? "Tạo Tài Khoản" : "Đăng Nhập"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {isSignUp ? "Khởi tạo quyền quản trị AI Chatbot của bạn" : "Nhập email và mật khẩu để vào trang quản trị"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg text-center animate-in fade-in duration-200">
                {error}
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-lg text-center animate-in fade-in duration-200 border border-green-200 dark:border-green-800">
                {successMsg}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  placeholder="admin@shop.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mật khẩu
                </label>
                {!isSignUp && (
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                    Quên mật khẩu?
                  </a>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSignUp ? (
                <>
                  Đăng Ký Khởi Tạo
                  <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </>
              ) : (
                <>
                  Duyệt vào Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            {isSignUp ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              {isSignUp ? "Đăng nhập ngay" : "Tạo tài khoản mới"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
