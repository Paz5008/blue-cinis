# 🤖 Inter-AI Communication Protocol

## Overview
This protocol enables asynchronous file-based communication between **Gemini (Antigravity)** and **Clawbot** for collaborative work on Blue Cinis.

---

## Folder Structure

```
.ai/
├── PROTOCOL.md          # This file
├── CONTEXT.md           # Project context
├── gemini/
│   ├── inbox/           # Messages TO Gemini (written by Clawbot)
│   ├── outbox/          # Messages FROM Gemini (written by Gemini)
│   └── status.json      # Current Gemini status
└── clawbot/
    ├── inbox/           # Messages TO Clawbot (written by Gemini)
    ├── outbox/          # Messages FROM Clawbot (written by Clawbot)
    └── status.json      # Current Clawbot status
```

---

## Message Format

Messages are JSON files named: `{timestamp}_{type}_{subject-slug}.json`

Example: `2026-02-06T13-47-00_task_audit-dashboard.json`

```json
{
  "id": "uuid-v4",
  "timestamp": "2026-02-06T13:47:00+01:00",
  "from": "gemini",
  "to": "clawbot",
  "type": "task|review|question|response|ack",
  "priority": "normal",
  "subject": "Audit Dashboard Artiste",
  "content": "Detailed markdown content...",
  "attachments": ["/path/to/file.tsx"],
  "replyTo": null,
  "status": "pending"
}
```

---

## Rules

### For BOTH AIs:
1. **Read your inbox** at the start of any Blue Cinis work session
2. **Write to the OTHER AI's inbox** (not your own)
3. **Update your status.json** when starting/finishing work
4. **Mark messages as `read`** after processing
5. **Never delete messages** - move completed ones to an `archive/` subfolder

### Message Types:
| Type | Usage |
|------|-------|
| `task` | Assign work to the other AI |
| `review` | Request code review |
| `question` | Ask for clarification |
| `response` | Answer to a task/review/question |
| `ack` | Simple acknowledgment |

### Priority Levels:
- `low` — Background task, no rush
- `normal` — Standard priority
- `high` — Process soon
- `urgent` — Process immediately

---

## Status Format

`status.json` should contain:

```json
{
  "lastActive": "2026-02-06T13:47:00+01:00",
  "currentTask": "Analyzing ProductCard component",
  "available": true
}
```

---

## Workflow Example

1. **User** assigns module to audit → tells Gemini
2. **Gemini** writes analysis message to `clawbot/inbox/`
3. **User** tells Clawbot to check inbox
4. **Clawbot** reads, reviews, writes response to `gemini/inbox/`
5. **User** tells Gemini to check inbox
6. **Gemini** reads response, cross-checks, delivers final code

---

## Getting Started

After reading this protocol, acknowledge by writing to your outbox:

```json
{
  "id": "your-uuid",
  "timestamp": "current-time",
  "from": "your-name",
  "to": "other-ai",
  "type": "ack",
  "priority": "normal",
  "subject": "Protocol Acknowledged",
  "content": "I have read and understood the Inter-AI Communication Protocol. Ready for collaboration on Blue Cinis.",
  "attachments": [],
  "replyTo": null,
  "status": "pending"
}
```
