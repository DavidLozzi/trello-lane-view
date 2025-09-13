### Trello Lane View – Enterprise Security Review

Version: 2025-09-13

This report assesses the React/TypeScript application for enterprise deployment readiness. It includes security vulnerabilities, coding anti-patterns, refactoring opportunities, deployment hardening guidance, and a phased remediation plan. Findings reference exact files and line ranges for verification.

## Security vulnerabilities

Severity definitions: Critical → High → Medium → Low

- **Critical: Long‑lived OAuth token stored in localStorage (XSS exfiltration risk)**
  - References:
    - `src/pages/Index.tsx` L51, L103–L105, L119–L121
    - `src/components/BoardSelector.tsx` L94–L96
    - `src/components/SwimlaneView.tsx` L552–L554
    - Token lifetime set to never: `src/components/TrelloAuth.tsx` L42, and manual flow link L139
  - Risk/impact: Any XSS (including dependency or CDN compromise) can read `localStorage` and exfiltrate Trello tokens. Because tokens are configured as non‑expiring, compromise grants persistent access to boards and cards. Breach of project data, potential regulatory exposure, reputational damage.
  - Remediation:
    - Do not persist access tokens in `localStorage` or `sessionStorage`. Hold tokens only in memory, or move auth server‑side and store session in HttpOnly, `SameSite=Strict` cookies.
    - Use short‑lived tokens and refresh flows where possible. For Trello, prefer backend OAuth with token storage server‑side and a reverse proxy API.
    - If remaining client‑side, gate the app with a strict CSP and remove all unsafe inline/eval sources.

- **High: Missing Content Security Policy (CSP) and security headers**
  - References:
    - `index.html` L1–L24 (no CSP meta or nonce; no referrer policy)
  - Risk/impact: Increases blast radius of any DOM injection, enabling token theft from `localStorage`, clickjacking, and data exfiltration. Lacks framing and MIME protections.
  - Remediation:
    - Add strict CSP (example in Deployment hardening). Set HSTS, X‑Content‑Type‑Options, Referrer‑Policy, Permissions‑Policy, and frame protections.

- **High: OAuth flow lacks CSRF state/PKCE and accepts any token in URL hash**
  - References:
    - Accepts token from URL hash without validation: `src/pages/Index.tsx` L31–L45
    - No `state` parameter in Trello authorize URL: `src/components/TrelloAuth.tsx` L42 and manual link L139
  - Risk/impact: Login CSRF/fixed‑token injection—attacker can trick users into visiting an app URL containing an attacker’s token; app stores it and operates under attacker’s Trello access scope.
  - Remediation:
    - Include and validate a cryptographically random `state` parameter (store in memory or cookie, compare on return).
    - Prefer server‑side OAuth with PKCE and code exchange; never accept tokens directly in the browser.

- **Medium: Sensitive details logged to console (tokens, auth URLs, environment)**
  - References:
    - Token snippet logging: `src/pages/Index.tsx` L39
    - Verbose auth logs: `src/components/TrelloAuth.tsx` L39–L45
    - Verbose Trello API diagnostics: `src/components/BoardSelector.tsx` L20–L37, L41–L45
  - Risk/impact: Secrets/identifiers may end up in aggregated logs (e.g., browser console capture, support screenshots, RUM/Sentry breadcrumbs). Increases likelihood of credential leakage.
  - Remediation:
    - Remove token logging and minimize PII/secret logging. Use environment‑gated structured logging with redaction.

- **Medium: Reverse tabnabbing risk on external opens**
  - References:
    - `window.open` without `noopener`: `src/components/TrelloAuth.tsx` L44; `src/components/BoardSelector.tsx` L145–L146; `src/components/SwimlaneView.tsx` L542–L547; also anchor `target="_blank"` in manual flow `TrelloAuth.tsx` L139
  - Risk/impact: Opened pages can navigate `window.opener` to phishing pages.
  - Remediation:
    - Use `window.open(url, '_blank', 'noopener');` or for `<a>` add `rel="noopener noreferrer"`.

- **Low: Hard‑coded Trello API key in client**
  - References:
    - `src/components/TrelloAuth.tsx` L14
    - `src/components/OAuthCallback.tsx` L10
    - `src/pages/Index.tsx` L40
  - Risk/impact: Trello API keys are public identifiers, but distributing them in client complicates rotation and environment separation.
  - Remediation:
    - Move Trello integration behind a backend proxy that injects the key server‑side. At minimum, use environment variables per environment for build‑time injection.

## Coding anti‑patterns & bad practices

