# Architecture and Project Decisions: MinesQuiz

## 1. Purpose
This document preserves critical architectural, technical, security, database, API, infrastructure, and business-logic decisions made in the MinesQuiz statutory examination platform.

Its primary purpose is to ensure that future developers and AI coding agents (such as Antigravity, Roo-Code, Cursor, and Claude Code) preserve architectural intent rather than repeatedly re-inferring, contradicting, or accidentally undoing intentional decisions.

---

## 2. Rules for Future AI Agents

Future AI agents working on this repository must strictly adhere to the following guardrails:
1. **Read this file before making architecture-level changes.**
2. **Treat all `CONFIRMED` decisions as intentional architectural constraints.**
3. **Do not contradict or revert a confirmed decision without explicit human approval.**
4. **Do not silently replace an existing decision with an alternative implementation.**
5. **If a proposed task conflicts with a documented decision, stop and identify the conflict to the user first.**
6. **If a decision is unclear or marked `INFERRED - NOT CONFIRMED`, ask for human clarification before altering architecture.**
7. **Never infer a new architecture solely because an existing implementation appears unusual.**
8. **Follow the Senior Developer Protocol: Never run destructive commands, never commit secrets, maintain Exit Code 0 builds, and enforce zero em-dash compliance.**

---

## 3. Decision Index

| ID | Decision Title | Status | Area |
| :--- | :--- | :--- | :--- |
| **DEC-001** | Zero-Knowledge Question Delivery | CONFIRMED | Security / Anti-Cheat |
| **DEC-002** | Local In-Browser Biometric Face & Gaze Tracking | CONFIRMED | Privacy / Architecture |
| **DEC-003** | Dual-Layer Single Attempt Email Policy | CONFIRMED | Business Logic / Security |
| **DEC-004** | DGMS Statutory Zero Negative Marking Engine | CONFIRMED | Examination Standards |
| **DEC-005** | Mutable Ref Hardware Unmount Lifecycle | CONFIRMED | Frontend Reliability |
| **DEC-006** | Dual-Viewport Responsive Layout Ergonomics | CONFIRMED | UI / UX |
| **DEC-007** | Strict Monorepo Architecture & Quality Governance | CONFIRMED | Governance |
| **DEC-008** | Client Anti-Cheat Lockdown & 10s Grace Window | CONFIRMED | Anti-Cheat |
| **DEC-009** | Static Site Generation (SSG) & Cloudflare Dist | CONFIRMED | Infrastructure |
| **DEC-010** | High-Factual Density AEO & GEO Structured Schemas | CONFIRMED | SEO / Indexing |
| **DEC-011** | Mixed Attempt ID Support in Violation Logging | CONFIRMED | Database / Backend |
| **DEC-012** | Client Session Auto-Recovery & Routing Hydration | CONFIRMED | State Management |
| **DEC-013** | Firebase Auth Guard with Role-Based Verification | CONFIRMED | Authentication |
| **DEC-014** | Ambient Audio Noise Level Detection & Cooldown | CONFIRMED | Audio Proctoring |

---

## 4. Decisions

### DEC-001: Zero-Knowledge Question Delivery
- **Status**: CONFIRMED
- **Area**: Security / Anti-Cheat
- **Decision**: Questions delivered to the candidate browser runtime during live examinations must strictly omit `correctOptionIds` and answer explanations. Correct answers are verified solely on the server during submission or client-side scoring key reconstruction only upon final mock completion.
- **Why**: Delivering answer keys or explanations to the candidate's browser allows candidates to inspect memory, state, or DOM in DevTools to find the correct options.
- **Problem Solved**: Prevents client-side examination leakage and trivial DevTools inspection cheating.
- **Alternatives Considered**: Encrypting answers on the client with a shared secret.
- **Why Alternatives Were Rejected**: Client-side decryption keys can be extracted through runtime debugger breakpoints or script inspection.
- **Constraints**: Live score grading requires server-side validation or secure post-exam session bundle injection.
- **Impact**: `apps/web/src/lib/questionSampling.ts`, `apps/web/src/features/exam/ExamRoom.tsx`, `apps/server/src/services/attemptService.ts`.
- **Evidence**: `apps/web/src/lib/questionSampling.ts` lines 95-105, `apps/server/tests/unit/securityHardening.test.ts` lines 7-20, `AGENTS.md` line 34.
- **Change Risk**: If modified to include correct choices in the question payload, candidate exam integrity is entirely compromised.
- **Related Decisions**: DEC-003, DEC-008.

---

