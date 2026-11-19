# MinesQuiz Secrets Management and Exposure Audit

## 1. Scope and Purpose
This document audits the handling, storage, exposure risks, and lifecycle of all secrets, credentials, API keys, and private tokens across the MinesQuiz repository.

---

## 2. Secrets Inventory and Expected Locations

| Secret Identifier | Expected Storage Location | Intended Usage | Access Scope | Sensitivity |
| :--- | :--- | :--- | :--- | :--- |
| **`MONGODB_URI`** | `apps/server/.env` | Connection string for MongoDB Atlas database cluster including credentials. | Server runtime only | Critical |
| **`FIREBASE_SERVICE_ACCOUNT`** | `apps/server/.env` | JSON credential payload for Firebase Admin SDK JWT token validation and custom claims. | Server runtime only | Critical |
| **`ADMIN_OTP_SECRET`** | `apps/server/.env` | Secret salt used by bcrypt to hash and verify 6-digit administrative one-time passwords. | Server runtime only | High |
| **`JWT_SECRET`** | `apps/server/.env` | Signing key for internal session tokens and invigilator dashboard access. | Server runtime only | High |
| **`NEXT_PUBLIC_API_URL`** | `apps/web/.env.local` | Public REST and WebSocket endpoint for client apiClient communication. | Client and Server (Public) | Low (Public) |
| **`NEXT_PUBLIC_FIREBASE_*`** | `apps/web/.env.local` | Firebase client config (API Key, Auth Domain, Project ID, Storage Bucket). | Client runtime (Public) | Low (Scoped) |

---

## 3. Environment and Configuration Handling

1. **Separation of Tiers**:
   - Client applications (`apps/web`) prefix publicly consumable environment variables with `NEXT_PUBLIC_`.
   - Backend applications (`apps/server`) load private keys strictly through `process.env` via dotenv without exposing them in client bundles.
2. **Git Exclusion Verification**:
   - `.gitignore` in repository root and app subdirectories explicitly ignores:
     - `.env`
     - `.env.local`
     - `.env.development.local`
     - `.env.test.local`
     - `.env.production.local`
   - Verified: No `.env` files containing live credentials are tracked in the Git repository tree.

---

## 4. Hardcoded Secrets Audit and Findings

| Finding ID | Location | Observation | Risk Assessment | Recommended Action |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | `apps/web/src/features/exam/ExamRoom.tsx`<br>`apps/web/src/app/candidate/page.tsx` | Hardcoded master administrative email address: `subhamkhandual215@gmail.com` used to exempt testing accounts from attempt lockouts. | Low to Medium. Does not expose private keys, but client-side email string matching can be spoofed in DevTools to bypass single-attempt restrictions. | Move testing email allowlist to server environment variable (`TESTING_ALLOWLIST_EMAILS`) and validate via authenticated Firebase UID. |
| **SEC-02** | `apps/server/src/config/` | Fallback port defaults (`PORT || 5050`) and local database URLs (`mongodb://localhost:27017/minesquiz`). | Negligible. Standard development fallback without production credentials. | Maintain strict production environment variable assertion on startup. |

---

## 5. Client-Side Exposure Risks

1. **Next.js Turbopack Bundle Scan**:
   - Analysis of production build chunks confirms that no server-side secrets (`FIREBASE_SERVICE_ACCOUNT`, `MONGODB_URI`, `JWT_SECRET`) are embedded in client bundles.
   - Only `NEXT_PUBLIC_API_URL` and standard client routing constants are present.
2. **Question Answer Leakage**:
   - Verified under DEC-001: Question sampling logic in `apps/web/src/lib/questionSampling.ts` dynamically removes `correctOptionIds` and `explanation` properties before rendering live quiz objects in candidate state.

---

## 6. Logging and Error Exposure Risks

1. **Production Error Sanitization**:
   - In production builds, Express error-handling middleware returns generic messages (`"Internal Server Error"`) to avoid leaking database query strings, stack traces, or schema models.
2. **Telemetry Payloads**:
   - Violation logging payloads dispatched to `/api/v1/proctor/violation` include base64-encoded snapshot thumbnails. Telemetry logs must sanitize snapshot URLs from standard terminal stdout logs to prevent terminal memory bloat.

---

## 7. Secret Rotation Protocol

| Secret Type | Recommended Rotation Frequency | Rotation Procedure | Immediate Trigger |
| :--- | :--- | :--- | :--- |
| **MongoDB Atlas Password** | Every 90 days | Create new database user in Atlas, update server environment variable, execute rolling server restart, revoke old user. | Suspected connection string leakage. |
| **Firebase Service Account** | Annually | Generate new private key in Firebase Console, update `FIREBASE_SERVICE_ACCOUNT`, decommission previous key. | Developer credential compromise. |
| **Admin OTP Salt** | Bi-annually | Update `ADMIN_OTP_SECRET` in environment variables and restart server processes. | Admin security audit alert. |
