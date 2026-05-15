# Plan: AI Chatbot Frontend (Next.js)

Goal: Build the self-serve dashboard for Vietnamese e-commerce sellers.
Stack: Next.js 16, React 19, Tailwind CSS v4, TypeScript, Supabase SSR, Zustand.

---

## Build Philosophy

For complex screens, the team follows:
`Static UI -> Review -> API/Data binding`

This keeps backend/frontend bugs down and makes review easier.

---

## Sprint Overview

### Sprint 1: Foundation - Complete
- Core architecture, dependencies, axios auth config, dashboard middleware
- Login/Register UI and Supabase auth flow

### Sprint 2: Tenant Management - Complete
- First-tenant onboarding flow
- Tenant creation form with slug generation
- Dashboard shell, selected tenant state, inline tenant rename

### Sprint 3: Agent Management - Complete
- Agent list UI, active/inactive indicator, delete flow
- Agent config form: name, greeting, persona
- Test Bot dialog
- Validation improvements
- Theme mode support

### Sprint 4: Knowledge / RAG UI - Complete
- Drag-and-drop upload area
- Document table with processing statuses
- Stats badges and empty state
- Delete confirmation flow
- API integration via service + Zustand store

### Sprint 5: CRM + Channels + Realtime - Complete
- 3-column CRM layout
- Conversation list, message window, customer panel
- Human reply flow
- Channel management page
- Socket.IO realtime updates, reconnect resync, dedup

### Sprint 6: Channel Expansion & Binding - Complete
- Facebook OAuth refactor from manual token entry to 1-click OAuth
- Facebook multi-page selection UI
- Zalo OA channel section
- Bot <-> Channel <-> Knowledge binding UI

### Sprint 7: Billing & Payment - Complete
- Usage page
- Billing page with comparison table
- Quota warning banner
- Payment modal with QR/polling
- Transaction history
- Response pack selector
- Expiry warning banner and notifications

### Sprint 8: Dashboard Analytics - In Progress
- Dashboard stat cards redesign
- Charts scaffold using Recharts
- Stats API integration in progress
- Remaining work: final binding QA, filter/date-range polish, and consistency checks

---

## Current Status (2026-05-15)

### Completed
- Sprint 1: Foundation + Auth
- Sprint 2: Tenant onboarding + dashboard layout
- Sprint 3: Agent CRUD + config + test chat
- Sprint 4: Knowledge/RAG UI
- Sprint 5: CRM + channels + realtime
- Sprint 6: Facebook OAuth + Zalo OA + bot binding UI
- Sprint 7: Billing + payment UI

### In Progress
- Sprint 8: Dashboard Analytics

### Notable Decisions and Changes
- Model/temperature/maxTokens are hidden from seller; platform controls AI model.
- `POST /chat/test` exists as a dedicated rate-limited endpoint for seller testing.
- Settings page was folded into inline dashboard editing where practical.
- WebSocket replaced polling for production-grade realtime CRM.
- Axios uses `/api/v1` base path and auto-unwraps the standard response envelope.
- Zustand stores use selector-based access and tenant-scoped loading guards.
- Channel page parses callback query params for Facebook and Zalo connect flows.
- Payment UI was added after the original frontend plan and is now complete.

## Next Priorities

```text
1. Dashboard Analytics
2. Website Chat Widget
3. Streaming Response
```

## Notes

- This file is now aligned with `.brain/brain.json`, which is the main source of truth for current project status.
