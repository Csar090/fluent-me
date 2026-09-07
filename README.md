# Fluency OS V1.1 — local-first PWA

This replaces the rejected Apps Script/Firebase recorder. GitHub Pages serves static code only. Samples and optional audio live in IndexedDB on the user's device.

## Included

- Genuine in-page start/stop recording, timer, playback and save.
- Optional browser live transcription where supported; editable/manual transcript everywhere.
- Words, fillers, filler rate and WPM.
- Context, audience, reflection, tags and timestamp.
- Local sample library, baseline chart, JSON export and permanent deletion.
- Installable/offline PWA shell.

## Important boundary

Browser SpeechRecognition is a convenience adapter, not the authoritative timestamp engine. Genuine word timestamps, pauses, false starts, repetition and self-correction events require the planned transcription adapter and are not falsely claimed in this basic build.

## Test locally

Microphone APIs require HTTPS or localhost. Run `npx serve .` from this folder, open the localhost URL, allow microphone access, record, stop, play and save.

## GitHub Pages deployment

Upload this folder's contents to a repository, open **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save. Open the generated HTTPS URL and allow microphone permission. No Firebase or card is needed.

## Privacy

Deleting browser/site data removes the local database. Export before changing phones, browsers or clearing site storage. Audio is never sent to GitHub or AI.
