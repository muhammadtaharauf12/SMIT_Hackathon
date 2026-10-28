# HCM Lite: official requirements review

Reviewed 24 October 2026. Source: `C:/Users/MECHREVO/OneDrive - Dawood University of Engineering Technology/Downloads/Saylani_Hackathon_HCM_Lite_Brief.pdf`.
All seven physical pages were extracted and visually inspected: cover plus printed pages 1-6. References below use printed page numbers and section numbers. Cover mockup numbers are illustrations, not permitted seed data.

## Confirmed event requirements

- Build HCM Lite, a web-based, AI-assisted Human Capital Management system for Admin, HR and Employee. Nine modules, 25 listed functions. [p1, sections 1; p5, section 8]
- Event: 24 October 2026, Zaitoon Ashraf IT Park. Team description: four people, two backend and two frontend. Actual participant/team allocation is not established here. [cover; p1]
- Any language, framework and database allowed. Existing Next.js/React, Express, TypeScript, MongoDB/Mongoose stack is eligible. [p1; p4, section 6]
- Start empty. No preloaded/dummy employees, activity, payroll or dashboard statistics. Admin sets up the company; HR and employees create the data through use. Judges repeat this from a fresh installation. [p1; p4, Figure 4; p6]
- Required responsive web app; system overview specifies 375px+. Native mobile app and camera attendance are optional. [p1; p3, section 5; p4, Figure 2]
- Five-minute live demo; README that a judge can run in under ten minutes. [p1; p6, section 9]
- Submission: every student uses their own Saylani LMS portal, `https://lms.saylaniit.com/`, and supplies a Git repository link and hosted/live app link. Repository public or shared with judges. Any free frontend/backend hosting allowed. Live app starts at first-run setup. Optional mobile APK/Expo link in README. [p6]
- README must explain stack, run instructions, first Admin creation, AI key configuration, completed and incomplete scope. Commit placeholder `.env.example` only; put actual secrets in hosting environment settings. [p6]
- Deadline time, submission cutoff/timezone, team enforcement and per-bonus scoring are NOT specified. Asia/Karachi is the participant's local timezone, not a published deadline rule.

## Requirement and permission matrix

Priority: P0 = build first for the main demo; P1 = required supporting checklist coverage; P1? = listed but conflicting optional wording. These are implementation priorities, not event scoring. All paths below are proposed, not implemented. A = Admin, H = HR, E = Employee. All rows currently unimplemented/unverified.

