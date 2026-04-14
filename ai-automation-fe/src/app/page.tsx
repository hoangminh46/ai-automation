import { redirect } from "next/navigation";

export default function Home() {
  // Thay vì màn hình welcome mặc định của NextJS, 
  // chúng ta điều hướng thẳng toàn bộ lượng user vào luồng /dashboard.
  // Tại đây, Middleware (cảnh sát giao thông của chúng ta) sẽ tự đánh giá:
  // - Nếu chưa login: Bị hắt về /login.
  // - Nếu đã login: Được thả cho vào màn Dashboard thật.
  redirect("/dashboard");
}
