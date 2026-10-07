# UPSC Study Desk

A private, source-aware learning workspace for one UPSC Civil Services Examination aspirant. It combines a preference-based seven-day plan, a paraphrased syllabus browser, a limited and explicitly labelled topic-level PYQ sample, short concept lessons, personal notes, progress tracking, active recall, PIB current-affairs prompts, and candidate links from selected official recruitment pages.

This is a **personal study aid**, not a UPSC product, coaching prediction engine, eligibility checker, job board, answer key, or guarantee of selection. Syllabus priority is analysis for time allocation—not an official ranking and never a statement that an infrequent topic is safe to omit.

## What is implemented

- **Private owner sign-in:** Supabase Auth password sign-in, no public registration page, server-side owner-email gate, protected server actions, and a `proxy.ts` cookie refresh path.
- **Six-question onboarding/preferences:** target attempt year, realistic daily time, preparation stage, language preference, optional subject/History Optional view, and official notice scope; optional eligibility context and opt-in email preference. Nothing is preselected. The target year is saved as a goal, but the starter plan does not infer an exam date or change intensity from the year alone. The first-release lessons are English-first; a saved Hindi preference is not an automatic translation claim.
- **Personalized weekly planning:** seven IST-keyed days, daily time split across study/retrieval/practice/current-affairs tasks, and a weekly review. Completed sessions are retained when future generated tasks are refreshed.
- **Progress and revision:** task completion, topic confidence, private topic notes, user-created recall cards, due dates, and an inspectable SM-2-style interval heuristic. The heuristic is not a retention guarantee.
- **Syllabus and PYQs:** paper/stage/topic filtering, explainable recommendation rationale, source links, topic progress, paraphrased PYQ themes and an explicit coverage-gap table. History Optional appears when selected or when History is the chosen optional subject.
- **Concept lessons:** eight source-linked starter modules with definitions, background, key ideas, examples, Prelims cautions, Mains angles, revision prompts and practice questions. This is a focused starter set, not the complete curriculum.
- **Current affairs:** recent items from the official PIB English RSS feed are matched to syllabus topics by deterministic keyword rules. Cards retain the feed title, excerpt, publication date and source link; the surrounding “why it matters” text is a study prompt, not an independently fact-checked report. Manual refresh is owner-only and throttled to one run per five minutes.
- **Government-exam notice candidates:** allowlisted UPSC, SSC, and one RRB Chandigarh listing page, according to the saved scope. Detected dates may be absent or wrong. The app does not determine eligibility or claim complete recruitment coverage.
- **Daily sync:** Vercel Cron targets `22:30 UTC` (about `04:00 IST` the following day). Hobby schedules have hourly timing precision (up to about ±59 minutes); source failures, parser changes and network delays can prevent or delay updates. The cron route requires a server-side `CRON_SECRET` bearer header.
- **Security-conscious defaults:** row-level security for personal rows, service-role operations confined to server code, no browser-exposed Supabase keys, no public signup, no third-party font import, no analytics integration, `noindex` metadata/robots, private-route `no-store` caching and security response headers.

## Explicit limitations and PYQ coverage

The PYQ data is deliberately small. It stores **paraphrased themes**, not full question text. Secondary transcriptions were used as cross-checks for the selected examples; this app has **not systematically parsed or audited every official UPSC PDF**. The official paper is controlling for exact wording, context and paper/year. Every item links to the UPSC archive; secondary links are optional cross-checks. Check the official source before relying on a classification.

| Scope represented in the starter sample | Sample years | Important gap |
| --- | --- | --- |
| Prelims GS-I history tags | 2013, 2019, 2021 | Not a year-by-year or question-by-question review; other subjects and most years are not classified. |
| Mains GS-I history/culture tags | 2022, 2024 | Only selected themes; other GS papers, most years and non-history topics are not classified. |
| History Optional Paper I | 2022, 2024 | Only selected themes; not a full paper index and not a map-question database. |
| History Optional Paper II | 2022 | Only selected themes; other years and most topics are not indexed. |

