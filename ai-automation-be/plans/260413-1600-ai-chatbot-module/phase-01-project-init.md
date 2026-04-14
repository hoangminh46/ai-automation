# Phase 01: Project Init & Config
Status: ✅ Complete | Dependencies: None

## Objective
Khởi tạo NestJS project, cài dependencies, setup folder structure, config .env, Docker Compose.

## Implementation Steps
1. [x] Init NestJS project trong `ai-automation-be/`:
   ```bash
   npx @nestjs/cli new . --package-manager npm --skip-git --strict
   ```
2. [x] Tạo folder structure theo module architecture:
   ```
   src/common/ src/auth/ src/tenant/ src/agent/ 
   src/knowledge/ src/conversation/ src/channel/ src/llm/ src/config/
   ```
3. [x] Install core dependencies:
   ```bash
   npm i @nestjs/config @prisma/client class-validator class-transformer helmet joi
   npm i -D prisma
   ```
4. [x] Setup Config module: `.env` loading + validation (DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY)
5. [x] Tạo `.env.example`, `docker-compose.yml` (PostgreSQL local dev), `Dockerfile`, `.gitignore`

## Acceptance Criteria
- [x] `npm run start:dev` → server chạy trên localhost:3001 không lỗi
- [x] Config module load được .env vars
- [x] Folder structure đúng module architecture

## Definition of Done
- [x] NestJS project initialized
- [x] Dependencies installed
- [x] Config module hoạt động
- [x] .env.example + Docker files created

---
Next: Phase 02 - Database Schema & Auth
