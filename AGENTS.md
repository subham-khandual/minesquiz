# 🤖 AI Agent Governance & Guardrails, MinesQuiz

This document sets the operating guidelines and security boundaries for all AI coding agents working on this repository (including Ralph-Loop, Roo-Code, CodeRabbit, Ponytail, and Cursor).

---

## 1. Prime Directives (Senior Developer Protocol)
1. **Never execute destructive commands**: Do not run `rm -rf`, `git push --force`, or wipe databases without explicit human approval.
2. **Never commit secrets**: Check that `.env.local`, Firebase private keys, or API tokens are excluded from commits.
3. **Always verify compilation**: Every change must be validated by running `pnpm --filter @mines-quiz/web run build` and ensuring Exit Code 0.
4. **Style compliance**: Do not use em-dashes (— or –). Use a comma or a period instead.

---

## 2. Monorepo Structure & Workflow

```
mines-quiz/
├── apps/
│   ├── web/                     # Next.js 15 Frontend (Tailwind, Zustand, Motion)
│   └── server/                  # Node.js + Express REST & WebSocket API
├── packages/
│   ├── ui/                      # Shared reusable UI component library
│   ├── types/                   # Shared TypeScript DTOs and contracts
│   └── utils/                   # Shared math, validation, scoring, and gaze helpers
├── .clinerules                  # Roo-Code agent boundaries
├── .coderabbit.yaml             # CodeRabbit PR review policy
└── security.md                  # Enterprise security guardrails
```

---

## 3. Standard Scripts
- `pnpm dev`: Starts workspace services in development mode.
- `pnpm build`: Compiles all packages and applications.
- `pnpm --filter @mines-quiz/utils build`: Compiles utility TypeScript declarations to `dist/`.
- `pnpm --filter @mines-quiz/web build`: Produces Next.js production build.

---

## 4. Anti-Cheat & Security Invariants
- Questions delivered to the candidate browser must never include `correctOptionIds`.
- Webcam video feeds stay in local browser sandbox; MediaPipe calculates facial landmarks locally.
- Single attempt policy is enforced via candidate email hash.
