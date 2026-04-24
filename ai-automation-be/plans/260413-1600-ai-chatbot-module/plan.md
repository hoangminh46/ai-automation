# Plan: AI Chatbot Module (Standalone Backend)
Created: 2026-04-13
Status: 🟡 In Progress

## Overview
Module AI Chatbot backend độc lập (NestJS), AI Agent Pipeline lấy cảm hứng từ GoClaw, cho seller TMĐT Việt Nam.

## Goal
- Seller tự đăng ký → upload knowledge → kết nối FB page → chatbot hoạt động 5 phút
- AI trả lời 24/7 dựa trên knowledge base riêng seller
- Multi-tenant, modular, dễ mở rộng

## Scope
### In Scope
- NestJS backend, Supabase (PostgreSQL + pgvector)
- 5-Stage Agent Pipeline
- Knowledge Base (RAG)
- Facebook Messenger channel
- Seller self-serve API

### Out of Scope
- Frontend dashboard, Zalo/Widget, Handoff, Payment, AI Video, E-commerce APIs

## Phases

| Phase | Name | Tasks | Status |
|-------|------|-------|--------|
| 01 | Project Init & Config | 5 | ✅ |
| 02 | Database Schema & Auth | 7 | ✅ |
| 03 | Tenant & Agent CRUD | 6 | ✅ |
| 04 | LLM Integration | 5 | ✅ |
| 05 | Agent Pipeline Core | 7 | ✅ |
| 06 | Conversation & Memory | 6 | ✅ |
| 07 | Knowledge Upload & Processing | 6 | ✅ |
| 08 | Knowledge Search & RAG | 5 | ✅ |
| 09 | Facebook Messenger Channel | 10 | ✅ |
| 06E-1 | WebSocket Gateway Foundation | 5 | ✅ |
| 06E-2 | WS Event Emission from Services | 5 | ✅ |
| 10 | Self-serve API & Polish | 7 | 🟡 4/7 done |
| 11 | Testing & Hardening | 7 | ⬜ |

## Acceptance Criteria
- [x] Seller đăng ký → upload knowledge → kết nối FB → chatbot trả lời khách
- [x] AI trả lời chính xác dựa trên knowledge base
- [x] Multi-tenant isolation
- [ ] Hết quota → fallback message
- [ ] OpenAI lỗi → fallback message
- [x] Duplicate webhook → không xử lý 2 lần

## Quick Commands
- `/code 06E-1` → WebSocket Gateway Foundation
- `/code 06E-2` → WS Event Emission
- `/code phase-10` → Self-serve API
- `/next` → Xem tiến độ
- `/save-brain` → Lưu context