### DEC-002: Local In-Browser Biometric Face & Gaze Tracking
- **Status**: CONFIRMED
- **Area**: Privacy / Architecture
- **Decision**: Facial mesh tracking (468 landmarks), head pose (pitch, yaw), and gaze direction run strictly inside the candidate browser memory using MediaPipe / Chromium FaceDetector API. Continuous raw video feeds are never uploaded or streamed to backend servers.
- **Why**: Transmitting continuous HD video from thousands of simultaneous candidates creates massive bandwidth costs, server scaling bottlenecks, and significant candidate privacy liabilities under Indian data protection laws.
- **Problem Solved**: Provides high-frequency (sub-50ms) pose analysis with zero server video processing costs and complete candidate privacy.
- **Alternatives Considered**: WebRTC streaming of all candidate webcam feeds to an SFU (Selective Forwarding Unit) media server.
- **Why Alternatives Were Rejected**: High infrastructure costs, severe latency spikes on slow 3G/4G rural mining candidate connections, and candidate privacy concerns.
- **Constraints**: Requires client hardware supporting WebAssembly and canvas rendering.
- **Impact**: `apps/web/src/features/exam/components/CBTProctorWidget.tsx`, `apps/web/src/hooks/useFaceDetector.ts`, `apps/web/src/hooks/useWebcam.ts`.
- **Evidence**: `apps/web/public/llms.txt` lines 24-30, `architecture.md` lines 30-34, `AGENTS.md` line 35.
- **Change Risk**: Converting to continuous cloud video streaming would cause server crashes under concurrency and trigger privacy compliance violations.
- **Related Decisions**: DEC-005, DEC-008, DEC-011.

---

### DEC-003: Dual-Layer Single Attempt Email Policy
- **Status**: CONFIRMED
- **Area**: Business Logic / Security
- **Decision**: Official live statutory examinations permit only 1 attempt per candidate email. This policy is enforced using dual-layer persistence: `localStorage` keys combined with `SameSite=Strict` secure browser cookies (`mines_sub_*` and `mines_term_*`), verified against backend MongoDB attempt status records. Master administrative user (`subhamkhandual215@gmail.com`) is explicitly exempt for testing.
- **Why**: Under Directorate General of Mines Safety (DGMS) examination integrity rules, candidates must not retake statutory question papers to prevent memorization and trial-and-error answering.
- **Problem Solved**: Stops duplicate attempts even if a candidate clears their browser `localStorage` or opens an incognito window.
- **Alternatives Considered**: IP-based attempt blocking.
- **Why Alternatives Were Rejected**: Shared institutional campus Wi-Fi networks in mining colleges would block multiple legitimate candidates sharing a single IP.
- **Constraints**: Candidate email must be verified with OTP before exam launch.
- **Impact**: `apps/web/src/features/exam/ExamRoom.tsx`, `apps/web/src/app/candidate/page.tsx`, `apps/server/src/services/attemptService.ts`.
- **Evidence**: `apps/web/src/features/exam/ExamRoom.tsx` lines 270-300, `apps/web/src/app/candidate/page.tsx` lines 83-100, `apps/server/src/services/attemptService.ts` lines 18-34, `AGENTS.md` line 36.
- **Change Risk**: Removing either layer allows candidates to bypass single-attempt lock and compromise examination authenticity.
- **Related Decisions**: DEC-001, DEC-008.

---

### DEC-004: DGMS Statutory Zero Negative Marking Engine
- **Status**: CONFIRMED
- **Area**: Examination Standards
- **Decision**: Scoring engine gives +1.0 mark per correct answer and exactly 0 penalty for incorrect or unanswered questions. A passing score of 60.0% (at least 18 out of 30) is required for statutory qualification.
- **Why**: Coal Mines Regulations 2017 (CMR 2017) and DGMS statutory examination boards conduct First Class, Second Class, Overman, and Sirdar computer-based examinations with zero negative marking.
- **Problem Solved**: Eliminates candidate scoring discrepancies and provides exact statutory simulation.
- **Alternatives Considered**: Standard JEE/GATE negative marking (-0.25 or -0.33 per wrong answer).
- **Why Alternatives Were Rejected**: Violates official DGMS CMR 2017 examination rules and misleads candidates preparing for government statutory certifications.
- **Constraints**: Total score must equal total correct answers with no fractional point deductions.
- **Impact**: `packages/utils/src/scoring.ts`, `apps/web/src/features/exam/ExamRoom.tsx`, `apps/web/public/llms.txt`.
- **Evidence**: `packages/utils/src/scoring.ts` lines 1-40, `apps/web/public/llms.txt` lines 12-16, `apps/web/src/components/seo/JsonLd.tsx` lines 100-105.
- **Change Risk**: Adding negative marking violates statutory accuracy and breaks candidates' regulatory benchmark preparation.
- **Related Decisions**: DEC-010.

