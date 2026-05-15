# Plan: AI Chatbot Module (Backend Core)

Created: 2026-04-13
Status: Core Complete

## Overview

Original backend core plan for the AI chatbot module built with NestJS, Supabase/PostgreSQL, pgvector, and a multi-tenant agent pipeline for Vietnamese e-commerce sellers.

## Goal

- Seller signs up
- Uploads knowledge
- Connects a Facebook page
- Chatbot becomes usable quickly
- AI replies based on seller-specific knowledge
- Backend remains modular and multi-tenant

## Scope

### In Scope
- NestJS backend
- Supabase/PostgreSQL + pgvector
- 5-stage agent pipeline
- Knowledge base (RAG)
- Facebook Messenger channel
- Self-serve seller API

### Out of Scope
- Frontend dashboard
- Zalo / Widget
- Human handoff
- Payment
- AI video
- E-commerce API integrations

## Phases

| Phase | Name | Tasks | Status |
|-------|------|-------|--------|
| 01 | Project Init & Config | 5 | Complete |
| 02 | Database Schema & Auth | 7 | Complete |
| 03 | Tenant & Agent CRUD | 6 | Complete |
| 04 | LLM Integration | 5 | Complete |
| 05 | Agent Pipeline Core | 7 | Complete |
| 06 | Conversation & Memory | 6 | Complete |
| 07 | Knowledge Upload & Processing | 6 | Complete |
| 08 | Knowledge Search & RAG | 5 | Complete |
| 09 | Facebook Messenger Channel | 10 | Complete |
| 06E-1 | WebSocket Gateway Foundation | 5 | Complete |
| 06E-2 | WS Event Emission from Services | 5 | Complete |
| 10 | Self-serve API & Polish | 7 | Complete |
| 11 | Testing & Hardening | 7 | Complete |

## Acceptance Criteria

- [x] Seller can sign up, upload knowledge, connect Facebook, and receive bot replies
- [x] AI replies use the seller knowledge base correctly
- [x] Multi-tenant isolation works
- [x] Quota enforcement blocks further AI responses when limits are exceeded
- [x] LLM/provider failures have guarded handling with logging and graceful failure path
- [x] Duplicate webhooks are not processed twice

## Status Update

- The original backend core scope is complete.
- The project later expanded beyond this file and also completed:
  - Zalo OA integration
  - Human handover and bot handover
  - Realtime WebSocket CRM
  - Billing and quotas
  - VietQR/SePay payment flow
  - Tenant quota enforcement
- Ongoing/new work now belongs to post-MVP roadmap items rather than this legacy backend-core plan.

## Quick Commands

- Review progress: `/next`
- Save context: `/save-brain`
