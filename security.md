# 🔒 Mines Quiz — Enterprise Security Policy & Guardrails

## 1. Security Overview

Mines Quiz enforces multiple concentric layers of security to safeguard examination integrity, personal data, and infrastructure stability.

## 2. Guardrails Matrix

| Layer | Guardrail | Implementation |
| :--- | :--- | :--- |
| **Network & Transport** | HTTPS / TLS 1.3 | Strict transport security enforced |
| **Headers & CSP** | Helmet & CSP | Custom script-src, frame-ancestors 'none', anti-clickjacking |
| **API Perimeter** | CORS | Restrictive whitelist configured in `security/cors-config.ts` |
| **Rate Limiting** | Express Rate Limit | 100 requests per 15 minutes for general endpoints, 10 per 5 min for auth/submit |
| **Authentication** | Firebase Admin SDK | Cryptographic validation of Firebase JWT tokens, role claims |
| **Injection Defense** | Zod + Mongo Sanitize | Strict runtime type validation + protection against `$gt`/`$ne` NoSQL injection |
| **Client-Side Anti-Cheat** | Fullscreen API & Page Visibility API | Detect tab changes, window minimization, blocked devtools |
| **Data Privacy** | Ephemeral Telemetry | Face snapshots stored encrypted with automatic TTL expiration policies |