| # / source | Requirement and permissions | Priority | Observable acceptance check | Proposed implementation location | Status |
|---|---|---|---|---|---|
| 01 p5; p2 s2 | First-run company + Admin creation: A | P0 | Empty install shows setup; setup works once; concurrent/repeated bootstrap cannot create another Admin | `app/setup/`, `server/modules/setup/` | Implemented; live status verified |
| 02 p5; p2 s2-3 | JWT login/logout/password change; own role menus/dashboards: A/H/E | P0 | Each role signs in; wrong credentials fail; temporary-password user must change it; role/scope denial occurs on server | `app/login/`, `server/modules/auth/` | Core implemented; full role journey pending |
| 03 p5; p2 s3 | Company hours, grace, weekends, office coordinates/radius: A manage; H view; E none | P0 | Defaults stored; edits affect new records only; H/E cannot mutate | `app/settings/`, `server/modules/organization/` | Core settings implemented; browser journey pending |
| 04 p5; p2 s3 | Departments, designations, leave types/annual quotas, public holidays: A manage; H view | P0 | Setup entries persist; invalid references rejected; only A writes | Organization module | Not built |
| 05 p5; p2 s2 | Create HR; deactivate/reset any login: A only | P0 | A creates H; H cannot create A; disabled/reset credentials handled consistently | `app/users/`, auth module | Create-HR slice implemented; account administration pending |
| 06 p5; p2 s3 | Employee registration creates login and salary/job details: H manage; A view; E own phone/address only | P0 | Registration atomically creates linked employee/login; duplicates fail; first password change enforced; E cannot edit salary/role | `app/employees/`, `server/modules/employees/` | Implemented; live role journey pending |
| 07 p5; p2 s3 | Searchable/filterable directory and Employee 360: A/H all; E own | P1 | Server paging/search/filtering; foreign employee ID never bypasses self scope | Employees module | Directory/search implemented; 360/edit pending |
| 08 p5; p2 s2-3 | CSV import dry run + export: H only; prose calls optional | P1? | Dry run returns row/field/reason, writes nothing; validates required fields, unique code/email, valid email, known dept, ISO date, salary > 0 | Employees import/export services | Not built |
| 09 p5; p2 s3 | Web check-in/out: H/E own; A none | P0 | Server time; second daily check-in 409; checkout updates same daily record | `app/attendance/`, `server/modules/attendance/` | Employee check-in/out and HR/Admin board implemented |
| 10 p5; p2 s3 | Attendance calendar/board: A/H all; E own | P0 | Calendar and board agree; missing checkout/late/absence/half-day rules represented | Attendance module | Daily board implemented; calendar and absence rules pending |
| 11 p5; p2 s2 | Attendance corrections: E requests; H approves/rejects; A view | P1 | Reason required; employee cannot edit attendance directly; decision updates data and audit | Attendance correction service | Not built |
| 12 p5; p2 s3 | Apply/cancel leave, balance/history: H/E own; A none | P0 | Working-day count; overlap/exceeded balance 422; own cancellation updates balance correctly | `app/leave/`, `server/modules/leave/` | Employee request, balance, history, and cancellation implemented |
| 13 p5; p2 s2 | Leave decision + comment: H approve/reject; A view; E none | P0 | Only H decides; comment saved; balance/notification update; concurrent approvals cannot overspend quota | Leave decisions | HR inbox and approve/reject implemented; notifications pending |
| 14 p5; p2 s3 | Salary structure: H manage; A view; E none | P0 | Valid basic salary produces HRA/medical/gross breakdown; unauthorized edits fail | `app/payroll/`, `server/modules/payroll/` | Not built |
| 15 p5; p2 s3 | Monthly payroll draft/review: H manage; A view | P0 | Server calculates deductions, tax, join/exit proration from stored records; repeat run not duplicated | Payroll draft service | Not built |
| 16 p5; p2 s2-3 | Finalize/lock payroll: A only | P0 | H receives denial; A finalizes; all later edits, including A edits, fail | Payroll finalize service | Not built |
| 17 p5; p2 s2 | Payslip PDF: A/H all; E own | P0 | Authenticated downloadable PDF agrees with payroll; E cannot fetch colleague's PDF | Payroll payslip route/service | Not built |
| 18 p5 s7-8; p2 s3 | Distinct company/HR/personal dashboards, filters, KPIs, trends and insight lists | P0 | Server aggregates actual records; date/department filters work; zero-data denominators safe; personal metrics isolated | `app/dashboard/`, `server/modules/analytics/` | Not built |
| 19 p5; p3 s4 | Tool-calling AI chat: A company; H HR; E self | P0 | POST `/ai/chat`; required tools return same facts as REST/dashboard; salary disclosure request refused | `app/components/ai/`, `server/modules/ai/` | Not built |
| 20 p5; p3 s4 | AI dashboard summary: A/H only | P0 | Current-filter KPI JSON yields 3-5 grounded insight bullets | AI summary service | Not built |
| 21 p5; p3 s4 | Smart leave draft: H/E own (AI feature table mentions E only) | P0 | Plain sentence becomes validated type/start/end/reason; user confirms normal form before save | AI leave-draft + leave form | Not built |
| 22 p5; p3 s4 | Policy Q&A: all roles | P1 | Answers restricted to section 3 policy or admits unknown | AI policy context | Not built |
| 23 p5; p2 s3 | Announcements: A/H post; E read; on all dashboards | P1 | Post appears across dashboards; E cannot post | `server/modules/comms/`, dashboard component | Not built |
| 24 p5; p2 s3 | In-app notifications: all own | P1 | Leave decision and payslip notifications go to intended user only | Comms notifications | Not built |
| 25 p5; p2 s2-3 | Audit: A view only; nobody changes/deletes entries | P0 | Create/update/approve/finalize record actor/action/entity/before/after JSON; H/E denied; credentials excluded | `app/audit/`, `server/modules/audit/` | Not built |

## Exact business rules

Source: printed p2 section 3, with dashboard formulas from p5 section 7.

