# 🚀 Deployment Guide — AI Chatbot

## Architecture
```
[User Browser] → [Vercel - FE] → [Render - BE API]
                                       ↕
                               [Supabase - DB]
                                       ↕
                               [Gemini API - AI]
                                       ↕
                               [Facebook - Webhook]
```

**Chi phí: $0/tháng** (Render Free + Vercel Free + Supabase Free + Gemini Free)

> ⚠️ **Lưu ý Render Free:** Server ngủ sau 15 phút không có request.
> Cold start ~30s. FB webhook tin nhắn đầu tiên sau khi ngủ có thể chậm.
> Phù hợp cho thử nghiệm. Khi cần 24/7, upgrade Render Starter ($7/tháng).

---

## PHẦN 1: BACKEND — Render

### Bước 1: Đăng ký Render

1. Truy cập: https://render.com/
2. **Sign up** bằng **GitHub** (để dễ connect repo)
3. Không cần credit card

### Bước 2: Push code lên GitHub

Đảm bảo repo `ai-automation` đã push lên GitHub:
```bash
cd ai-automation
git push origin main
```

### Bước 3: Tạo Web Service

1. Vào Render Dashboard → **New** → **Web Service**
2. **Connect Repository** → chọn repo `ai-automation` (hoặc `ai-automation-be` nếu tách repo)
3. Cấu hình:

| Setting | Value |
|---------|-------|
| **Name** | `ai-chatbot-api` |
| **Region** | `Singapore` (gần VN nhất) |
| **Root Directory** | `ai-automation-be` |
| **Runtime** | `Docker` |
| **Instance Type** | `Free` |

4. Bấm **Create Web Service** (chưa cần set env vars, sẽ làm ở bước sau)

### Bước 4: Set Environment Variables

Vào service → **Environment** → thêm từng biến:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | `postgresql://postgres.vmoew...:xxx@aws-1-...pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `SUPABASE_URL` | `https://vmoewpsjqoeybbyrwyun.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGci...` (copy từ .env) |
| `SUPABASE_SERVICE_ROLE_KEY` | (lấy từ Supabase Dashboard → Settings → API) |
| `OPENAI_API_KEY` | `AIzaSy...` (Gemini API key) |
| `GEMINI_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai/` |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `FB_APP_SECRET` | (copy từ .env) |
| `FB_VERIFY_TOKEN` | `chatbot-verify-2026` |
| `FB_PAGE_ACCESS_TOKEN` | `EAAS...` (copy từ .env) |
| `CORS_ORIGINS` | `https://ai-automation-fe.vercel.app` (cập nhật sau khi deploy FE) |

5. Bấm **Save Changes** → Render tự redeploy

### Bước 5: Verify Backend

Sau khi deploy xong (3-5 phút), Render cho URL:
```
https://ai-chatbot-api-3w53.onrender.com  ← ĐÃ DEPLOY THÀNH CÔNG ✅
```

Test:
```bash
curl https://ai-chatbot-api-3w53.onrender.com/api/v1/tenants
# Phải trả về: {"success":false,"error":{"statusCode":401,...}}
# → 401 = server OK, chỉ thiếu auth
```

### Bước 6 (Tùy chọn): Keep-alive để giảm cold start

Render Free ngủ sau 15 phút. Dùng UptimeRobot (miễn phí) để ping:

1. Truy cập: https://uptimerobot.com/ (đăng ký free)
2. **Add New Monitor:**
   - Type: `HTTP(s)`
   - URL: `https://ai-chatbot-api-3w53.onrender.com/api/v1/tenants`
   - Interval: `5 minutes`
3. Server sẽ **luôn thức** (Render cho phép điều này ở free tier)

> 💡 Với UptimeRobot ping mỗi 5 phút, server gần như không bao giờ ngủ.

---

## PHẦN 2: FRONTEND — Vercel

### Bước 1: Connect Vercel

1. Truy cập: https://vercel.com/
2. **Sign up** bằng **GitHub**
3. **Add New Project** → **Import** repo `ai-automation`
4. Cấu hình:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js (tự detect) |
| **Root Directory** | `ai-automation-fe` |
| **Build Command** | `npm run build` |
| **Output Directory** | (để default) |

### Bước 2: Set Environment Variables

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vmoewpsjqoeybbyrwyun.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (anon key) |
| `NEXT_PUBLIC_API_URL` | `https://ai-chatbot-api-3w53.onrender.com` |

### Bước 3: Deploy

- Bấm **Deploy** → Vercel build tự động
- Sau khi xong → Vercel cho domain dạng: `ai-automation-fe-xxx.vercel.app`

### Bước 4: Cập nhật CORS trên BE

Quay lại Render Dashboard → Environment:
```
CORS_ORIGINS=https://ai-automation-fe.vercel.app
```
Bấm **Save Changes** → auto redeploy

---

## PHẦN 3: CẬP NHẬT FACEBOOK WEBHOOK

1. Vào **Meta Developers** → App
2. **Messenger → Settings → Webhooks**
3. **Edit Callback URL:**
   - URL: `https://ai-chatbot-api-3w53.onrender.com/webhook/facebook`
   - Verify Token: `chatbot-verify-2026`
4. Bấm **Verify and Save**

> ⚠️ Nếu verify fail do cold start, thử lại sau 30 giây (server cần thời gian thức dậy).

---

## PHẦN 4: DOMAIN TÙY CHỈNH (Tùy chọn)

### Không mua domain (miễn phí) — đang dùng:
- FE: `ai-automation-fe.vercel.app` (cập nhật sau khi deploy Vercel)
- BE: `ai-chatbot-api-3w53.onrender.com` ✅

### Mua domain (~$12/năm):
- FE: `app.yourapp.com` → Vercel Custom Domain
- BE: `api.yourapp.com` → Render Custom Domain
- SSL: tự động cả 2 platform

---

## CHECKLIST TRƯỚC KHI GO LIVE

```
□ GitHub repo đã push code mới nhất
□ Render Web Service đã tạo + env vars đã set
□ curl BE URL trả về 401 (OK)
□ Vercel FE đã deploy + env vars đã set
□ FE mở được trang login
□ CORS_ORIGINS trỏ đúng domain FE Vercel
□ Facebook webhook URL đã đổi sang Render
□ Facebook webhook verify thành công
□ Test: đăng nhập → thấy dashboard
□ Test: gửi tin nhắn FB → bot trả lời
□ Test: mở CRM → thấy conversation real-time
□ (Tùy chọn) UptimeRobot đã setup keep-alive
```

---

## CẬP NHẬT CODE SAU NÀY

Chỉ cần push lên GitHub:
```bash
git add -A && git commit -m "feat: ..." && git push
```
- Render: tự động redeploy BE
- Vercel: tự động redeploy FE

Không cần SSH, Docker, hay bất kỳ thao tác thủ công nào.

---

## TROUBLESHOOTING

### Render deploy lỗi
- Kiểm tra **Logs** tab trên Render Dashboard
- Thường do thiếu env vars hoặc Dockerfile lỗi

### FE không gọi được API
- Kiểm tra `NEXT_PUBLIC_API_URL` đúng chưa (phải có `https://`)
- Kiểm tra `CORS_ORIGINS` trên BE match domain FE

### Facebook webhook verify fail
- Server đang ngủ → đợi 30s rồi thử lại
- Kiểm tra `FB_VERIFY_TOKEN` đúng chưa

### WebSocket disconnect
- Render Free: WS connection mất khi server ngủ
- FE đã có auto-reconnect → tự connect lại khi server thức
- UptimeRobot giúp server không ngủ
