# 🚀 Deployment Guide — AI Chatbot

## Architecture
```
[User Browser] → [Vercel - FE] → [Oracle Cloud VM - BE API]
                                        ↕
                                [Supabase - DB]
                                        ↕
                                [Gemini API - AI]
                                        ↕
                                [Facebook - Webhook]
```

**Chi phí: $0/tháng**

---

## PHẦN 1: BACKEND — Oracle Cloud Always Free

### Bước 1: Đăng ký Oracle Cloud

1. Truy cập: https://signup.cloud.oracle.com/
2. Chọn **Home Region** → **Japan East (Tokyo)** hoặc **Singapore** (gần VN nhất)
3. Điền thông tin, verify credit card (Oracle **KHÔNG charge** cho Always Free)
4. Sau khi xong, vào **Oracle Cloud Console**

### Bước 2: Tạo VM Instance (Always Free)

1. Vào **Compute → Instances → Create Instance**
2. Cấu hình:
   - **Name:** `ai-chatbot-server`
   - **Image:** Ubuntu 22.04 (hoặc 24.04)
   - **Shape:** chọn **Ampere** (ARM) → **VM.Standard.A1.Flex**
     - OCPU: **2** (free tối đa 4)
     - RAM: **12 GB** (free tối đa 24GB)
   - **Networking:** Tạo VCN mới (default settings OK)
   - **SSH Key:** Tải file `.key` về máy (QUAN TRỌNG — giữ file này!)
3. Bấm **Create** → đợi VM chuyển sang **RUNNING**
4. Ghi lại **Public IP Address** (ví dụ: `150.136.xxx.xxx`)

### Bước 3: Mở ports trên Oracle Cloud

Oracle Cloud **block tất cả ports** mặc định. Cần mở:

1. Vào **Networking → Virtual Cloud Networks → VCN của bạn**
2. Click **Security Lists → Default Security List**
3. **Add Ingress Rules:**

| Source CIDR | Protocol | Dest Port | Mô tả |
|-------------|----------|-----------|-------|
| `0.0.0.0/0` | TCP | 80 | HTTP |
| `0.0.0.0/0` | TCP | 443 | HTTPS |

4. Bấm **Add Ingress Rules**

### Bước 4: SSH vào server

```bash
# Windows (PowerShell hoặc Git Bash):
ssh -i path/to/your-key.key ubuntu@150.136.xxx.xxx

# Nếu bị lỗi permission:
chmod 400 path/to/your-key.key
```

### Bước 5: Cài Docker + Docker Compose

Chạy từng lệnh trên server:

```bash
# Cập nhật system
sudo apt update && sudo apt upgrade -y

# Cài Docker
curl -fsSL https://get.docker.com | sudo sh

# Thêm user vào docker group (không cần sudo mỗi lần)
sudo usermod -aG docker $USER

# Logout rồi SSH lại để group có hiệu lực
exit
```

SSH lại, verify:
```bash
docker --version
docker compose version
```

### Bước 6: Mở firewall trên Ubuntu

Oracle Cloud có 2 lớp firewall: Security List (đã mở ở Bước 3) + iptables trên VM.

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### Bước 7: Clone project + Setup

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/ai-automation.git
cd ai-automation/ai-automation-be

# Tạo file env production (copy từ template, điền giá trị thật)
cp .env.example .env.production
nano .env.production
```

**Điền đúng giá trị vào `.env.production`:**
```env
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://postgres.vmoewpsjqoeybbyrwyun:xxx@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
SUPABASE_URL=https://vmoewpsjqoeybbyrwyun.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=your-real-service-role-key
OPENAI_API_KEY=AIzaSy...
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
GEMINI_MODEL=gemini-2.5-flash
FB_APP_SECRET=your-fb-app-secret
FB_VERIFY_TOKEN=chatbot-verify-2026
FB_PAGE_ACCESS_TOKEN=EAAS...
CORS_ORIGINS=https://your-app.vercel.app
```

### Bước 8: Setup SSL (trước khi chạy docker compose)

**Lần đầu** cần lấy SSL cert bằng certbot standalone (chưa có nginx):

```bash
# Thay YOUR_DOMAIN bằng domain thật (ví dụ: api.yourapp.com)
sudo docker run --rm -p 80:80 \
  -v ./nginx/certbot/conf:/etc/letsencrypt \
  -v ./nginx/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --standalone \
  -d YOUR_DOMAIN \
  --email your@email.com \
  --agree-tos \
  --no-eff-email
