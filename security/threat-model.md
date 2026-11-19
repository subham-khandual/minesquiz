# MinesQuiz Threat Model

## 1. Overview and Objective
This document defines the formal threat model for the MinesQuiz AI-proctored statutory examination platform. It establishes the asset inventory, trust boundaries, threat actors, attack vectors, risk scoring, and existing mitigations, alongside identified architectural gaps.

---

## 2. Protected Assets

| Asset Category | Description | Sensitivity | Impact If Compromised |
| :--- | :--- | :--- | :--- |
| **Statutory Answer Keys** | Master correct option choices (`correctOptionIds`) and explanations for DGMS Coal Mines Regulations 2017 exam papers. | Critical | Total loss of examination authenticity and paper leakage. |
| **Candidate Scores and Certificates** | Official passing marks, percentile rankings, and DGMS statutory completion records. | Critical | Fraudulent qualification of statutory mining officials. |
| **Candidate Identity and PII** | Candidate full names, verified email addresses, phone numbers, and roll numbers. | High | Privacy violation under Indian Digital Personal Data Protection Act. |
| **Biometric Telemetry and Face Captures** | Local facial landmark coordinates, gaze orientation logs, and violation snapshot images. | High | Biometric data leakage and candidate impersonation risks. |
| **Administrative Credentials** | Admin login tokens, OTP secrets, and privileged session cookies. | Critical | Unauthorized modification of question banks and candidate attempts. |
| **Database and Infrastructure Secrets** | MongoDB connection strings, Firebase Admin service accounts, and Cloudflare tokens. | Critical | Full platform compromise and unauthorized database exfiltration. |

---

## 3. Trust Boundaries

```
[Untrusted: Public Web / Candidate Browser]
       │
═══════╪═══════════════════════════════════════════════════════════ Trust Boundary 1: Client vs Edge
       │ HTTPS / Cloudflare Edge (WAF, SSL Termination, Static Assets)
       ▼
[Semi-Trusted: Cloudflare Worker / Next.js Static Export]
       │
═══════╪═══════════════════════════════════════════════════════════ Trust Boundary 2: Web to Node API
       │ REST API / Bearer Token over TLS 1.3 (Port 5050)
       ▼
[Trusted: Express Backend API Server]
       │
═══════╪═══════════════════════════════════════════════════════════ Trust Boundary 3: Internal Perimeter
       │ Mongoose TLS Connection
       ▼
[Highly Trusted: MongoDB Atlas Database Cluster]
```

- **Trust Boundary 1 (Client vs Edge)**: Candidate browsers, hardware webcams, and mobile devices operate entirely in an untrusted execution environment.
- **Trust Boundary 2 (Web to Node API)**: Client requests crossing into the Express API layer must be treated as untrusted until validated by rate limiting, Zod schema validation, and Firebase JWT guards.
- **Trust Boundary 3 (Internal Perimeter)**: Communication between the Express application server and MongoDB Atlas, gated by strict IP allowlists and encrypted connection strings.

---

## 4. Threat Actors

| Actor Profile | Motivation | Capabilities | Target Vectors |
| :--- | :--- | :--- | :--- |
| **Dishonest Candidate** | Obtain statutory certification without studying; pass exam at all costs. | Browser DevTools, secondary monitors, virtual webcams (OBS), whisper coaching. | Client memory inspection, tab switching, proxy attendance, replay attacks. |
| **External Attacker / Script Kiddie** | Platform disruption, vandalism, or automated resource exhaustion. | Automated vulnerability scanners, DDoS tools, NoSQL injection scripts. | Public endpoints (`/api/auth/*`), brute-forcing OTP endpoints, DoS floods. |
| **Malicious Insider / Compromised Admin** | Illegitimate credential issuance or altering test scores. | Access to admin panel, privileged credentials. | Score tampering, database manipulation, manual attempt resets. |

---

## 5. Threat Matrix and Attack Scenarios (STRIDE Analysis)

| Threat ID | STRIDE Category | Attack Scenario | Likelihood | Impact | Severity | Existing Mitigations | Missing Mitigations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-01** | Information Disclosure | Candidate opens DevTools to extract answer keys from network responses or React state. | High | Critical | **High** | DEC-001: Live questions strictly strip `correctOptionIds` and explanations in `questionSampling.ts`. | Server-side cryptographic signing of question chunks. |
| **T-02** | Tampering | Candidate injects virtual webcam driver (OBS, ManyCam) playing pre-recorded video loop. | Medium | High | **High** | `useAntiCheat.ts` driver blacklisting checks video track device labels for virtual keywords. | Server-side liveness challenge (e.g. random eye blink prompt). |
| **T-03** | Repudiation | Candidate claims exam disconnected due to technical glitch after failing. | High | Medium | **Medium** | DEC-012: `sessionStorage` automatic state hydration preserves timer and answers across reloads. | Comprehensive client-side device diagnostic telemetry log before exam launch. |
| **T-04** | Elevation of Privilege | Attacker accesses `/admin` candidate management without valid admin role. | Low | Critical | **High** | Firebase Admin SDK verifies JWT custom claims (`role === 'admin'`) in server auth middleware. | Multi-factor hardware security key (FIDO2/WebAuthn) for admin command center. |
| **T-05** | Denial of Service | Attacker floods OTP request endpoint with automated mailer requests. | High | Medium | **Medium** | Express rate-limiter: 10 requests per 5 minutes on authentication endpoints. | Cloudflare Turnstile or CAPTCHA on initial OTP dispatch button. |
| **T-06** | Spoofing | Third-party proxy sits in front of camera while candidate sits out of frame. | Medium | Critical | **High** | MediaPipe FaceMesh tracks face presence, pitch/yaw rotation (>35 degrees), and multiple face count. | Periodic identity re-verification against registered photo ID. |
| **T-07** | Tampering | Candidate clears `localStorage` to bypass single-attempt lock and retake exam paper. | High | High | **High** | DEC-003: Dual-layer persistence (`localStorage` + `SameSite=Strict` secure cookie + backend attempt record). | Backend attempt record acts as primary authoritative lock. |
