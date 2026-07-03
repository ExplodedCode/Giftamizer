# Local Setup

## Pre-Requisites

-   Docker (on Windows: Docker Desktop with the WSL2 backend)
-   Node.js

Windows is fully supported without WSL or Git Bash - the backend ships a
`.ps1` equivalent of every `.sh` script, and this frontend only needs
`npm`/`node`, which already work natively on Windows.

## Architecture

The frontend (this repo) and backend run as two separate processes in local
dev:

-   **Backend** — the full Supabase stack (Postgres, Auth, REST, Storage,
    Realtime, Edge Functions) behind the Kong API gateway at
    `http://localhost:8000`.
-   **Frontend** — the CRA dev server with hot reloading at
    `http://localhost:3001`.

You open the app at `http://localhost:3001` and it talks to the backend
directly at `http://localhost:8000` (Kong's CORS plugin allows this
cross-origin call - no proxy needed). This is different from how production
is served (where a single domain fronts both), but it's simpler for local
dev and is the officially supported path from the backend's own local-dev
work - see its README for details.

## Setup Supabase Stack

Clone the [ExplodedCode/Giftamizer-Supabase](https://github.com/ExplodedCode/Giftamizer-Supabase.git) repo.

```bash
cp .env.example .env
./run.sh dev up
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
.\run.ps1 dev up
```

This starts the full backend on `http://localhost:8000` with the demo
`ANON_KEY`/`JWT_SECRET` already in `.env.example` — no key generation needed
for local dev. (Run `./utils/generate-keys.sh` / `.\utils\generate-keys.ps1`
instead if you want your own non-shared keys; if you do, update
`REACT_APP_SUPABASE_ANON_KEY` below to match.)

Auth emails (signup confirmation, password reset) are caught by Inbucket at
[http://localhost:9000](http://localhost:9000) instead of being sent for
real.

## Start Frontend

Clone the [ExplodedCode/Giftamizer](https://github.com/ExplodedCode/Giftamizer.git) repo.

```bash
npm install
cp .env.example .env
npm start
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`; `npm install`/`npm start` are identical.

The default `.env.example` already points `REACT_APP_SUPABASE_URL` at
`http://localhost:8000` and ships the matching demo `REACT_APP_SUPABASE_ANON_KEY` -
no changes needed if you used the backend's defaults above.

You can access Giftamizer at [http://localhost:3001](http://localhost:3001).

## Notes

-   Google/Facebook sign-in buttons are intentionally disabled unless the
    page is served from `giftamizer.com` (see `src/pages/SignIn.tsx`) - use
    email/password signup for local testing.
-   `REACT_APP_SUPABASE_URL` falls back to the production API
    (`https://gift-api.trowbridge.tech`) if unset, so an empty/missing
    `.env` won't break anything - it'll just talk to prod instead of your
    local backend.
