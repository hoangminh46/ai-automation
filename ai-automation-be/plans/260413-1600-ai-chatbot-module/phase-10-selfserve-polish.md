# Phase 10: Self-serve API & Polish
Status: 🟡 In Progress (4/7 done) | Dependencies: Phase 03, 06, 08, 09

## Objective
Gắn kết tất cả thành 1 luồng self-serve hoàn chỉnh: onboarding 1-click, Swagger docs, standard response format, rate limiting, CORS.

## Implementation Steps
1. [x] Setup API prefix: global prefix `/api/v1` ✅
   - `setGlobalPrefix('api/v1')` in main.ts
   - Exclude: webhook/facebook (GET+POST), root health check
   - FE axios baseURL updated to `/api/v1`
2. [x] Implement standard response interceptor: ✅
   ```typescript
   { success: true, data: {...} }
   ```
   - `ResponseInterceptor` in `common/interceptors/response.interceptor.ts`
   - Global registered in main.ts
   - FE axios auto-unwrap interceptor (response.data.data → response.data)
3. [x] Implement standard error filter: ✅
   ```typescript
   { success: false, error: { statusCode, message, details, timestamp, path } }
   ```
   - `GlobalExceptionFilter` in `common/filters/global-exception.filter.ts`
   - Handles HttpException + unknown exceptions
   - 5xx → logger.error with stack trace, 4xx → logger.warn
4. [ ] Implement onboarding endpoint: `POST /api/v1/onboard` (SKIPPED — flow đã có via Supabase Auth + Create Tenant API)
5. [x] Setup Swagger (`@nestjs/swagger`): ✅
   - DocumentBuilder with title, description, version, bearerAuth
   - UI tại `/api/docs` (dev only)
   - CLI plugin in nest-cli.json (auto-detect DTO types)
6. [x] Rate limiting — ĐÃ CÓ TỪ TRƯỚC ✅
   - ThrottlerModule with short (10/min) + long (100/hour) profiles
   - Per-route guard on test-chat endpoint
7. [x] CORS — ĐÃ CÓ TỪ TRƯỚC ✅
   - main.ts enableCors + ChatGateway CORS env-based restriction

## Acceptance Criteria
- [x] API prefix `/api/v1` active — all routes prefixed except webhook
- [x] Swagger UI hiển thị tất cả endpoints (dev mode)
- [x] Response format thống nhất trên mọi API
- [x] Rate limit hoạt động (ThrottlerModule)
- [x] CORS cho phép frontend
- [ ] `POST /api/v1/onboard` → SKIPPED (flow đã có)

## Definition of Done
- [x] Standard response/error format
- [x] Swagger docs accessible at /api/docs
- [x] Rate limiting + CORS configured
- [ ] Onboarding flow — SKIPPED

---
Next: Phase 11 - Testing & Hardening