- Auth: JWT and bcrypt. Server must check role AND record scope on every protected API. E reads only records belonging to own employee ID. AI inherits the same permission scope. E cannot approve anything or directly edit own attendance, salary or role. H cannot edit organization settings or view audit; A cannot mutate finalized payroll or audit history.
- First run: company name + Admin account form, or ADMIN_EMAIL/ADMIN_PASSWORD bootstrap alternative. A creates H logins. H registers employees with temporary passwords requiring change at first sign-in.
- Organization defaults: start 09:00, 15-minute grace, half day under 5 hours, Sat/Sun weekend. Store office latitude/longitude/radius; 150m is an example, not a fixed requirement. Settings apply to new records only.
- Attendance: server timestamp; one employee/day record; duplicate check-in 409. Late after 09:15 with defaults. Under 5h = half_day; no record and no approved leave = absent; unchecked-out record = missing_checkout.
- Leave: count working days, excluding weekends and holidays. Annual 14, sick 8, casual 10, unpaid unlimited. Overlap/over-balance = 422.
- Payroll: HRA = 40% basic; medical = 10% basic; gross = 1.5 x basic. Daily rate = gross / working days. Deduct absent + unpaid + 0.5 x half-day units. Prorate joiners/leavers. A finalizes and locks the month.
- Illustrative annual tax on gross x 12: up to 600,000 = 0; next slab to 1,200,000 = 5%; to 2,400,000 = 30,000 + 15%; to 3,600,000 = 210,000 + 25%; above = 510,000 + 35%. Percentages need excess-over-threshold interpretation, explicitly noted below. These are challenge formulas, not real-world tax advice.
- Audit: actor, action, entity and before/after JSON for important actions. In-app notifications for leave decisions/payslips. Announcements on all dashboards.

### Analytics definitions and required views

| Metric | Official formula |
|---|---|
| Headcount | Active + probation on end date |
| Attrition | Exits in period / average headcount x 100 |
| Attendance rate | (present + late + missing_checkout + 0.5 x half_day) / (working-day records - on_leave) |
| Late % | late / (present + late) |
| Absenteeism | Absent days / expected working days, per department |
| Leave utilization | Approved days / quota, per leave type and department |
| Payroll cost | Sum gross and net by month and department |
| Average salary | Mean gross by department and designation |

- H: headcount, present/on-leave/late today, pending approvals; attendance trend, departmental absenteeism, leave by type, top five late-comers, AI summary.
- A: headcount, YTD attrition, payroll cost, average salary; headcount/payroll by department, gender/tenure distributions, audit feed, AI summary.
- E: check-in widget, weekly hours against 40h, late count, leave balances, last payslip, announcements, own assistant.
- All computed on backend using database aggregation, filterable by date and department where applicable; never hardcoded examples.

## Required AI integration and guardrails

Source: p3 section 4; permissions clarified by p5 checklist.

- Any hosted LLM API with tool calling; free tier sufficient. Provider not chosen, credentials not verified.
- Tools exactly named: `get_headcount`, `get_attendance_summary`, `get_late_comers`, `get_leave_summary`, `get_my_leave_balance`, `get_payroll_summary`, `search_employees`.
- Chat -> POST `/ai/chat` -> model selects tool -> backend authorizes/validates/runs shared service -> model writes grounded response.
- API key stays on server in `AI_API_KEY`. No direct model-to-database access, arbitrary shell/database tools or browser-to-provider requests.
- AI cannot save records. Validate structured output; retry once on invalid JSON, then show normal form. Smart-leave schema: `{type,start,end,reason}`; confirmation required.
- 15-second timeout, friendly fallback, approximately 20 requests/user/hour, every call logged in `ai_logs`; responses labeled AI-generated. Proposed: whole action including retry shares timeout; log metadata safely without secrets.
- Summary uses current-filter KPI JSON, returns 3-5 bullets based only on these values. Policy answers use section 3 rules only, otherwise unknown.
- Judge probes: department active headcount, most frequently late employee this month, monthly attendance rate, own remaining sick leave, colleague salary refusal, next Monday/Tuesday sister's wedding -> correct dates and casual leave draft.

## Optional and bonus scope

Source: p3 section 5 and p5 bonus line. Bonus is +10 TOTAL; no allocation per feature specified.

- Camera attendance may be web or mobile. Front-camera live preview, exactly one detected face, GPS coordinates + accuracy; server time and server Haversine distance <= configured office radius. Reject zero/multiple faces, outside radius, accuracy >100m. Store `source=camera` and result, normally not full photo; disclose captured data; failed check routes to HR correction.
- Extra face descriptor matching against enrolled employee + simple blink/liveness mentioned; no separate numeric award specified.
- Other listed bonuses: attrition-risk score, absence anomaly flags, 3 lates = 0.5-day penalty, Roman Urdu AI, dark mode/PWA.
- Suggested libraries in source, not required dependencies: face-api.js / @vladmandic/face-api, MediaPipe @mediapipe/tasks-vision, @tensorflow-models/face-detection; React Native vision-camera + face-detector, ML Kit face-detection, Expo camera + location; server geolib. Expo ML Kit libraries require development build.
- Defer all bonuses until mandatory web flows and live AI pass. CSV has conflicting optional wording; retain checklist task rather than silently omit.

## Official scoring

Source: p6 section 9. Base sums to 100; up to 10 bonus.