---

### DEC-005: Mutable Ref Hardware Unmount Lifecycle
- **Status**: CONFIRMED
- **Area**: Frontend Reliability
- **Decision**: Hardware stop and start routines for webcam and microphone must rely on mutable references (`streamRef.current`, `audioStreamRef.current`) and zero-dependency `useCallback(..., [])` functions. Unmount cleanup `useEffect` hooks must run with empty dependency arrays `[]` rather than depending on stream states or stop function references.
- **Why**: In React 19 / Next.js 15, updating component state (e.g. `setStream(mediaStream)`) causes functions with state dependencies to re-instantiate. This triggers the cleanup function of previous effects, which terminates active hardware media tracks and sets `hasPermission = false`, causing premature video shutdown and red VideoOff icon fallbacks.
- **Problem Solved**: Prevents camera and microphone hardware tracks from stopping prematurely during normal examination state changes.
- **Alternatives Considered**: Keeping stream state in component props or context.
- **Why Alternatives Were Rejected**: Context updates trigger broad re-renders that exacerbate hardware driver lockups on Windows and Chromium.
- **Constraints**: Global shutdown hooks (`window.__stopAllWebcamHardware`) must be exposed for explicit termination upon exam submission.
- **Impact**: `apps/web/src/hooks/useWebcam.ts`, `apps/web/src/hooks/useNoiseDetector.ts`, `apps/web/src/features/exam/components/CBTProctorWidget.tsx`.
- **Evidence**: `apps/web/src/hooks/useWebcam.ts` lines 10-40, `apps/web/src/hooks/useNoiseDetector.ts` lines 25-50.
- **Change Risk**: Adding `[stream]` to `stopWebcam` dependencies recreates the hardware teardown loop and breaks the live video feed.
- **Related Decisions**: DEC-002, DEC-006, DEC-014.

---

### DEC-006: Dual-Viewport Responsive Layout Ergonomics
- **Status**: CONFIRMED
- **Area**: UI / UX
- **Decision**: Examination interface renders distinct ergonomic structures for mobile and desktop viewports. Mobile layout uses a 44px unified single header bar, places the Action Toolbar ("Save & Next") immediately below the question canvas, and nests an inline proctor widget. Desktop layout uses an 8-column question canvas with a 4-column proctor and question palette sidebar (67% / 33% split).
- **Why**: Mobile candidates using smartphones were forced to scroll down 600px past video boxes and question palettes just to hit "Save & Next" for each question.
- **Problem Solved**: Allows mobile thumb-tap ergonomic progression while maintaining desktop dual-column statutory CBT density.
- **Alternatives Considered**: Responsive CSS-only media query wrapping.
- **Why Alternatives Were Rejected**: CSS-only reordering without DOM restructuring caused duplicate component mounting and webcam hardware locks.
- **Constraints**: Exactly one `CBTProctorWidget` must be mounted in the DOM to prevent dual-camera acquisition conflicts.
- **Impact**: `apps/web/src/features/exam/ExamRoom.tsx`, `apps/web/src/features/exam/components/`.
- **Evidence**: `apps/web/src/features/exam/ExamRoom.tsx` lines 595-685.
- **Change Risk**: Re-merging layouts or reintroducing vertical scroll barriers harms mobile candidate completion rates.
- **Related Decisions**: DEC-005.

---

### DEC-007: Strict Monorepo Architecture & Quality Governance
- **Status**: CONFIRMED
- **Area**: Governance
- **Decision**: Repository is organized as a pnpm monorepo containing `apps/web`, `apps/server`, `packages/types`, `packages/utils`, and `packages/ui`. All code changes must compile with Exit Code 0 (`pnpm --filter @mines-quiz/web run build`), pass 36 server unit tests, and strictly adhere to zero em-dash typography.
- **Why**: Shared types and scoring algorithms must remain identical between client and server. Unescaped em-dashes break external automated linters and display as garbled characters on legacy systems.
- **Problem Solved**: Prevents cross-package contract drift, runtime TypeScript mismatch, and deployment failures.
- **Alternatives Considered**: Polyrepo architecture with published npm packages.
- **Why Alternatives Were Rejected**: High maintenance overhead for internal DTO updates and version synchronization lag.
- **Constraints**: Packages must be built via `pnpm build:packages` before application build.
- **Impact**: Entire repository, CI/CD, development scripts.
- **Evidence**: `AGENTS.md` lines 8-30, `package.json` lines 1-30, `pnpm-workspace.yaml`.
- **Change Risk**: Modifying shared types without rebuilding packages causes immediate build failures.
- **Related Decisions**: DEC-001, DEC-004.

