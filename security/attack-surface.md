# MinesQuiz Attack Surface Analysis

## 1. Scope
This document inventories all entry points, network boundaries, authentication gates, user input vectors, hardware interfaces, and third-party integrations exposed by the MinesQuiz platform.

---

## 2. Network and Deployment Exposure

| Surface Component | Exposure Layer | Port / Protocol | Protection Mechanism |
| :--- | :--- | :--- | :--- |
| **Next.js Web Frontend** | Public Internet | 443 (HTTPS) / Cloudflare Edge | Cloudflare DDoS protection, Static Site Generation (SSG), TLS 1.3 |
| **Express API Server** | Public Internet / Edge Proxy | 5050 (HTTP/TLS reverse proxy) | Helmet security headers, CORS whitelist, Express rate limiting |
| **MongoDB Atlas** | Private / Allowed IPs | 27017 (TLS) | IP whitelist restriction, SCRAM-SHA-256 authentication |
| **Client Media Subsystem** | Local Device Sandbox | Browser WebRTC / Web Audio | Browser permission prompt, client sandbox memory isolation |

---

## 3. API Surface Catalog

### A. Public Endpoints (Unauthenticated)

| HTTP Method | Route Path | Purpose | Input Parameters | Rate Limit |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Marketing landing page | None | Edge cached |
| `GET` | `/candidate` | Candidate subject portal | None | Edge cached |
| `GET` | `/exam/[id]` | Prerendered exam room canvas | Route parameter `id` | Edge cached |
| `POST` | `/api/auth/student/send-otp` | Dispatch candidate login OTP | `email: string` | 10 req / 5 min |
| `POST` | `/api/auth/student/verify-otp`| Verify candidate login OTP | `email: string, otp: string` | 10 req / 5 min |
| `POST` | `/api/auth/student/login` | Candidate email/password login | `email: string, password: string` | 10 req / 5 min |
| `POST` | `/api/admin/send-otp` | Dispatch admin login OTP | `email: string` | 5 req / 5 min |
| `POST` | `/api/admin/verify-otp` | Verify admin login OTP | `email: string, otp: string` | 5 req / 5 min |
| `GET` | `/sitemap.xml` | Search crawler sitemap | None | Static |
| `GET` | `/robots.txt` | Crawler directives and llms.txt | None | Static |

### B. Protected Endpoints (Authenticated / Role-Gated)

| HTTP Method | Route Path | Required Role / Guard | Purpose | Input Payload |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/attempts/start` | Bearer JWT (Candidate) | Initialize new exam session | `quizId: string` |
| `POST` | `/api/v1/attempts/submit` | Bearer JWT (Candidate) | Grade and submit completed exam | `attemptId: string, answers: Array` |
| `POST` | `/api/v1/proctor/violation` | Valid `attemptId` string/ObjectId | Record proctoring infraction telemetry | `attemptId, type, severity, confidence, snapshotUrl` |
| `GET` | `/api/admin/candidates` | Bearer JWT (`role === 'admin'`) | List all candidate records and scores | Query parameters (pagination, filter) |
| `POST` | `/api/admin/candidates/reset` | Bearer JWT (`role === 'admin'`) | Clear candidate attempt lock | `candidateEmail: string, quizId: string` |

---

## 4. User Input Vectors and Validation Layers

| Input Vector | Target Controller | Validation Mechanism | Potential Injection Risk | Mitigation Status |
| :--- | :--- | :--- | :--- | :--- |
| **Candidate Email** | Auth / Attempt Services | Email regex validation and lowercase normalization | NoSQL operator injection | Sanitized via Mongoose queries |
| **OTP Code** | Auth Services | 6-digit numeric string constraint | Type juggling / Brute force | Bcrypt hash check + Rate limiter |
| **Exam Answers** | Attempt Scoring Service | Array of option IDs checked against question schema | Array manipulation / Overflow | Length and string validation |
| **Violation Snapshot** | Proctor Service | Base64 JPEG URI or Cloudinary URL string | Malicious file payload | Strict MIME and base64 pattern check |
| **Candidate Name** | Session Generation | Sanitized display string | Stored XSS | React auto-escaping in JSX DOM |

---

## 5. Client Hardware and Browser API Surface

| API Surface | Purpose | Permission Gate | Cheating / Attack Risk | Existing Defense |
| :--- | :--- | :--- | :--- | :--- |
| **`navigator.mediaDevices.getUserMedia`** (Video) | Live face landmark and gaze monitoring | Explicit user prompt | Virtual webcam feed injection (OBS/v4l2loopback) | Driver blacklisting in `useAntiCheat.ts` |
| **`navigator.mediaDevices.getUserMedia`** (Audio) | Ambient room sound and whisper detection | Explicit user prompt | Mic muting or hardware spoofing | 70 dB threshold alert + cooldown |
| **`document.documentElement.requestFullscreen`** | Enforce focused examination window | User gesture trigger | Fullscreen exit to view notes | Fullscreen listener logs violation |
| **`document.visibilityState`** | Detect switching browser tabs | Automatic event | Background tab search browsing | 10s grace window + strike countdown |
| **`navigator.wakeLock.request`** | Prevent screen sleep during exam | Automatic permission | Inactivity timeout exploitation | Screen wake lock enforcer hook |

---

## 6. Storage and Database Surface

| Storage Target | Data Stored | Access Layer | Security Controls |
| :--- | :--- | :--- | :--- |
| **MongoDB Atlas** | Quizzes, Attempts, Questions, ViolationLogs | Mongoose ORM | NoSQL injection defense, index optimization, TLS connection |
| **Browser `localStorage`** | Candidate session token, attempt IDs, termination flags | Client JavaScript | `mines_terminated_*`, `mines_attempt_*` keys validated against backend |
| **Browser `document.cookie`** | `mines_sub_*`, `mines_term_*` single attempt flags | Client and Server | `SameSite=Strict`, path-restricted, 7-day TTL |
| **Browser `sessionStorage`** | `mines_active_quiz_session` cache | Client JavaScript | Automatically cleared upon browser session termination |

---

## 7. Third-Party Integrations Surface

| Service Provider | Role | Integration Type | Security Boundary |
| :--- | :--- | :--- | :--- |
| **Firebase Auth** | Candidate and admin identity management | SDK / REST | Cryptographic JWT verification using Google public keys |
| **Cloudflare** | Static asset delivery, caching, edge DNS | Reverse Proxy / CDN | Edge SSL termination, automated WAF, bot traffic management |
| **MediaPipe / Google** | Pretrained face landmark tracking models | Static WebAssembly bundle | Local client execution; no external API telemetry sent to Google |
