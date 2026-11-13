# 🏗️ Mines Quiz, System Architecture

## Architecture Overview

Mines Quiz is built as a high-performance distributed monorepo separating client presentation, secure business logic, edge AI processing, and real-time streaming:

```
[Candidate Browser]
   ├── Next.js App Router (Tailwind CSS, Zustand)
   ├── MediaPipe / TensorFlow.js Face Mesh (In-Browser Edge AI)
   └── WebRTC Client (Local Media Stream)
           │
           │ (HTTP / JSON via Axios)
           ▼
[Node.js + Express API Server]
   ├── Middlewares (Helmet, CORS, Rate Limit, Firebase Auth Guard)
   ├── Zod Schema Validators
   ├── Controllers & Services (QuizEngine, AttemptManager, Scoring)
   └── Mongoose Models ──▶ [MongoDB Atlas / Replica Set]
           │
           │ (WebSocket / Socket.io)
           ▼
[WebRTC Signaling & Proctor Service]
   └── Relays streams & violation telemetry to [Invigilator Dashboard]
```

## Data Flow
1. **Candidate Authentication**: Client authenticates via Firebase Auth. The issued Firebase ID Token is forwarded in the `Authorization: Bearer <token>` header to the Node.js API.
2. **Exam Initialization**: Candidate starts an attempt. The backend initializes an `Attempt` document with a server-enforced expiration time.
3. **AI Proctoring Loop**:
   - The candidate's camera frame is processed in-browser every 200ms using MediaPipe.
   - If multiple faces, zero faces, or looking away is detected for > 3s, a violation event is dispatched to `POST /api/v1/proctor/violation`.
   - The invigilator receives instant WebSocket updates with the violation category and timestamped screenshot thumbnail.
4. **Submission & Grading**:
   - Answers are submitted in real-time or batch at the end.
   - Server validates answers against stored correct choices (correct answers are never delivered to the client during an active quiz).
   - Results, percentile, and security audit logs are generated immediately.

