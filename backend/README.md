# Fluency OS Google backend — V2

## One-time setup

1. Replace the Apps Script project's `Code.gs` with this repository's `backend/Code.gs`.
2. Keep the existing Script properties, Sheet and Drive folder. Run `setup` once; it is migration-safe and adds the `Users` sheet.
3. In Google Cloud Console create a **Web application OAuth client** for Google Identity Services.
4. Add `https://csar090.github.io` as an authorised JavaScript origin.
5. In Apps Script → Project Settings → Script properties, add:
   - `GOOGLE_CLIENT_ID`: the OAuth web client ID
   - `ALLOWED_EMAILS`: approved Gmail address(es), comma-separated
   - `GEMINI_API_KEY`: existing Gemini key
6. Deploy the backend as a web app: execute as **Me**, access **Anyone**.
7. Put the permanent `/exec` URL into `config.js` once.

## Keeping the URL permanent

For every later backend update use **Deploy → Manage deployments → Edit → New version → Deploy**.

Do not create another deployment. Editing the existing deployment updates the backend while preserving the same URL and deployment ID.

## Authentication flow

The browser sends the short-lived Google ID credential by POST. The backend verifies its audience, verified email and the `ALLOWED_EMAILS` allowlist, then issues a temporary Fluency OS session token. Gmail credentials and Gemini keys are never stored in the repository.

New application sessions last eight hours and are stored durably under hashed token identifiers in Script properties. Every protected request still checks expiry and the approved-email list. Sign-out revokes the token. Valid old cache-backed sessions can migrate without extending their original expiry. Transient browser network failures do not discard sign-in.

## Telegram delivery

`Telegram_enablePolling` retains its existing legacy function name but currently disconnects the webhook and selects **MANUAL** mode; it removes `Telegram_poll` triggers and does not install a recurring trigger. Run it only when deliberately configuring this manual delivery mode. Pending bot updates are preserved. Existing bot token, allowlist, database and folder stay unchanged.

The app's explicit **Telegram → Refresh** sends authenticated `telegramSync` with a UUID `jobId`. The backend claims one AI_Jobs row, runs the existing manual-sync operation and records DONE or ERROR. The frontend polls the existing `job` endpoint before reloading saved Sessions. A locked/busy import is reported as retryable rather than falsely completed. Requests without `jobId` still use the previous `Telegram_manualSync()` return contract. Automatic page refresh/sync/visibility checks do not call the import action.
`Telegram_getWebhookInfo` logs a sanitized delivery report: mode, last check, last receipt, and errors. The dashboard exposes the same report through **Telegram → Check delivery**. Failed downloads are retried without advancing past the failed update; files over the 12 MB handoff limit remain visible as failed imports without blocking later messages.

Do not run `Telegram_setupWebhook` while polling is enabled. A bot must use one delivery mechanism at a time.


## Phase 0A deployment and acceptance

Build `20261010-0a` requires the matching frontend and `backend/Code.gs`. No schema change or setup rerun is required for an already configured database with the existing AI_Jobs table. Do not reset properties or create a new deployment URL. Update backend first, then frontend. Inspect current editor source for changes newer than the repository baseline before replacement.

Verify approved/denied sign-in, an explicit bot recording import, import failure/retry, saving imported text and multilingual corrections, and actual clipboard paste on supported browsers. Preserve earlier reviews, timestamps, records and retention behavior. For rollback, select the prior Apps Script deployment version and restore the prior frontend commit; do not delete history or rotate the browser storage key. Full release acceptance remains pending the live checks in the Phase 0A audit.

## Expanded Phase 1 — cognitive practice

Keep every existing Apps Script file. Replace `Code.gs` with `backend/Code.gs` and add three script files named `LearningRegistry`, `LearningEvidence` and `LearningAssessment`, using the complete matching `.gs` files. All four files are required before deployment. Keep the existing Script Properties, deployment URL, access settings and triggers.

Run `Learning_setup` once in the editor. It validates the registry and creates only `Learning Evidence` and `Learning Assessments`. Running it again is safe; incompatible existing headers cause an explicit error without overwriting data. Do **not** run the existing general `setup` merely for this upgrade: that function manages the audio cleanup trigger.

Edit the existing web-app deployment, select a new version and deploy. The bootstrap version must read `20261010-p1`. In Capture, load exercises and complete a task; save, open the existing review view and request cognitive feedback. This uses Gemini only on request. Load saved feedback, then retry the task and request another assessment to compare.

The registry is authoritative code; browser definitions are a retrieved memory copy. Sessions remain the source of attempts. Practice snapshots live in existing `metricsJson.learningPractice`. The two additive tabs contain immutable evidence and assessments; they do not replace Sessions, Score History, AI reviews or the Coaching Rubric sheet. Text/identifier payload cells use JSON encoding to prevent formula interpretation and preserve exact content.

Targets do not cut off recordings. Whitespace word counts are approximate for languages without spaces. Preparation elapsed time is browser time to Ready, not verified thinking time. Transcript-only evidence cannot establish speaking onset, vocal delivery or humour timing. New assessments do not declare mastery. Cognitive training accepts at most 20,000 transcript characters and 3,000 self-assessment characters; oversized saved samples remain intact.

Rollback: restore `Code.gs` and the frontend files from commit `e6032af73545f9f857ce458e73e6096cdcdd7535`, then redeploy the previous Apps Script version at the same URL. Retain the new files/tabs as inert historical evidence. No reverse data migration or tab deletion is required. Do not remove the new backend modules while the new router is still deployed.
