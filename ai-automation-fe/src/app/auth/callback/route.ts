import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  // Lấy các tham số (query param) được bắn từ Email do Supabase thiết lập
  const { searchParams, origin } = new URL(request.url)
  
  // `code` là mã bí mật dùng 1 lần để đổi thành Phiên đăng nhập (Session)
  const code = searchParams.get('code')
  
  // `next` để biết tự động đá User đi đâu sau khi xác thực xong (ví dụ /dashboard)
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    
    // Đổi code trích từ email lấy nguyên một cái Access Token xịn
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Xác thực mượt mà -> Phi thẳng vào màn Dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Nếu code hết hạn (quá 24h) hoặc bị xài rồi -> ném về trang chủ với thông báo
  // (Ở mức độ này em đang điều hướng về trang chủ Login kèm cảnh báo lỗi trên param)
  return NextResponse.redirect(`${origin}/login?error=Dường+như+link+xác+thực+đã+hết+hạn.+Vui+lòng+thử+lại.`)
}