- **Verbose console logging in production paths**
  - References: see grep hits in `src/pages/Index.tsx` L24–L65; `src/components/TrelloAuth.tsx` L39–L45; `src/components/BoardSelector.tsx` L20–L45
  - Why it’s bad: Pollutes logs, risks leaking tokens/URLs, degrades performance.
  - Correction: Guard logs with `if (process.env.NODE_ENV !== 'production')` or use a logger that redacts and respects log levels.

- **Non‑strict TypeScript configuration**
  - References: `tsconfig.json` L12–L18 (e.g., `noImplicitAny=false`, `strictNullChecks=false`, `allowJs=true`)
  - Why it’s bad: Reduces type safety, increases runtime error risk in enterprise.
  - Correction: Enable strict mode (`strict: true`), set `noImplicitAny=true`, `strictNullChecks=true`, disable `allowJs` for TS codebases; gradually fix errors.

- **Use of `any` and weak typing in utilities**
  - References: `src/utils/createTemplate.ts` L52–L55 (`any[][]`) and several untyped values
  - Why it’s bad: Obscures contracts, brittle maintenance.
  - Correction: Define interfaces for table rows/cells; avoid `any`.

- **Duplicated literal storage keys and side‑effects sprinkled across components**
  - References: `src/pages/Index.tsx` L9; `src/components/BoardSelector.tsx` L94–L96; `src/components/SwimlaneView.tsx` L552–L554
  - Why it’s bad: Inconsistent storage behavior and hard‑to‑audit token lifecycle.
  - Correction: Centralize auth state and storage in a dedicated module or context; remove persistence of tokens altogether per remediation above.

- **Unused component import and dead code**
  - References: `src/App.tsx` L8 imports `OAuthCallback` but routes do not use it; a separate `src/components/OAuthCallback.tsx` exists with alternate flow.
  - Why it’s bad: Confuses auth flow and increases attack surface.
  - Correction: Remove unused component or wire it via a protected route with proper state/PKCE if migrating to server‑side OAuth.

## Refactoring opportunities (maintainability, scalability, performance)

- **Introduce a Trello API client layer and React Query hooks**
  - References: scattered `fetch` in `src/components/BoardSelector.tsx` L28–L41, `src/components/SwimlaneView.tsx` L75–L121, `src/pages/Index.tsx` L80–L92
  - Approach: Create `src/services/trelloClient.ts` encapsulating base URL, auth, retry/backoff, and error normalization. Provide `useBoards`, `useBoard`, `useCards`, `useLists` hooks using `@tanstack/react-query` with caching and background refresh.

- **Centralize authentication state and token handling**
  - References: token set/read in multiple components (see above).
  - Approach: Implement an `AuthProvider` that holds ephemeral auth in memory; if moving server‑side, replace with session cookies and a thin front‑end context reading user/session state.

- **Harden configuration via environment variables**
  - References: Hard‑coded API key (see above), auth URLs built inline `src/components/TrelloAuth.tsx` L42, L139.
  - Approach: Use `import.meta.env` with `.env` per environment; gate features (e.g., manual token mode) via flags.

- **Tighten TS settings and remove `any`**
  - References: `tsconfig.json` L12–L18; `src/utils/createTemplate.ts` L52–L55.
  - Approach: Enable strict TS and address surfaced issues iteratively.

- **Security‑aware UI adjustments**
  - References: external opens `window.open` occurrences.
  - Approach: Add `noopener` to `window.open` calls and `rel="noopener noreferrer"` to `<a target="_blank">`.

## Deployment hardening guidance

- **Content Security Policy (recommended starting point)**
  - Example (tune to build output and UI libraries):
    - `default-src 'self';`
    - `script-src 'self' 'nonce-<RANDOM>' 'strict-dynamic';` avoid `unsafe-inline`; inject nonce at build/serve
    - `style-src 'self' 'nonce-<RANDOM>'` (or `'unsafe-inline'` if required by Tailwind, prefer nonce)
    - `img-src 'self' data: https://*.trello.com https://*.atlassian.com;`
    - `font-src 'self' data:;`
    - `connect-src 'self' https://api.trello.com https://trello.com;`
    - `frame-ancestors 'none';`
    - `base-uri 'none'; object-src 'none'; form-action 'self';`
    - Add `report-uri` or `report-to` endpoint for CSP violation monitoring.

- **Essential headers**
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (tighten as needed)
  - `X-Frame-Options: DENY` (or `frame-ancestors` in CSP)

- **Auth and SSO readiness**
  - Move OAuth to backend with PKCE/code flow; store tokens server‑side; issue short‑lived session cookies (HttpOnly, `SameSite=Strict`, `Secure`).
  - For enterprise SSO, integrate IdP (SAML/OIDC) and bind to Trello via Atlassian access where applicable. Avoid storing Trello tokens in the browser.