---

### DEC-008: Client Anti-Cheat Lockdown & 10-Second Grace Window
- **Status**: CONFIRMED
- **Area**: Anti-Cheat
- **Decision**: Client exam room enforces fullscreen mode, disables right-click context menu, blocks clipboard copy-paste, intercepts DevTools shortcuts (F12, Ctrl+Shift+I), and tracks tab visibility. The first tab switch triggers a 10-second grace window with an advisory countdown; failure to return or a second strike causes permanent examination disqualification.
- **Why**: Balances strict exam integrity with practical user tolerance. Accidental trackpad gestures, operating system notifications, or antivirus popups should not instantly disqualify a candidate without a recovery opportunity.
- **Problem Solved**: Stops multi-window and search engine cheating while eliminating candidate grievances over accidental clicks.
- **Alternatives Considered**: Instant zero-tolerance disqualification on first tab blur.
- **Why Alternatives Were Rejected**: Produced unacceptably high false-positive disqualification rates due to Windows background notifications.
- **Constraints**: Master user email is exempt from permanent disqualification lock during testing.
- **Impact**: `apps/web/src/features/exam/ExamRoom.tsx`, `apps/web/src/hooks/useTabVisibility.ts`, `apps/web/src/hooks/useFullscreen.ts`, `apps/web/src/hooks/useAntiCheat.ts`.
- **Evidence**: `apps/web/src/features/exam/ExamRoom.tsx` lines 170-240, `security.md` lines 17-18.
- **Change Risk**: Removing the grace window causes false positive complaints; disabling detection allows open book cheating.
- **Related Decisions**: DEC-001, DEC-003.

---

### DEC-009: Static Site Generation (SSG) & Cloudflare Distribution
- **Status**: CONFIRMED
- **Area**: Infrastructure
- **Decision**: Next.js 15 uses static export / SSG (`generateStaticParams`) to prerender all 48 exam and marketing pages into static HTML. A custom deployment script (`scripts/prepare-cloudflare-dist.js`) packages output assets into `apps/web/dist` for Cloudflare deployment.
- **Why**: Static assets deliver sub-50ms Time-to-First-Byte (TTFB) globally, consume zero Node.js server compute during high candidate traffic, and prevent server crash during peak examination hours.
- **Problem Solved**: High concurrent exam access without expensive autoscaling server infrastructure.
- **Alternatives Considered**: Dynamic Server-Side Rendering (SSR) on every exam request.
- **Why Alternatives Were Rejected**: Slower page loads, server cold-starts, and vulnerability to traffic spikes.
- **Constraints**: Pages cannot use runtime dynamic server headers; dynamic data must be fetched client-side.
- **Impact**: `apps/web/src/app/exam/[id]/page.tsx`, `scripts/prepare-cloudflare-dist.js`, `apps/web/package.json`.
- **Evidence**: `apps/web/src/app/exam/[id]/page.tsx` lines 4-16, `scripts/prepare-cloudflare-dist.js` lines 1-60.
- **Change Risk**: Removing static export increases hosting costs and risks server timeouts during simultaneous exam registrations.
- **Related Decisions**: DEC-010, DEC-012.

---

### DEC-010: High-Factual Density AEO & GEO Structured Schemas
- **Status**: CONFIRMED
- **Area**: SEO / Indexing
- **Decision**: Platform exposes comprehensive JSON-LD schemas (`WebApplication`, `EducationalOrganization`, `Person`, `FAQPage`, `HowTo`) and standardized `/llms.txt` and `/llms-full.txt` files containing exact DGMS CMR 2017 regulatory parameters (Regulations 153, 154, 160, 129).
- **Why**: Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO) require high factual density and structured question-answer pairs so AI answer engines (Perplexity, SearchGPT, Gemini, ChatGPT) cite MinesQuiz as the definitive statutory simulator.
- **Problem Solved**: Maximizes search visibility and AI retrieval without paid advertising.
- **Alternatives Considered**: Relying solely on basic HTML meta descriptions.
- **Why Alternatives Were Rejected**: Modern AI search engines ignore vague marketing copy in favor of authoritative structured knowledge graphs and regulatory citations.
- **Constraints**: Author persona (Subham Khandual) and DGMS citations must remain consistent across schemas and files.
- **Impact**: `apps/web/src/components/seo/JsonLd.tsx`, `apps/web/public/llms.txt`, `apps/web/public/llms-full.txt`, `apps/web/public/robots.txt`.
- **Evidence**: `apps/web/src/components/seo/JsonLd.tsx` lines 10-145, `apps/web/public/llms.txt` lines 1-42, `apps/web/public/robots.txt` lines 20-58.
- **Change Risk**: Deleting schemas drops AI search engine authority and factual citation rankings.
- **Related Decisions**: DEC-004.

