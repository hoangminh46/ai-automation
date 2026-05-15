# Plan: Zalo OA Channel Integration

Created: 2026-05-04T11:04:00+07:00
Status: Complete

## Overview

Integrated Zalo Official Account (OA) as a supported messaging channel for the AI Chatbot platform. Sellers can connect a Zalo OA, receive incoming messages, trigger the AI pipeline, and let staff reply from the CRM dashboard.

## Goal

- Seller connects Zalo OA via OAuth
- Customer messages on Zalo trigger AI reply flow
- CRM staff can reply back to Zalo users
- Access token auto-refresh works without hourly re-auth

## Scope

### In Scope
- `ZaloAdapter` implementing `ChannelAdapter`
- OAuth2 authorization code flow
- Webhook receiver with signature verification
- Send API for text replies
- Token auto-refresh service
- DB migration for `refreshTokenEnc` and `tokenExpiresAt`
- Frontend support on `/dashboard/channels`
- Connect/disconnect flow

### Out of Scope
- Zalo ZNS
- Zalo Mini App
- Rich media
- Zalo Pay
- Multi-OA per tenant

## Acceptance Criteria

- [x] Seller connects Zalo OA successfully via OAuth
- [x] Incoming Zalo messages trigger AI replies
- [x] CRM manual reply sends back to Zalo customer
- [x] Token auto-refresh works
- [x] Invalid signature is rejected
- [x] Duplicate message is handled once
- [x] Disconnect Zalo OA works
- [x] Frontend displays Zalo OA connection state

## Phases

| Phase | Name | Status | Progress | Depends On |
|-------|------|--------|----------|------------|
| 01 | DB Migration + Zalo Adapter | Complete | 100% | - |
| 02 | Zalo OAuth + Token Refresh | Complete | 100% | 01 |
| 03 | Zalo Webhook + Message Routing | Complete | 100% | 01, 02 |
| 04 | Frontend Channel UI Extension | Complete | 100% | 02, 03 |

## Notes

- Synced with `.brain/brain.json`: `channel_integration.status = complete` and `zalo_oa_channel.status = done`.

## Quick Commands

- Review progress: `/next`
- Save context: `/save-brain`
