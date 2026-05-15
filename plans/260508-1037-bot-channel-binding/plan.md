# Plan: Bot <-> Channel Binding & Knowledge N:M

Created: 2026-05-08T10:37
Status: Complete
Spec: [bot-channel-spec.md](../../docs/bot-channel-spec.md)

## Overview

Implemented the Bot <-> Channel (1:N) and Bot <-> Knowledge (N:M) model based on the confirmed business rules. This includes default bot creation, channel assignment, bot-specific knowledge selection, and updated message routing.

## Goal

- Each channel is handled by exactly 1 bot.
- One bot can serve multiple channels.
- Knowledge belongs to the tenant, while bots choose which documents to use.
- A default bot is auto-created with each tenant and cannot be deleted.
- Inactive bots do not auto-reply even if they are assigned to a channel.
- UI supports bot assignment and reassignment from both Agents and Channels screens.

## Scope

### In Scope
- Database: `Agent.isDefault`, `ChannelConnection.agentId`, `AgentKnowledge`
- Backend: Agent CRUD updates, channel assign-bot API, message routing
- Frontend: Agent form with channel/knowledge binding, channel bot dropdown, knowledge usage indicators

### Out of Scope
- Widget channel
- Multi-language bot persona
- Bot A/B testing analytics
- Knowledge auto-suggest

## Acceptance Criteria

- [x] Create tenant -> auto-create default bot (`isDefault=true`, `isActive=true`)
- [x] Default bot cannot be deleted
- [x] Default bot badge is visible in UI
- [x] Create/Edit bot shows channel list and knowledge checkboxes
- [x] Channels already assigned to another bot are blocked/guarded in form flow
- [x] Channels page shows bot selector and unassigned warning
- [x] Reassigning bot on a channel requires confirmation
- [x] Deleting a bot unassigns channels and preserves knowledge
- [x] Inactive bot assigned to a channel does not auto-reply
- [x] Incoming messages route by `channel.agentId`
- [x] Bot uses only its selected knowledge, not all tenant knowledge
- [x] Knowledge UI shows bot usage information

## Phases

| Phase | Name | Status | Tasks | Depends On |
|-------|------|--------|:-----:|------------|
| 01 | Database Migration & Seed | Complete | 8 | - |
| 02 | BE - Agent CRUD (`isDefault`, includes) | Complete | 6 | 01 |
| 03 | BE - Channel-Bot Binding | Complete | 6 | 02 |
| 04 | BE - Knowledge N:M API | Complete | 4 | 02 |
| 05 | BE - Message Routing & RAG | Complete | 5 | 03, 04 |
| 06 | FE - Agents UI | Complete | 7 | 02, 03, 04 |
| 07 | FE - Channels UI | Complete | 5 | 03, 06 |
| 08 | FE - Knowledge UI & E2E Testing | Complete | 8 | 06, 07 |

## Notes

- Synced with `.brain/brain.json`: `bot_channel_binding.status = complete`.
- Further work in this area now belongs to post-MVP roadmap items, not this implementation plan.

## Quick Commands

- Review progress: `/next`
- Save context: `/save-brain`