---

### DEC-011: Mixed Attempt ID Support in Violation Logging
- **Status**: CONFIRMED
- **Area**: Database / Backend
- **Decision**: In `ViolationLogSchema`, `attemptId` is typed as `Schema.Types.Mixed`, and `proctorService.ts` explicitly checks `mongoose.Types.ObjectId.isValid` before querying `AttemptModel.findById`.
- **Why**: Candidate attempts generated client-side for immediate start use string identifiers (`attempt-xyz`), while database-persisted attempts use MongoDB 24-character hex `ObjectId`s.
- **Problem Solved**: Prevents Mongoose CastError exceptions and 400 Bad Request HTTP errors when logging proctoring violations.
- **Alternatives Considered**: Strictly enforcing MongoDB `ObjectId` across all clients.
- **Why Alternatives Were Rejected**: Broke offline session recovery and prevented instant exam start prior to round-trip server creation.
- **Constraints**: Telemetry queries must handle both string and ObjectId lookups gracefully.
- **Impact**: `apps/server/src/models/ViolationLog.ts`, `apps/server/src/services/proctorService.ts`.
- **Evidence**: `apps/server/src/models/ViolationLog.ts` line 20, `apps/server/src/services/proctorService.ts` line 26.
- **Change Risk**: Re-typing `attemptId` strictly as `ObjectId` breaks violation logging for client-initialized sessions.
- **Related Decisions**: DEC-002, DEC-012.

---

### DEC-012: Client Session Auto-Recovery & Routing Hydration
- **Status**: CONFIRMED
- **Area**: State Management
- **Decision**: `ExamRoom.tsx` synchronizes active examination state with `sessionStorage.getItem('mines_active_quiz_session')`. If empty on initial mount, it extracts route parameters (`quiz-min-*-*`) and candidate credentials to auto-hydrate an active session seamlessly.
- **Why**: Candidate internet disconnects, accidental page reloads, or Cloudflare Worker route redirections must not wipe candidate progress or answered questions.
- **Problem Solved**: Zero data loss and resilient recovery from accidental browser refresh or tab restore.
- **Alternatives Considered**: Storing in-progress answers on the backend via synchronous HTTP requests per question click.
- **Why Alternatives Were Rejected**: High network latency on remote mine site connections caused button tap lags and request queue timeouts.
- **Constraints**: Local session cache must be purged or marked finished upon formal submission.
- **Impact**: `apps/web/src/features/exam/ExamRoom.tsx`, `apps/web/src/app/candidate/page.tsx`.
- **Evidence**: `apps/web/src/features/exam/ExamRoom.tsx` lines 70-128.
- **Change Risk**: Removing auto-recovery causes candidate exams to fail on accidental F5 or route changes.
- **Related Decisions**: DEC-001, DEC-003, DEC-009.

---

### DEC-013: Firebase Auth Guard with Role-Based Verification
- **Status**: CONFIRMED
- **Area**: Authentication
- **Decision**: User authentication uses Firebase Authentication on the client, and Express API server validates Firebase JWT Bearer tokens using Firebase Admin SDK. Custom user claims determine role permissions (`candidate`, `invigilator`, `admin`).
- **Why**: Offloads secure credential storage, OAuth identity providers, and token refresh logic to Firebase while retaining strict role-based access control (RBAC) in server middleware.
- **Problem Solved**: Secure authentication without managing custom user password tables, cryptographic salting, or token expiry infrastructure.
- **Alternatives Considered**: Rolling custom JWT auth with bcrypt from scratch.
- **Why Alternatives Were Rejected**: Increased security surface area, complex OAuth social login integration, and risk of token replay vulnerabilities.
- **Constraints**: Server requires valid Firebase service account credentials in environment configuration.
- **Impact**: `apps/server/src/middleware/auth.ts`, `security.md`.
- **Evidence**: `security.md` lines 15-16, `architecture.md` line 28.
- **Change Risk**: Bypassing Firebase Admin verification exposes private student records and attempt scores to unauthenticated endpoints.
- **Related Decisions**: DEC-003.

