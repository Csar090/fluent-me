# Fluent Me / Fluency OS — Phase 0A reliability repair

Fluency OS uses GitHub Pages for its frontend and a Google Apps Script backend for approved Google sign-in, Sheets history, temporary Drive audio and explicit Gemini review. Sessions are also stored encrypted in browser IndexedDB after authorization.

## Preserved capabilities

Recording/playback, optional browser live recognition, on-device Whisper transcription with word timing, transcript corrections and revision checks, saved-session review perspectives and three rewrites, review history, grouped next attempts, progress, backup/restore, Telegram audio ingestion/recovery and audio retention remain available. The English route is `/fluent-me/`; the Hindi/English/Hinglish route is `/fluent-me/multilingual/`.

## Phase 0A repairs

- Shared current-revision review-prompt copying, with accurately labelled manual-copy recovery when the clipboard is unavailable or denied.
- Normal Save and AI review use the same capture builder. Imported text retains transcript-only provenance through cloud sync and editing; new attempts clear imported state.
- The multilingual script compiles and preserves Unicode counts plus word-timing evidence.
- Explicit Telegram Refresh requests manual import and waits for its backend job result. Automatic display refreshes read only saved Sessions; they do not import bot messages.
- Both routes load the shared clipboard helper. The root service-worker cache includes import and multilingual assets.

## Verification

Run `npm ci --ignore-scripts` and `npm test`. Tests load scripts from both actual HTML entry points, fail on uncaught application errors, and use synthetic records, mocked clipboard/network APIs and backend service stubs. They make no production writes or Gemini calls. See the accompanying Phase 0A audit for exact results and pending real-browser/deployment checks. A mocked clipboard success does not close the reported browser defect.

## Deployment

Read the current deployed Apps Script source and reconcile any editor-only changes before replacing `Code.gs`. Keep the same Script properties, Sheet, Drive folder, encryption key and `/exec` URL. Update the existing Apps Script deployment through Manage deployments, then publish matching frontend files together. Backend and frontend build identifier: `20261010-0a`. No schema migration or new sheet is needed. See `backend/README.md` and the delivered audit for rollback and live acceptance steps.

## Privacy and operational boundaries

On-device Whisper processes audio locally; optional browser SpeechRecognition may use a browser-provided remote service. Gemini is invoked only by explicit review. Cloud audio follows the existing retention setting; local retained audio lasts until locally deleted. Backup JSON is a portable unencrypted export, distinct from encrypted IndexedDB. Local Delete does not delete cloud history, which synchronization can restore. Clearing site data removes local records; preserve a backup first. Offline shell caching does not provide fresh Google authorization. First-time service-worker registration from the multilingual-only route remains a known pre-existing limitation pending a separate registration-path repair.

## Cognitive practice — expanded Phase 1

Five versioned exercises reuse Capture and the existing attempt grouping: point extraction, pre-speech compression, structure selection, meaning-preserving compression and spontaneous response. Load exercises, choose independent or hinted practice, prepare, press Ready, and record or enter a response. Save and open the existing review view to use the separate Cognitive training panel. Give a self-assessment, request diagnosis, load feedback, retry the same task and compare the evidence. The legacy review perspectives, rewrites and scores remain available.

This frontend requires the complete Phase 1 Apps Script modules for learning APIs; see `backend/README.md`. Until that backend is deployed, existing features continue working and the exercise loader explains the required update. No new service, trigger, background AI assessment or PIOUS change is introduced.

Tests: `npm test` runs the original regression scenarios and the expanded learning workflow tests. Model responses and Google services are simulated; live model quality and visual/microphone acceptance remain separate release checks.
