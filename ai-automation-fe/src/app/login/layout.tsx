import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập - Mine Chatbot',
  description: 'Đăng nhập để quản lý chatbot của bạn',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen w-full bg-slate-50">{children}</div>;
}
