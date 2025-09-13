## Remediation & Hardening Plan (Live Status)

Tech notes
- This code set was created by an LLM
- No backend will be added; Trello stores everything

### Critical fixes
- Remove hard-coded API key → DONE. Uses `VITE_TRELLO_API_KEY` via `import.meta.env` in `src/config.ts`.
- Stop storing tokens in localStorage → IN PROGRESS. Introduced in-memory `AuthContext` (`src/context/AuthContext.tsx`); legacy localStorage cleared and no longer used in new flows.
- Fix OAuth flow → DONE. Added `state`/nonce via `sessionStorage`, validated in `OAuthCallback`; bounded 30-day expiration.
- Remove sensitive logging → IN PROGRESS. Removed/avoided logs in updated components.
- Add CSP and browser headers → IN PROGRESS. Added CSP and security meta tags to `index.html`.

### High priority
- Trello API client abstraction → DONE. `src/api/trelloClient.ts` with typed helpers, retries, central errors.
- Refactor authentication → IN PROGRESS. `AuthProvider` wraps app; components moved off localStorage.
- Consolidate data fetching with React Query → PENDING. Query client already wired; usage next.
- Strengthen TypeScript config → PENDING. Enabled `noImplicitAny` and `strictNullChecks` in `tsconfig.json`.
- Input validation & sanitization → PENDING.
- Fix reverse tabnabbing → DONE. All `window.open` use `noopener,noreferrer`.

### Medium priority
- Split large components → PENDING.
- Improve error handling → PENDING.
- Reduce excessive requests → PENDING.
- Introduce global state mgmt → DONE for auth via `AuthContext`.
- Secure build/deployment → PENDING.

### Low priority
- Performance → PENDING.
- CI/CD & supply chain → PENDING.
- Monitoring & compliance → PENDING.

## Setup
- Create `.env` with `VITE_TRELLO_API_KEY="your-key"`.
- Run: `npm i && npm run dev`.

## Final summary (updates as we progress)
- Environment-based API key, OAuth state validation, CSP meta, API client, and AuthContext implemented. Components refactored to remove hard-coded secrets and localStorage. Remaining: React Query integration, strict TS fixes, sanitization, splitting `SwimlaneView`, CI/CD, and policies.
