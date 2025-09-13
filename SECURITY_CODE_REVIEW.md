### Trello Lane View — Security & Code Quality Review

Last updated: 2025-09-13

This document summarizes security risks, coding anti-patterns, refactoring opportunities, and deployment hardening guidance for `trello-lane-view` prior to internal rollout.

## Executive summary

- Overall, this is a client-only React app that directly calls Trello’s REST API using a hard-coded API key and a user token acquired via an OAuth-like implicit flow. There is no backend.
- Primary risks are related to token handling (localStorage, unlimited lifetime tokens, console logging), lack of CSP and other browser security headers, and general absence of app hardening. These are fixable.
- Code quality is decent, but type safety has been relaxed, logging leaks exist, and API code is scattered and unabstracted. A small refactor would improve maintainability and reliability.

## High-risk security findings (action immediately)

1) Hard-coded API key in the client
- Location: `src/components/TrelloAuth.tsx`, `src/components/OAuthCallback.tsx`, `src/pages/Index.tsx` (constant `TRELLO_API_KEY`)
- Impact: The Trello key is public at build-time. While Trello keys are not true secrets, shipping a hard-coded key encourages ungoverned reuse and cannot be rotated centrally.
- Remediation:
  - Move the key to environment configuration (e.g., `VITE_TRELLO_API_KEY`) and load via `import.meta.env`.
  - Prefer a minimal backend proxy that injects the key server-side and enforces origin checks and rate limits.

2) Long-lived tokens with localStorage persistence
- Location: `src/pages/Index.tsx` (stores `{ apiKey, token }` under `trello_credentials`), `src/components/BoardSelector.tsx`, `src/components/SwimlaneView.tsx` (reads/removes it)
- Impact: Tokens stored in `localStorage` are vulnerable to theft by XSS. Combined with `expiration=never`, compromise persists indefinitely.
- Remediation:
  - Change Trello `authorize` to a bounded lifetime (e.g., 1day/30days) instead of `expiration=never`.
  - Do NOT persist tokens long-term in `localStorage`. Prefer:
    - Memory-only storage; or
    - If adding a backend: use an HTTP-only, same-site cookie session after exchanging the Trello token server-side.
  - Provide an explicit “Sign out” that clears in-memory/session state.

3) Missing OAuth state/CSRF protection in the implicit flow
- Location: `src/components/TrelloAuth.tsx` (builds `authorize` URL without `state`), `src/pages/Index.tsx` (parses `#token`)
- Impact: No `state`/nonce means susceptibility to token substitution/CSRF-like attacks where an attacker could trick a user into using a token not intended for them.
- Remediation:
  - If remaining client-only: generate a random `state` in memory, include it in `authorize`, and validate it on return.
  - Prefer a lightweight backend to manage proper OAuth flow and state validation.

4) Sensitive data in logs
- Location: `src/pages/Index.tsx` (logs full URL, token substring), `src/components/BoardSelector.tsx` (logs API key and token slices), `src/components/TrelloAuth.tsx` (logs OAuth URL and environment)
- Impact: Browser console logs get captured by monitoring tools and can leak credentials.
- Remediation: Remove all logs of tokens, URLs with fragments, keys, and API responses. Keep only anonymized, non-sensitive diagnostics guarded by `NODE_ENV === 'development'`.

5) No browser security headers / CSP
- Location: `index.html` and deployment config
- Impact: Increases exposure to XSS, clickjacking, and data exfiltration.
- Remediation (via hosting/CDN/proxy headers):
  - Content-Security-Policy (CSP) tuned to allow Trello API, required fonts, and app origin.
  - X-Frame-Options or `frame-ancestors` in CSP; Referrer-Policy; Permissions-Policy; Strict-Transport-Security (HSTS); X-Content-Type-Options; X-XSS-Protection (legacy) where appropriate.

6) Reverse tabnabbing risk on external windows
- Location: multiple `window.open(url, '_blank')`
- Impact: Without `noopener`/`noreferrer`, the opened page can control the opener.
- Remediation: Use `window.open(url, '_blank', 'noopener,noreferrer')` or set `opener` to `null` immediately.

## Medium-risk security findings

7) Direct client-to-Trello API calls with user tokens
- Location: `BoardSelector`, `SwimlaneView`, `Index`
- Impact: Tokens visible in browser network inspector, subject to client-side leakage and CORS nuances. No central governance or usage metrics.
- Remediation: Introduce a small backend proxy (serverless ok) that:
  - Exchanges/validates tokens, stores short-lived session, and performs Trello calls server-to-server.
  - Enforces origin allowlist, rate limiting, and logs access centrally.

8) Potential image URL surface from board preferences
- Location: `SwimlaneView` uses `board.prefs.background` in `backgroundImage`
- Impact: Trello-controlled URLs are usually safe, but ensure only trusted domains are allowed to avoid tracking pixels or weird content.
- Remediation: Validate/allowlist backgrounds to Trello domains only when rendering.

## Low-risk findings / hardening

9) Dev server exposed on all interfaces
- Location: `vite.config.ts` (`server.host: '::'`)
- Impact: Fine for development; ensure not used in production hosting.
- Remediation: Keep production as static build behind secure hosting; avoid exposing dev server externally.

10) Default Lovable branding and metadata
- Location: `index.html`, `README.md`
- Impact: Minor information disclosure; signals generator stack.
- Remediation: Replace with company metadata and remove vendor references where unnecessary.

## Coding anti-patterns and quality issues

