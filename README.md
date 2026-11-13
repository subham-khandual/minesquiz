# 🎯 Mines Quiz: Modern Online Examination Platform

> **Play Smart. Pass with Confidence. Secure Quiz Fair Exam.**  
> Next.js 15 + Node.js + AI Proctoring + Enterprise Security + MongoDB Atlas

---

## 🏛️ Monorepo Structure

```
mines-quiz/
├── apps/
│   ├── web/                     # Next.js 15 Frontend (App Router, Tailwind CSS, Zustand, AI Proctoring)
│   └── server/                  # Node.js + Express REST & WebSocket API (MongoDB Atlas)
├── packages/                    # Shared Monorepo Packages
│   ├── ui/                      # Shared reusable UI component library
│   ├── types/                   # Shared TypeScript definitions (DTOs, schemas)
│   └── utils/                   # Shared helpers, math, scoring, and gaze estimation utilities
└── docs/                        # Architecture & System Design documentation
    └── SYSTEM_DESIGN_AI_KIT.md  # 21-Phase AI Codebase & System Design Prompt Kit
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: >= 20.x
- **PNPM**: >= 9.x
- **MongoDB**: Atlas or local connection URI (`MONGODB_URI`)

### Installation

```bash
# Install all dependencies across all workspaces
pnpm install

# Run all services in development mode
pnpm dev

# Build all projects and packages
pnpm build
```

---

## 🛡️ Key Features

- **AI Proctoring**: In-browser MediaPipe Face Mesh for absence, multiple face detection, and head pose/gaze deviation.
- **Statutory Mining Exam Engine**: Dynamic randomized Coal Mines Regulations (CMR 2017) questions and randomized answer options per candidate attempt.
- **Anti-Cheat Guardrails**: Enforced fullscreen, tab-blur detection, clipboard lock, and single-attempt candidate email hash verification.
- **Enterprise Architecture**: Strict CORS, Helmet, Rate Limiting, Zod input validation, and MongoDB Atlas database persistence.
- **System Design Prompt Kit**: Comprehensive 21-phase system design and codebase exploration framework in [docs/SYSTEM_DESIGN_AI_KIT.md](docs/SYSTEM_DESIGN_AI_KIT.md).
