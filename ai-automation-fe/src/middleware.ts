import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Đi qua hàm check session của Supabase
  return await updateSession(request)
}

// Cấu hình áp dụng middleware này cho những đường dẫn nào
export const config = {
  matcher: [
    // Bắt toàn bộ các request, ngoại trừ file tĩnh, asset rác, api (để next pass qua)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
