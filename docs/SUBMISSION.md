# Nexora submission readiness

This checklist records what is ready for handoff and what still needs live verification. It does not claim a hosted deployment or LMS submission has been completed.

| Area | Status | Evidence / location |
|---|---|---|
| First-run Admin workspace | Implemented; live fresh-database run remains | Setup route and workspace UI |
| JWT authentication and role restrictions | Implemented; full Admin/HR/Employee journey remains | `server/routes/auth.ts`, `server/middleware/auth.ts` |
| Organization, employees, attendance and leave | Implemented; live persistence and race checks remain | `server/routes/organization.ts`, `server/routes/employees.ts`, `server/routes/attendance.ts`, `server/routes/leave.ts` |
| Payroll and payslip access | Implemented; live finalization/download journey remains | `server/routes/payroll.ts`, `server/utils/payslip-pdf.ts` |
| Analytics, announcements, notifications and audit | Implemented; live role-scoped verification remains | `server/routes/analytics.ts`, `server/routes/announcements.ts`, `server/routes/notifications.ts`, `server/routes/audit.ts` |
| Gemini assistant | Implemented; live provider and policy-output verification remains | `server/routes/ai.ts`, `.env.example` |
| Clean repository | Verified | `.gitignore` excludes `.env`, `dist/`, `.next/`, dependencies and logs |
| Reproducible deployment commands | Verified locally | `README.md`, `package.json` |
| Hosted frontend/API links | Not submitted | Requires an authorized hosting destination and MongoDB/Gemini environment settings |
| LMS submission | Not submitted | Requires the participant to submit the verified repository and live links |

## Required environment

Configure `MONGODB_URI`, `MONGODB_DB_NAME`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NEXT_PUBLIC_API_URL`, and the server-side Gemini key/model in the hosting environment. Never commit `.env` or real credentials.

## Verification commands

```bash
npm ci
npm test
npm run lint
npm run build
npm run build:server
```
