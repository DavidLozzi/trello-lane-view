<<<<<<< Current (Your changes)
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/222b96fd-1289-40ba-b6d2-2834d68e5262

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/222b96fd-1289-40ba-b6d2-2834d68e5262) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/222b96fd-1289-40ba-b6d2-2834d68e5262) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
=======
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
>>>>>>> Incoming (Background Agent changes)
