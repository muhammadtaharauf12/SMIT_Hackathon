# Nexora five-minute demo

## Starting state

Use a dedicated empty MongoDB database. Configure `.env`, run `npm run dev:all`, and confirm `http://localhost:5000/api/health` returns `{"status":"ok"}`. Do not use the MongoDB sample database.

## Demo flow

1. Create the Nexora workspace and first Admin account.
2. Sign in as Admin and show the live dashboard and organization rules.
3. Create an HR login, link the HR staff profile, then sign in as HR.
4. Register an employee and show the role-scoped employee directory.
5. Sign in as the employee, check in, submit leave, and show the personal balance/history.
6. Return to HR, approve the leave, and show the updated workflow state.
7. Show payroll draft/finalization and the employee-only finalized payslip route when the database has the required records.
8. Ask Nexora AI a workspace question and explain that the server executes permission-checked tools rather than exposing credentials to the browser.

## Recovery

- If the API shows a connection error, verify MongoDB Network Access and restart the API after changing `.env`.
- If the browser shows old routes, stop duplicate processes on ports 3000/5000 and run `npm run dev:all` once.
- If a live provider is unavailable, demonstrate the normal REST workflow and disclose that the AI call is not verified live.