---

### DEC-014: Ambient Audio Noise Level Detection & Cooldown
- **Status**: CONFIRMED
- **Area**: Audio Proctoring
- **Decision**: Web Audio API root-mean-square (RMS) energy analyzer runs in `CBTProctorWidget`, flagging ambient sound above 70 dB. Warnings are throttled using a 5-second violation cooldown ref.
- **Why**: High ambient noise indicates either a noisy testing environment, unauthorized whisper coaching, or secondary conversations during the examination.
- **Problem Solved**: Automatically flags audio cheating without overwhelming the candidate with alert banners for brief keyboard clacks or coughs.
- **Alternatives Considered**: Continuous server audio transcription via speech-to-text models.
- **Why Alternatives Were Rejected**: Extreme cloud processing costs and network latency for continuous microphone streaming.
- **Constraints**: Requires candidate microphone permission at session start.
- **Impact**: `apps/web/src/hooks/useNoiseDetector.ts`, `apps/web/src/features/exam/components/CBTProctorWidget.tsx`.
- **Evidence**: `apps/web/src/hooks/useNoiseDetector.ts` lines 25-85, `apps/web/src/features/exam/components/CBTProctorWidget.tsx` lines 54-61.
- **Change Risk**: Removing the cooldown ref causes alert floods that freeze the candidate UI; removing the hook allows unauthorized room coaching.
- **Related Decisions**: DEC-002, DEC-005.

---

## 5. Decision Dependency Analysis

Important relationships between established decisions:
- **DEC-002 (Local Edge AI)** directly enables **DEC-005 (Stable Ref Hardware)** and **DEC-011 (Mixed Attempt IDs)**. Changing the biometric processing model impacts how streams and violation logs are structured.
- **DEC-001 (Zero-Knowledge Question Delivery)** relies on **DEC-003 (Single Attempt Policy)** to prevent candidates from re-attempting papers after discovering scoring keys.
- **DEC-006 (Dual-Viewport Ergonomics)** depends on **DEC-005 (Hardware Lifecycle)**: mobile reordering must ensure only a single video element mounts to prevent camera locks.
- **DEC-009 (Static Site Generation)** depends on **DEC-012 (Session Auto-Recovery)** to hydrate candidate attempts client-side without relying on dynamic SSR cookies.
- **DEC-010 (Structured AEO/GEO Schemas)** reflects the exact statutory parameters enforced in **DEC-004 (DGMS Zero Negative Marking)**.

---

## 6. Change Protocol for Future AI Agents

Any future AI agent or engineer planning an architectural change must follow this sequence:

### Before changing an established decision:
1. Locate the relevant decision in this document by ID (e.g. `DEC-001`).
2. Read the full rationale, problem solved, constraints, and change risks.
3. Identify all dependent decisions listed in Section 5.
4. Verify why the current implementation cannot support the requirement.
5. Formulate the proposed architectural replacement and identify migration risks.
6. **Stop and ask for explicit human approval before modifying code.**

### After human approval:
1. Update the code strictly according to the approved modification.
2. Mark the previous decision in this file as `SUPERSEDED by DEC-XYZ`.
3. Add the new decision with full rationale and repository evidence.
4. Run validation: `pnpm --filter @mines-quiz/server test` and `pnpm --filter @mines-quiz/web run build` (Exit Code 0).
5. Verify zero em-dash compliance per Senior Developer Protocol.

---

## 7. Contradictions & Audit Observations (For Human Review)

| Observation ID | Topic | Documentation vs Implementation Finding | Status | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **OBS-001** | Encrypted Face Snapshots | `security.md` (line 18) states "Face snapshots stored encrypted with automatic TTL expiration policies". Currently, violation screenshots are captured as base64 data URLs on the client and passed in violation telemetry. | INFERRED - NOT CONFIRMED | Human review: Confirm whether cloud S3/GCS bucket with AWS KMS encryption and S3 Lifecycle TTL is planned for enterprise tier. |
| **OBS-002** | Legacy Seed Script Cleanup | An unused MongoDB seed script (`seedMiningQuestions.ts`) was deleted during monorepo cleanup in favor of static typed statutory datasets in `apps/web/src/data/miningQuestions.ts`. | OUTDATED | Documented and resolved. |