An unrepresented year is a **coverage gap**, not evidence that UPSC did not publish a paper or that a topic has low value. Small samples do not establish a reliable frequency trend. Recommendations combine syllabus centrality, foundational value and the limited sample. “Lower priority” and “deprioritize” are relative time-management labels, never a safe-to-ignore list. Open the full official archive: [UPSC previous question papers](https://upsc.gov.in/examinations/previous-question-papers).

The linked syllabus edition is the **UPSC CSE 2026 notice**. It is the starter content edition, not the user's selected attempt year. Recheck the current notification and scheme for the actual attempt. [Official UPSC CSE 2026 notice PDF](https://www.upsc.gov.in/sites/default/files/Notif-CSP-2026-Engl-060226Rev.pdf).

## Privacy model: the deployment itself must be protected

A private GitHub repository does **not** make a Vercel deployment private. Before deploying personal notes or progress, configure the Vercel project:

1. Open **Project Settings → Deployment Protection**.
2. Choose **Vercel Authentication** and the **All Deployments** scope. Standard Protection does not protect production domains.
3. Grant access only to your own Vercel account/team. Review team members, project members, access grants and pending requests.
4. Do not create shareable links or automation bypass secrets for routine access. Review any existing bypass or trusted-source settings.
5. Test both the generated Vercel URL and any custom production domain in a signed-out/private browser: neither should render the app. Then sign in with the authorized Vercel account and test the app's separate owner login.

Official references: [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection) · [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication). These platform settings must be checked in your own Vercel account. The deployment script **does not** claim to configure or verify the All Deployments scope.

Inside the application, private pages/actions additionally require the email in `OWNER_EMAIL`. Supabase RLS scopes personal records to `auth.uid()`. Shared PIB/official-notice metadata is readable by authenticated users in the project and is not aspirant notes or progress. The server-only `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS, so it is used only by protected source-sync code; anyone with that key can access the database. Rotate it immediately if exposed.

The app does not store notes in browser local storage. Notes, preferences, generated tasks, progress, review cards/events and alert dismissals are in Supabase Postgres. This repository contains starter content and code, not the user's account data. Use Supabase backup/export controls before destructive work. The current UI has no portable export or account-deletion workflow; deleting the Supabase Auth owner account cascades its personal rows, but shared source metadata may remain until the project is deleted.

There is no Google Fonts request, analytics SDK or app-level advertising tracker. Vercel and Supabase still process requests as hosting/database providers; review their current terms, region, retention, privacy and account-access settings.

## External services, permissions and possible costs

| Service | Used for | What you must do / consider |
| --- | --- | --- |
| **GitHub** | Source repository and version history | Create/use a repository you control and set it private if that is your preference. The script checks `gh` authentication when available; it does not create repositories, change visibility, push code or request a token in chat. |
| **Supabase** | Auth and persistent Postgres. Stores the owner Auth identity/email, preferences, eligibility checklist (if entered), private notes, plans, progress and review history. | Create a project, choose a region, add the owner user in Supabase Auth, and apply the schema migration. Free/paid limits, pausing, backups, storage, email and compute vary; check [current Supabase pricing](https://supabase.com/pricing) and project settings. Do not use a service-role key in `NEXT_PUBLIC_*` variables. |
| **Vercel** | Next.js builds/hosting, deployment protection, server environment variables and daily cron. Vercel processes HTTP requests and its operational/build logs. | Create/link a project, set server-side environment variables, enable Vercel Authentication for All Deployments, and check current [Vercel pricing/usage](https://vercel.com/pricing) and [cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing). A Hobby cron is not minute-accurate. A private repository alone does not protect the hosted URL. |
| **PIB** | Current-affairs source | Server-side fetch from the [official PIB English release feed](https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1); no account is required by this code. RSS availability/markup can change. |
| **UPSC / SSC / RRB Chandigarh** | Candidate official notice links | Server-side best-effort reads of the official listing pages only. Some pages may block or change markup; coverage is not complete. No eligibility decision is made. |
| **Resend (optional)** | Email for newly detected, explicitly dated official notice candidates | Only after opt-in, the configured owner email and new notice title/date/official link are sent to Resend for delivery. Create/authorize an account, verify a sender domain, add its API key server-side and opt in in Preferences. Email is sent only for newly detected candidates with a recent listing date during cron; it is not a deadline guarantee. Check current [Resend pricing](https://resend.com/pricing). Leave both Resend variables blank for in-app-only notices. |

No account, paid subscription, sender domain, database or deployment is created automatically by this repository. Choose the plans/regions and grant only permissions you intend. Free tiers and provider features change; verify the official pricing/limits pages before relying on them.

## Local development and first setup

### Prerequisites

- Node.js **20.19+, 22.13+, or 24+** and npm (the tested environment used Node 22).
- PowerShell 7.2+ for `deploy.ps1` (Windows PowerShell 5.1 is not supported).
- Git. Supabase CLI for migrations. Vercel CLI only if deploying. GitHub CLI (`gh`) is optional.
- A Supabase project and an owner account created from its dashboard. A Vercel account/project is needed only for hosted deployment.

### 1. Configure server-only local secrets

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` **locally** (it is ignored by Git). Set:

- `SUPABASE_URL`: project URL, such as `https://<project-ref>.supabase.co`.
- `SUPABASE_ANON_KEY`: the project's publishable/anon key. It is used only from server code in this app.
- `SUPABASE_SERVICE_ROLE_KEY`: the project service-role/secret key. Server-only; never put it in a `NEXT_PUBLIC_*` variable or source control.
- `OWNER_EMAIL`: the exact owner account email; email comparison is case-insensitive.
- `CRON_SECRET`: at least 32 random characters. One way to create a base64url random secret with Node is `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. Keep the output private.
- Optional `PIB_RSS_URL`: leave at the official default unless you have a reason to use another HTTPS URL on `pib.gov.in`.
- Optional `RESEND_API_KEY` and `RESEND_FROM_EMAIL`: set both or neither. Email is disabled otherwise.

Do not paste secrets into chat, commit them, add them to screenshots/logs, or expose them in client-side code. `.env.example` contains placeholders only.

### 2. Create the owner account and apply the database schema

1. In Supabase Auth, create the one owner user and set/confirm its password. Then disable new-user signups in the Supabase Auth project settings (the exact control depends on the enabled providers). Do not enable a public signup route in this app; the UI intentionally has none.
2. Find the project ref in the Supabase project URL/Settings.
3. In PowerShell, log in to the Supabase CLI (`supabase login`) through its supported local flow, then run:

```powershell
$ProjectRef = "your-supabase-project-ref"
pwsh ./deploy.ps1 -ProjectRef $ProjectRef -SkipVercel
```

The script will install from `package-lock.json`, run typecheck/tests/lint/build, link the project, show a migration dry run, and ask you to type `APPLY` before `supabase db push`. Review the target project and dry-run output before confirming. It does not print `.env.local` values. On the first run it creates a placeholder `.env.local` if missing and stops so you can fill it.

For local app use:

```powershell
npm run dev
```

Open `http://localhost:3000`, sign in with the Supabase owner account, and complete the six onboarding questions. If the database is not migrated, `/dashboard` displays a setup message rather than demo data.

### 3. Link Vercel, set variables and protect the deployment

1. Install the Vercel CLI and run `vercel login` using the account that will own the private project.
2. Link an existing Vercel project (or follow the CLI prompts to create one you authorize):

```powershell
$ProjectRef = "your-supabase-project-ref"
$VercelProject = "your-vercel-project-name"
pwsh ./deploy.ps1 -ProjectRef $ProjectRef -VercelProject $VercelProject
```

Without `-DeployProduction`, this does **not** deploy. The script's `vercel env ls production` step shows variable names/targets, not secret values. In the Vercel dashboard, set the required server environment variables for Production: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OWNER_EMAIL`, and `CRON_SECRET`. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` only if using email. Use a separate staging Supabase project for Preview deployments, or leave Preview without app credentials; pointing Preview at the personal production database can expose or modify the same study records to anyone granted preview access.
3. **Before the first production deployment**, complete the Vercel Authentication + All Deployments protection steps above. The script cannot verify this scope through the CLI and refuses `-DeployProduction` unless you explicitly pass `-ProtectionConfirmed` as your acknowledgement.
4. Commit the intended changes and ensure `git status` is clean. Then:

```powershell
pwsh ./deploy.ps1 -ProjectRef $ProjectRef -VercelProject $VercelProject -DeployProduction -ProtectionConfirmed
```

The script always prompts you to type `APPLY` before `supabase db push` (a dry run with no pending migrations makes the push a no-op), then `DEPLOY` before production deployment. On a rerun with CLI authentication/project links already set, `-Yes` skips these script confirmations; a first Supabase link may still prompt the Supabase CLI for its database password. Use `-Yes` only after reviewing the project, protection, environment-variable names, migration dry run and clean Git state:

```powershell
pwsh ./deploy.ps1 -ProjectRef $ProjectRef -VercelProject $VercelProject -DeployProduction -ProtectionConfirmed -Yes
```

The script requires a clean Git tree for production deployment, is safe to rerun with applied migration history, never uploads secrets from `.env.local`, and does not create provider accounts, change GitHub visibility, configure deployment protection, add email senders, or commit/push code. See comments/errors in `deploy.ps1` for recovery steps. If a step fails, fix only that provider/permission issue and rerun; completed checks and applied migrations are skipped/no-op on subsequent runs.

### Vercel production checklist

- [ ] Project is connected to the intended GitHub repository/branch.
- [ ] Supabase Production environment variables are present; the service-role key is server-side only.
- [ ] Vercel Authentication is enabled with **All Deployments**, including production and generated domains.
- [ ] Only the intended Vercel account/team has view access; shareable links and bypass settings were reviewed.
- [ ] A signed-out browser is denied at both generated and custom domains; the allowed Vercel account reaches the app's separate Supabase owner login.
- [ ] The first Vercel cron run appears in Settings/Current Affairs sync history; no claim of successful complete coverage is inferred from a successful HTTP response.
- [ ] Email remains disabled unless Resend is configured and opt-in is saved.

## Verification and routine commands

```powershell
npm ci
npm run typecheck
npm test
npm run lint
npm run build
```

The `dev`, `build` and `start` scripts set `NEXT_TELEMETRY_DISABLED=1`. Unit tests cover IST date boundaries, plan time allocation/History Optional selection, recall intervals, PIB parsing/recency/host validation, exam-source scopes and notice parsing, and syllabus/PYQ ID/source mapping. They do not exercise live Supabase, Vercel, provider billing, real feeds, or a full paper audit.

### Scheduled source refresh

`vercel.json` schedules `/api/cron/daily` at `30 22 * * *` UTC: 22:30 UTC = 04:00 IST on the following date. Vercel sends the configured `CRON_SECRET` as a bearer token. The route rejects a missing/short secret and incorrect authorization. Vercel Hobby cron schedules can execute within an hourly window; consult the official [usage and pricing limits](https://vercel.com/docs/cron-jobs/usage-and-pricing). Use the in-app **Refresh sources** button for a manual owner-only sync (five-minute throttle). Recent outcomes and parser/network failures appear in Current Affairs and Preferences.

The feed parser is bounded to a recent PIB window and an official-host allowlist. Listing parsers are heuristic and allowlisted, but official markup can change. Candidate alerts must be verified at the linked government notice. A missing date remains blank; the app never infers eligibility or deadline rules.

## Troubleshooting

| Symptom | Check / recovery |
| --- | --- |
| `/setup` says Supabase is not configured | Confirm `.env.local` locally or Vercel Production server variables contain `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `OWNER_EMAIL`; restart/redeploy after edits. Never prefix service secrets with `NEXT_PUBLIC_`. |
| Sign-in returns owner restriction | Confirm the Supabase Auth email matches `OWNER_EMAIL`. The password is sent unchanged; if forgotten, reset it through Supabase Auth dashboard. No self-service signup or reset flow is included. |
| Dashboard says schema is unavailable / other pages fail | Apply `supabase/migrations/202610070001_initial_schema.sql` with `supabase db push`. Check Supabase CLI project link and migration history. Do not disable RLS to bypass an error. |
| `supabase db push` asks for a database password or fails to link | Run `supabase login`, verify the project ref and database password in the provider dashboard, then retry. Do not paste the database password into chat or check it into a file. |
| Login loops or a stale session remains | Use Sign out, clear site cookies for the local/deployed origin, then sign in again. Confirm `proxy.ts` is deployed and the Supabase URL/key pair belong to the same project. |
| Vercel URL is visible publicly | Stop using it for personal data. In Vercel Project Settings, select Vercel Authentication + **All Deployments**; verify production domains, generated deployment URLs, shareable links, access grants and automation bypasses. A private GitHub repository is not enough. |
| Cron returns 401/503 | Confirm Vercel Production `CRON_SECRET` is set, long/random and identical to the server value. The `CRON_SECRET` setting enables Vercel's bearer authorization. Redeploy/retry after correcting it. Never put the secret in a URL or frontend. |
| No PIB or exam items appear | Check Settings/Current Affairs sync history and server logs. Confirm the service-role secret is valid, official pages are reachable and RSS/listing markup has not changed. No match is not proof that no relevant item or vacancy exists. |
| Manual refresh is rate-limited | Wait five minutes and inspect the latest sync run before retrying. This limit prevents repeated external fetches; it does not imply the previous run succeeded. |
| Email does not arrive | Check both Resend variables, verified sender/domain, owner email and the saved email opt-in. Only newly detected, explicitly/recently dated candidates during cron are eligible; manual refresh does not send notification email. Review Resend dashboard delivery logs and current quotas. |
| Build fails | Use Node 20.19+, 22.13+ or 24+, run `npm ci`, then `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build` to isolate the failing check. The production build requires no live data; login and data actions need provider env at runtime. |
| A PYQ theme or “priority” seems wrong | Open the UPSC official paper/archive link and verify full wording/context. Report the item/source to correct the paraphrased starter tag. The sample is not comprehensive and does not establish safe-to-ignore topics. |

## Source references

- [Official UPSC CSE 2026 notification/syllabus](https://www.upsc.gov.in/sites/default/files/Notif-CSP-2026-Engl-060226Rev.pdf)
- [UPSC previous question paper archive](https://upsc.gov.in/examinations/previous-question-papers)
- [PIB RSS information page](https://www.pib.gov.in/ViewRss.aspx?reg=1&lang=1) · [PIB English releases feed](https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1)
- [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) · [Supabase Auth](https://supabase.com/docs/guides/auth) · [Supabase RLS / secure-data guidance](https://supabase.com/docs/guides/database/secure-data)
- [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection) · [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication) · [Vercel Cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs) · [Vercel Cron usage/pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- Limited History Optional transcription cross-checks: [2022](https://lotusarise.com/history-optional-question-paper-2022-upsc/) · [2024](https://lotusarise.com/history-optional-question-paper-2024-upsc/) · [2024 Paper I](https://selfstudyhistory.com/2024/10/23/upsc-mains-2024-history-optional-paper-i/). These are secondary references; official UPSC papers remain authoritative.
