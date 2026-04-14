# Phase 10: Self-serve API & Polish
Status: ⬜ Pending | Dependencies: Phase 03, 06, 08, 09

## Objective
Gắn kết tất cả thành 1 luồng self-serve hoàn chỉnh: onboarding 1-click, Swagger docs, standard response format, rate limiting, CORS.

## Implementation Steps
1. [ ] Setup API versioning: global prefix `/api/v1`
2. [ ] Implement standard response interceptor:
   ```typescript
   { success: true, data: {...}, meta: { total, page, limit } }
   ```
3. [ ] Implement standard error filter:
   ```typescript
   { success: false, error: { statusCode, message, details } }
   ```
4. [ ] Implement onboarding endpoint: `POST /api/v1/onboard`
   - Body: `{ email, password, shopName }`
   - Create user → tenant → default agent trong 1 call
   - Return: `{ tenant, agent, nextSteps }`
5. [ ] Setup Swagger (`@nestjs/swagger`):
   - Decorate tất cả DTOs + controllers
   - UI tại `/api/docs`
6. [ ] Setup rate limiting (`@nestjs/throttler`): 100 req/min per IP
7. [ ] Configure CORS cho frontend (localhost:3000 + production domain)

## Acceptance Criteria
- [ ] `POST /api/v1/onboard` → tạo account + tenant + agent 1 call
- [ ] Swagger UI hiển thị tất cả endpoints
- [ ] Response format thống nhất trên mọi API
- [ ] Rate limit chặn khi exceed
- [ ] CORS cho phép frontend

## Definition of Done
- [ ] Onboarding flow hoạt động
- [ ] Swagger docs complete
- [ ] Standard response/error format
- [ ] Rate limiting + CORS configured

---
Next: Phase 11 - Testing & Hardening