- Relaxed type safety
  - Location: `tsconfig.app.json` and `tsconfig.json` disable `strict`, `noImplicitAny`, etc.
  - Improvement: Enable `strict: true` and incrementally fix types to catch bugs earlier.

- Scattered API code and duplicate logic
  - Calls to Trello are hand-built with string concatenation and repeated across components.
  - Improvement: Centralize in a typed `trelloClient` module; use `URL`/`URLSearchParams`; handle errors consistently; consider `@tanstack/react-query` for fetching/caching/retries (already installed).

- Excessive console logging in production
  - Noise and potential data leakage. Remove or guard with `process.env.NODE_ENV !== 'production'`.

- Unbounded parallel fetches for card actions
  - Location: `SwimlaneView` fetches actions per card which can spike requests on large boards.
  - Improvement: Add concurrency control, batching, or reduce to necessary data only; cache results.

- UI opens external links without security flags
  - Use `noopener,noreferrer` for safety.

- Dead/auxiliary code
  - `src/utils/createTemplate.ts` is a convenience script not used by the app. Consider removing or clearly separating tooling-only code.

## Refactoring opportunities

1) Introduce a Trello API client abstraction
- `src/api/trelloClient.ts` (new):
  - Accepts key/token (or uses backend session).
  - Helpers: `getBoards`, `getBoard`, `getLists`, `getCards`, `getCardActions` with strong TypeScript types.
  - Central error handling, retries (exponential backoff), and minimal logging.

2) Use React Query for all data fetching
- Convert `useEffect` + `fetch` to `useQuery`/`useMutation` for caching, status, and retries. You already include `QueryClientProvider` in `App.tsx`.

3) Strong typing and config hygiene
- Turn on TS `strict` and fix surfaced issues.
- Add `src/config.ts` to read `VITE_TRELLO_API_KEY` and other runtime flags.

4) Auth flow cleanup
- If staying client-only:
  - Add `state`/nonce generation and validation.
  - Keep tokens in memory; provide re-auth when tab reloads.
  - Reduce token lifetime by changing `expiration`.
- If adding a backend:
  - Exchange Trello token server-side, store session in HTTP-only cookie, set CSRF token, and proxy API calls.

5) Security utilities
- Add a small `openExternal(url: string)` utility that always uses `noopener,noreferrer`.
- Add a guard to sanitize/allowlist external image URLs.

6) Remove sensitive logging
- Purge logs exposing URLs, tokens, API responses; keep only minimal, non-sensitive diagnostics.

## Deployment hardening checklist

- Browser security headers (via CDN/reverse proxy):
  - Content-Security-Policy tailored to your asset and API endpoints (script-src/style-src/img-src/connect-src; restrict to self and Trello as needed).
  - Referrer-Policy: `no-referrer` or `strict-origin-when-cross-origin`.
  - Permissions-Policy: disable unused features (camera, microphone, geolocation, etc.).
  - X-Frame-Options: `DENY` (or CSP `frame-ancestors 'none'`).
  - X-Content-Type-Options: `nosniff`.
  - Strict-Transport-Security: enable HSTS with preload on corporate domains.

- Supply chain/security scanning:
  - Enable Dependabot (or Renovate), `npm audit --production`, and Snyk/GitHub Advanced Security.
  - Pin/lock dependency versions and use a private registry mirror if required by corporate policy.

- Build pipeline:
  - CI: `npm ci && npm run lint && tsc --noEmit && npm run build`.
  - Enforce no console warnings/errors and no TODOs in production.

- Observability:
  - If adding telemetry, scrub PII and token-like values. Avoid logging URLs with fragments.

- Access control:
  - If internal-only, gate access behind corporate SSO/IDP and/or internal network/VPN.

## Quick remediation plan (phased)

Phase 1 (client-only, minimal changes):
- Remove sensitive logging everywhere.
- Add `openExternal` helper with `noopener,noreferrer`; update all external opens.
- Switch `expiration=never` to a bounded value.
- Move API key to `VITE_TRELLO_API_KEY` and use `import.meta.env`.
- Add CSP and other headers at the edge.

Phase 2 (robust & enterprise-ready):
- Add a thin backend proxy with session cookies and CSRF protection; stop persisting tokens in `localStorage`.
- Migrate fetches to backend; add rate limits and audit logs.
- Turn on TS `strict` and refactor API calls into a typed client with React Query.

## Notable code references

- Hard-coded key and implicit flow:
  - `src/components/TrelloAuth.tsx`
  - `src/components/OAuthCallback.tsx`
  - `src/pages/Index.tsx`

- Token persistence and logging:
  - `src/pages/Index.tsx` (stores `trello_credentials`, logs URL/token)
  - `src/components/BoardSelector.tsx` (logs token slice)

- Unbounded per-card actions fetch:
  - `src/components/SwimlaneView.tsx` (N additional requests per card)

## Open questions / decisions needed

- Do you want a backend proxy to fully remove tokens from the browser and enable enterprise controls (SSO, rate limiting, audit)?
- What maximum token lifetime is acceptable (e.g., 1 day, 30 days)?
- Should we gate the app behind corporate SSO even if read-only to Trello?
- Which hosting/CDN will serve this app so we can declare and enforce CSP and security headers?

## Appendix — Example CSP (to adapt)

Note: tailor domains to your hosting and Trello endpoints; test in report-only before enforcing.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://*.trello.com https://*.trello.services;
  connect-src 'self' https://api.trello.com;
  font-src 'self' data:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