- **Compliance and data governance**
  - Classify Trello data sensitivity; define retention for logs and exported PPTX artifacts.
  - Add audit logging around authentication, board access, and exports.

- **Monitoring and detection**
  - Instrument RUM and error monitoring (e.g., Sentry) with PII redaction; disable breadcrumb capture of URL fragments.
  - Enable CSP reporting, dependency scanning (SCA), and automated `npm audit`/`OSV` checks in CI.

## Concrete code references and suggested changes

- Replace local storage of credentials
  - `src/pages/Index.tsx` L100–L105: remove `localStorage.setItem(...)`; keep tokens in memory; if server‑side, stop exposing token to client entirely.
  - `src/pages/Index.tsx` L51; `src/components/BoardSelector.tsx` L94–L96; `src/components/SwimlaneView.tsx` L552–L554: remove reads/writes of `trello_credentials`.

- Add `noopener`/`noreferrer` where opening external URLs
  - `src/components/TrelloAuth.tsx` L44: `window.open(authUrl, '_blank', 'noopener');`
  - `src/components/BoardSelector.tsx` L145–L146: add third arg `'noopener'`.
  - `src/components/SwimlaneView.tsx` L542–L547: add `'noopener'`.
  - `src/components/TrelloAuth.tsx` L139: add `rel="noopener noreferrer"` to the anchor.

- Remove sensitive/verbose logs
  - `src/pages/Index.tsx` L24–L65, L39; `src/components/TrelloAuth.tsx` L39–L45; `src/components/BoardSelector.tsx` L20–L45: strip in production or gate behind debug flag; never log tokens.

- Strengthen TypeScript configuration
  - `tsconfig.json`: set `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, consider `"noUnusedLocals": true`, `"noUnusedParameters": true`, and disable `allowJs` in TS projects.

- Migrate to backend‑mediated OAuth
  - Replace client authorize URL building in `src/components/TrelloAuth.tsx` L37–L45, L139–L143 with a backend endpoint that initiates PKCE and returns a session to the SPA.

## Phased action plan (checklist)

### Phase 1 (Week 1–2): Critical and High

- [ ] Remove all storage of tokens in `localStorage` and keep in memory only.
- [ ] Implement `noopener`/`noreferrer` on all external opens.
- [ ] Remove sensitive logs; add level‑based logger with redaction.
- [ ] Add strict CSP and core security headers at the edge (CDN/web server).
- [ ] Add `state` parameter to auth flow and validate it on return (if temporarily keeping client flow).

### Phase 2 (Week 3–4): Backend OAuth and architecture hardening

- [ ] Introduce backend OAuth with PKCE/code flow and server‑side token storage.
- [ ] Expose a backend proxy for Trello API to the SPA; remove tokens from the browser entirely.
- [ ] Add session management with HttpOnly, `SameSite=Strict`, secure cookies.
- [ ] Centralize auth state in an `AuthProvider` and remove scattered storage code.

### Phase 3 (Week 5–6): Type safety, DX, and refactor

- [ ] Tighten TS config to strict and resolve surfaced type issues.
- [ ] Replace direct `fetch` calls with a typed `trelloClient` and React Query hooks.
- [ ] Replace `any` types in `src/utils/createTemplate.ts` with explicit interfaces.
- [ ] Remove dead code and unused imports (e.g., `OAuthCallback` route wiring or delete file).

### Phase 4 (Week 7–8): Compliance and monitoring

- [ ] Add CSP reporting endpoint and integrate with monitoring.
- [ ] Add RUM/error monitoring with PII redaction and disabled URL fragment capture.
- [ ] Establish dependency scanning in CI (SCA) and `npm audit` gates; rotate Trello API key per environment.
- [ ] Document data classification and retention for exports and logs.

## Appendix: Quick header/CSP examples

- Example Nginx headers:
  - `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`
  - `add_header X-Content-Type-Options nosniff;`
  - `add_header Referrer-Policy no-referrer;`
  - `add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";`
  - `add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'nonce-$csp_nonce' 'strict-dynamic'; style-src 'self' 'nonce-$csp_nonce'; img-src 'self' data: https://*.trello.com https://*.atlassian.com; connect-src 'self' https://api.trello.com https://trello.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";`

- Example Node/Express (helmet):
  - Use `helmet()` with custom `contentSecurityPolicy` matching the above and `referrerPolicy`, `hsts`, `frameguard`, `noSniff`.

---

Prepared for: Engineering and Security Reviewers
Scope: Repository at time of review; third‑party dependency vulns should be checked via CI (SCA) and `npm audit`.