| Criterion | Points | Judge focus |
|---|---:|---|
| Core HR flows | 25 | Roles, employees, check-in, leave approval, payroll end to end |
| Data & analytics | 20 | Live-record consistency, working filters, useful insights |
| AI features | 15 | Correct answers, role scope, smart leave, summary, graceful failure |
| Code quality | 15 | Modules, service rules, validation, tests |
| UI / UX | 10 | Clarity, consistency, loading/empty/error states, responsiveness |
| Security & RBAC | 10 | Server scope, password hashing, server AI key, audit |
| Demo & docs | 5 | Five-minute narrative, live hosting, usable README |

## Clarifications and proposed assumptions (not event rules)

1. Deadline/timezone absent: participant must supply actual cutoff before time budgeting.
2. CSV: optional in p2 prose, included as #08 in p5. Plan it after the primary flow; clarify with organizer if time constrained.
3. H self-service: checklist allows own attendance, leave and smart leave; H accounts need linked staff identity/job dates/leave entitlement. Propose A creates minimal H staff profile with login. Who approves H's own leave is unspecified; do not silently permit self-approval or give A unlisted approval rights.
4. Payroll tax: interpret percentages as marginal excess above each lower threshold and divide annual tax by 12; rounding, currency, deduction-before-tax treatment and final-net minimum are unspecified. Propose integer minor-unit accounting, monthly tax on specified gross annualization, and documented proration. Require boundary tests.
5. Dates: company timezone unspecified; propose Asia/Karachi. Define day/week boundaries, inclusive leave dates, holiday treatment, next-Monday meaning and year-spanning balances consistently.
6. Attendance precedence unspecified: propose independent late flag + finalized day status so a late half-day is not double-counted. Missing checkout must not become automatic half-day. Derive absence only for elapsed scheduled days within employment; never future days or whole month in advance.
7. Settings history: snapshot effective rules on new records; prior attendance, leave and finalized payroll must not silently recalculate after settings edits.
8. Leave policy gaps: pending-request overlap/reservations, cancellation after approval, past-date requests, cross-year allocation and H self-approval not defined. Propose reserve pending entitlements, exclude cancelled/rejected requests, enforce balance again at approval, prevent double deduction; organizer clarification needed for H decisions.
9. Analytics: average-headcount method unspecified; propose opening/closing mean. Show not-applicable rather than divide by zero. Unpaid utilization has no finite quota. Employment status must be historical for past date filters.
10. Salary allowances: registration mentions salary/allowances but formula mandates 40%/10%; implement mandated formula first, do not accept arbitrary allowances that contradict it.
11. Bootstrap: use first-run form; no public Admin signup thereafter. Fresh judging target must use a dedicated empty application database. Existing Atlas sample_mflix is unrelated sample data: never read it as app data, seed into it or erase it. Current selected database has not been inspected this turn.
12. Payslip publication: propose after finalization; draft preview separate. Leave/payroll notifications to owner; admin audit persists across login changes. Logout should invalidate server session/token version rather than merely hide UI.

## Existing repository and proposed architecture

Inspected root AGENTS.md, manifest, tracked source list, starter UI, server app/startup/config/JWT/password helpers and README. No nested AGENTS.md found outside excluded dependencies/builds; no existing tests or CI found in repository file inventory.

Existing: Next.js/React/TypeScript frontend; Express health endpoint; Mongoose connection; bcrypt and JWT helper functions. Prior session and participant terminal show successful MongoDB connection; not revalidated in this read-only brief review. No actual role authorization, models, domain endpoints, AI provider, dashboards or business tests yet. JWT decoded payload currently uses a type assertion and needs runtime verification before auth implementation.

Retain root Next `app/` + `server/`; npm lockfile and current stack. Organize backend by domain with routes -> validated/authenticated service -> Mongoose models. Shared authorization/date/calculation services feed REST, dashboards and AI tools. Proposed modules are in the matrix; they are not scaffolded in this review.

Minimal entities: OrganizationSettings; Department; Designation; LeaveType; Holiday; User (role, password hash, active, mustChangePassword, token version, employee link); Employee (unique code/email, job/status/dates, contact, salary structure); Attendance (unique employee+company-local-date, timestamps, rule snapshot); AttendanceCorrection; LeaveRequest; PayrollRun (unique month, draft/finalized); Payslip (employee+run, immutable calculation snapshot); Announcement; Notification; AuditLog; AiLog. Use organization ownership where relevant and explicit actor scope, even for initial single-company implementation.