```

**Nếu chưa có domain**, dùng IP trực tiếp (bỏ SSL tạm):
- Sửa `nginx/nginx.conf`: xóa block HTTPS, giữ block HTTP, bỏ redirect
- Sửa `docker-compose.yml`: bỏ service certbot, bỏ port 443

### Bước 9: Cập nhật nginx config với domain thật

```bash
# Thay YOUR_DOMAIN trong nginx config
sed -i 's/YOUR_DOMAIN/api.yourapp.com/g' nginx/nginx.conf
```

### Bước 10: Deploy!

```bash
# Build + chạy tất cả
docker compose up -d --build

# Kiểm tra logs
docker compose logs -f api

# Kiểm tra health
curl http://localhost:3001/api/v1/tenants
```

### Bước 11: Verify

```bash
# Từ máy local:
curl https://api.yourapp.com/api/v1/tenants
# Phải trả về: {"success":false,"error":{"statusCode":401,...}}
# → 401 = server hoạt động, chỉ thiếu auth token
```

### Cập nhật code sau này:

```bash
cd ~/ai-automation/ai-automation-be
git pull
docker compose up -d --build
```

---

## PHẦN 2: FRONTEND — Vercel

### Bước 1: Push FE lên GitHub

Nếu chưa có repo riêng cho FE:
```bash
cd ai-automation-fe
# Đảm bảo code đã push lên GitHub
git add -A && git commit -m "deploy: prepare for Vercel" && git push
```

### Bước 2: Connect Vercel

1. Truy cập: https://vercel.com/
2. **Sign up** bằng GitHub
3. **Import Project** → chọn repo `ai-automation` (hoặc `ai-automation-fe`)
4. Cấu hình:
   - **Framework Preset:** Next.js (tự detect)
   - **Root Directory:** `ai-automation-fe` (nếu mono-repo)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (default)

### Bước 3: Set Environment Variables

Trong Vercel Dashboard → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vmoewpsjqoeybbyrwyun.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (anon key) |
| `NEXT_PUBLIC_API_URL` | `https://api.yourapp.com` (BE domain) |

### Bước 4: Deploy

- Bấm **Deploy** → Vercel build + deploy tự động
- Sau khi xong, Vercel cho domain: `your-app.vercel.app`

### Bước 5: Cập nhật CORS trên BE

SSH vào Oracle VM, sửa `.env.production`:
```bash
nano .env.production
# Đổi CORS_ORIGINS thành domain Vercel thật:
# CORS_ORIGINS=https://your-app.vercel.app
```

Restart:
```bash
docker compose restart api
```

---

## PHẦN 3: CẬP NHẬT FACEBOOK WEBHOOK

1. Vào **Meta Developers** → App của anh
2. **Messenger → Webhooks Settings**
3. Đổi **Callback URL** thành: `https://api.yourapp.com/webhook/facebook`
4. **Verify Token** giữ nguyên: `chatbot-verify-2026`
5. Bấm **Verify and Save**

---

## PHẦN 4: DOMAIN (Tùy chọn)

### Option A: Dùng domain Vercel miễn phí
- FE: `your-app.vercel.app`
- BE: dùng IP trực tiếp `http://150.136.xxx.xxx:3001` (không có SSL)

### Option B: Mua domain (~$12/năm)
- FE: `app.yourapp.com` → trỏ CNAME → Vercel
- BE: `api.yourapp.com` → trỏ A record → Oracle VM IP
- SSL: tự động qua Let's Encrypt (đã setup trong docker-compose)

### Option C: Dùng domain miễn phí
- **Freenom** (đã ngừng) → **duckdns.org** (DDNS miễn phí, nhưng không đẹp)
- Subdomain: `yourapp.duckdns.org`

---

## CHECKLIST TRƯỚC KHI GO LIVE

```
□ Oracle VM đã tạo và SSH được
□ Docker + Docker Compose đã cài
□ .env.production đã điền đúng
□ docker compose up -d --build thành công
□ curl API endpoint trả về 401 (auth OK)
□ Vercel FE đã deploy
□ CORS_ORIGINS trỏ đúng domain FE
□ Facebook webhook URL đã đổi
□ Facebook webhook verify thành công
□ Test: gửi tin nhắn FB → bot trả lời
□ Test: mở CRM FE → thấy conversation real-time
```

---

## TROUBLESHOOTING

### Docker build lỗi trên ARM
```bash
# Thêm --platform linux/arm64 nếu cần
docker compose build --no-cache
```

### Không SSH được
- Kiểm tra Security List đã mở port 22
- Kiểm tra file key permission: `chmod 400 your-key.key`

### API timeout
- Kiểm tra iptables: `sudo iptables -L -n`
- Kiểm tra docker logs: `docker compose logs api`

### WebSocket không connect
- Kiểm tra nginx proxy_read_timeout (phải > 60s)
- Kiểm tra CORS_ORIGINS trong .env.production
