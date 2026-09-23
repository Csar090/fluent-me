# Telegram and saved-session review repair

## What changed

- The Telegram inbox uses all Telegram sessions, so expired recordings remain visible with a clear explanation. Connection/authentication errors are shown explicitly.
- Refresh runs after cloud sync and when returning to the app, plus once per minute while visible. Local transcription starts only when a recording is opened.
- Backend accepts voice notes, audio messages, and audio uploaded as a document. Import failures are logged and have a visible session record. Duplicate delivery is guarded by message identity and a script lock.
- An explicit restoration action tries the original Telegram file reference for expired recordings. If Telegram no longer serves the file, resend it. Existing retention preferences still apply; no indefinite audio retention is introduced.
- Every saved sample has an AI review / perspectives button. Users can request a full review, an individual perspective, a custom question, or copy a prompt for another AI assistant.
- Review coverage is visible. Insufficient evidence/N/A is distinguished from a missing review. Earlier review results are retained when another perspective is requested; failures do not erase the earlier result.
- Saving and reviewing use the same session ID. Startup no longer overwrites the enhanced save handler after IndexedDB opens.
- Cloud saves are read back before being reported as confirmed. Word timestamps are saved with the transcript; opening/transcribing alone does not prematurely mark a session complete.
- Updated app caching permits future fixes to reach returning clients.

## Deployment order

1. In the existing Apps Script project, back up/read the deployed source and reconcile any newer changes before replacing `Code.gs` with `backend/Code.gs`.
2. Preserve all Script properties, the existing database, audio folder, and Cloudflare worker route. No new bot, database, or deployment URL is needed.
3. Update the existing web-app deployment via Manage deployments → Edit → New version → Deploy. Do not create a new deployment URL.
4. Publish the frontend changes to main; the existing Pages workflow deploys them.
5. Close/reopen the app after the service worker update, then Settings → Sync history.

The frontend's inbox and saved-review actions also work with the previous `list`, `save`, `analyze`, and `job` API. Backend deployment is required for audio-document ingestion, restore, and persistent server-side multi-review history. Do not claim complete live repair until the backend is updated and checked.

## Verification

Run `npm install`, then `npm test` (Node 22.12+). Seven scenarios exercise expired inbox visibility, authentication errors, save identity/action availability without implicit AI calls, additional perspective history, failure preservation, Telegram media classification, and backend history preservation. Tests use synthetic data, mocked cloud responses and IndexedDB; they do not call Gemini or modify production data.

Live acceptance after deployment:

- A new bot voice note and an uploaded audio file appear after Refresh.
- Open invokes local word-timestamped transcription. Save keeps the Telegram session identity.
- Existing expired entries show their status and restoration option.
- A saved transcript without an AI review offers review actions immediately.
- Reviewing another perspective retains earlier results after Sync history/reload.
- A failed AI request leaves the transcript and earlier reviews intact and permits retry.

## Limits

- The existing JSONP audio handoff supports up to 12 MB. Larger files get an explicit import error and should be sent in smaller parts.
- A successful unit test is not evidence of a working production Telegram webhook or a successful Gemini API request.
- Local browser transcription stays the default. Gemini is invoked only through an explicit review action; no cloud transcription was added.