Minimal screens: first-run setup; login/password change; role-specific dashboards/navigation; organization settings/master data; HR account administration; employee directory/360/register/edit; attendance board/calendar/correction inbox; leave form/history/balance/approval inbox; payroll structures/draft/review/finalize and payslip downloads; announcements/notifications; Admin audit; shared AI panel and summary/smart-leave actions.

Proposed API contract conventions: `/api` domain routes (AI exposed at official `/ai/chat` or explicit compatibility route), `{data:...}` success, `{error:{code,message,fields?}}` failure; 401 unauthenticated, 403 forbidden, 404 missing/inaccessible where appropriate, 409 duplicates/locked state, 422 business validation; bounded server pagination. Exact non-AI paths below are design proposals.

- `GET /api/setup/status` -> `{data:{setupRequired:boolean}}`; `POST /api/setup` company/Admin input -> 201, subsequent/racing request -> 409.
- `POST /api/auth/login` email/password -> verified session + safe user; first-use accounts only access password-change/logout until changed. `GET /api/auth/me`; `POST /api/auth/change-password`; `POST /api/auth/logout`.
- Organization settings/master-data endpoints and A-only `/api/users` HR-create/reset/deactivate routes.
- `POST /api/employees` allowlisted employee/job/basicSalary input -> created profile and one-time temporary credential; do not put credentials into audit/logs. GET list/detail scoped. Import dry-run/commit/export later.
- `POST /api/attendance/check-in`, `/check-out`; GET calendar/board; POST corrections + H decision route. Client time never authoritative.
- POST leave requests `{typeId,start,end,reason}`; GET balances/history; cancel and H decision routes. No caller-supplied owner authority.
- POST payroll runs `{month}`; GET draft; A finalize; scoped PDF payslip download. Calculations from services, never supplied totals.
- GET analytics per role with date/dept filters; AI summary reads identical aggregates. POST `/ai/chat` message bounded; structured smart-leave output only drafts a form.
- Comms routes and read-only A audit list. Every sensitive mutation carries appropriate audit entry.

## Primary five-minute demo

Follow p6: empty installation -> A company/settings/location/department/leave types -> A creates H -> H registers 2-3 employees -> E first login/password change/check-in -> E smart leave preview/confirm -> H approves -> H filtered dashboard + AI summary/leave query -> H payroll draft -> A finalizes -> E payslip download + forbidden colleague salary question -> A audit log.

First build acceptance: an empty dedicated database supports one-time company/Admin setup, subsequent Admin login and persisted company settings after refresh, while duplicate bootstrap is rejected. Then extend to H-created employee first-use login and server-stamped attendance. Do not claim the full event checklist complete merely because this slice works.
## Implementation update (2026-10-25)

Attendance corrections are now implemented for the primary flow: employees can submit a dated correction with a required reason, and HR can review, approve, or reject it. Approval updates the server-owned attendance record; audit persistence remains part of the next milestone slice.

Organization holiday management is now implemented for Admins, and leave requests exclude configured holidays from their working-day count.

Nexora AI is now connected through the server boundary using Gemini `gemini-2.5-flash-lite`. The assistant is context-limited to the signed-in workspace and does not expose private server credentials to the browser.

Leave and attendance-correction decisions now create persisted, recipient-scoped notifications with read/unread state.
Admin audit logging is now implemented for leave and attendance-correction decisions, with server-enforced Admin-only access.

Deterministic leave-rule tests now cover weekdays, weekends, holidays, empty working-day ranges, and overlapping dates.

Deterministic attendance tests now cover the grace cutoff, server duration, half-day boundary, and corrected attendance status.

Payroll foundation is now implemented: monthly drafts, persisted payslip snapshots, Admin finalization, and role-scoped payroll viewing. Tax, proration, and PDF payslips are not yet implemented.

Payroll rules and payslips are now extended with HRA/medical/gross calculation, illustrative tax, join-date proration, finalized-run locking, and authenticated PDF downloads.

Analytics foundation is now implemented with role-scoped live summaries and an Analytics panel for organization and personal metrics.

Role-aware sidebar modules now display connected live data instead of placeholder screens for the implemented workflows.

Payroll drafts now use persisted attendance, approved leave, holidays, organization weekends, and employee join/exit dates to calculate absence, unpaid-leave, half-day, and employment-date deductions. The payslip snapshot preserves those ledger values for review.

The AI chat now uses the required seven server-executed Gemini tools with role and record-scope checks. Calls are rate-limited, time-bounded, and logged without prompts, credentials, or private tool payloads.

Admin/HR can request a live grounded dashboard summary, while employees and HR can generate a validated smart-leave draft from natural language. Drafts are never saved by AI and display an explicit confirmation requirement before the normal leave form is used. Policy answers are constrained by the server-provided policy context.
