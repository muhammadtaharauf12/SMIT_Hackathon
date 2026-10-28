# Nexora

Nexora is a Next.js, Express, TypeScript and MongoDB human capital workspace for Admin, HR and Employee roles. It starts with an empty application database. The hackathon brief is in [docs/BRIEF.md](docs/BRIEF.md); [docs/PLAN.md](docs/PLAN.md) lists what is built and what remains unverified.

## Run locally

1. Use Node.js 24 and run `npm ci`.
2. Copy `.env.example` to `.env`. Set `MONGODB_URI` and `MONGODB_DB_NAME` to a **dedicated Nexora database**. Set a long random `JWT_SECRET`. Set `GEMINI_API_KEY` for live AI; keep the key on the server. `GEMINI_MODEL` defaults to `gemini-2.5-flash-lite` in the example.
3. Run `npm run dev:all`. The frontend starts at `http://localhost:3000`, and the API starts at `http://localhost:5000`. Check `http://localhost:5000/api/health` before creating a workspace. Restart the API after changing environment settings.
4. On an empty database, create the company and first Admin. Sign in as Admin, create an HR login and link it to an HR staff profile. HR can then create employees. Temporary-password users must change their password before using protected APIs.

`dev:server` watches TypeScript and restarts Node when compiled files change. If you already have another API process on port 5000, stop that process before starting the new one; otherwise the browser can still hit old routes. The frontend API base URL is `NEXT_PUBLIC_API_URL`, which must point to the deployed API in hosted environments. `CLIENT_ORIGIN` must include the frontend origin.

For deployment, build the frontend with `npm run build` and the API with `npm run build:server`. Start them with `npm run start` and `npm run start:server` respectively. The API build is emitted to the ignored `dist/server` directory; it is generated during deployment and is not committed.

## Checks

```bash
npm test
npm run lint
npm run build
```

The tests currently cover calculation and AI tool declarations/permissions. A production build does not validate MongoDB persistence, Gemini responses, browser flows or hosting.

The API requires a reachable MongoDB deployment at startup. If it cannot connect, check Atlas Network Access, VPN/firewall rules, and outbound port 27017 before testing protected flows.

## Current functionality

- One-time setup, JWT login, first-use password change, logout token revocation, Admin account controls and role-restricted routes.
- Organization settings, departments/designations, leave quotas and holidays; employee registration, search, paging and scoped editing.
- Server-stamped attendance, HR correction decisions, leave requests/balances/decisions, monthly payroll drafts, Admin finalization and employee finalized-only PDF payslips.
- Live dashboard summary, date and department analytics filters, announcements, recipient-scoped notifications, Admin audit feed and Gemini-backed assistant tools, summary and leave draft.

Leave quotas are tracked by calendar year. A request spanning New Year must be submitted as two requests, one per year.

## Known incomplete work

The project is **not yet verified as a complete hackathon submission**. Custom leave types, CSV import/export, full Employee 360, complete analytics formulas/trends, strict AI policy Q&A and complete before/after audit coverage remain. Setup, payroll and leave need transaction/race integration tests. Live MongoDB and Gemini user journeys, 375px browser verification, deployment and five-minute demo rehearsal have not been completed in the latest update. See [docs/PLAN.md](docs/PLAN.md) for the current checklist.

Keep `.env` out of Git. `.env.example` contains placeholders only. Do not use or reset MongoDB sample databases for this app.
