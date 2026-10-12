# Development guide

[← Back to the README](../README.md)

## Local setup

Use Node.js **22.12 or newer** and npm. From the repository root:

```bash
npm ci
npm run dev
```

The shared development server runs the React app and Express API at `http://localhost:3000`. If that port is occupied, it prints another available port.

### Optional environment file

Local development works without an environment file. To configure a database or a different port, create `.env` from the template only if `.env` does not already exist:

```bash
cp .env.example .env
```

PowerShell equivalent:

```powershell
Copy-Item .env.example .env
```

Restart the server after changes. See the [configuration reference](DEPLOYMENT.md#configuration).

### Local persistence

Without `MONGODB_URI`, accounts are saved in `data/accounts.json`; the signing secret is persisted in `data/.session-secret`. Back up both files together. The file store is designed for one server process. Use MongoDB when running multiple instances or deploying to a hosting platform.

`data/` and `.env` are ignored by Git. Changing or clearing browser storage can discard unsynchronized edits.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the frontend and API together. |
| `npm start` | Runs the shared Node server using the current environment. |
| `npm run lint` | Checks TypeScript types. |
| `npm test` | Runs the regression suite using Node's test runner and `tsx`. |
| `npm run build` | Checks types and builds frontend assets into `dist/`. |
| `npm run preview` | Serves built frontend assets; authentication and sync require the API server. |
| `npm run clean` | Removes generated build and temporary test artifacts while preserving account data. |

## Working on a change

1. Create a branch for a focused change.
2. Run `npm run dev` and reproduce the behavior.
3. Add regression coverage for changes to persistence, authentication, or synchronization.
4. Run `npm test` and `npm run build` before opening a pull request.

GitHub Actions repeats the test and build checks on pushes and pull requests. Database behavior is covered with mocks and the local file store; the suite does not connect to a real Atlas cluster.

## How synchronization works

```text
Edit → local account storage → pending queue → authenticated batch API
                                                ↓
                                  MongoDB merge and revision check
                                                ↓
                           response → local merge → acknowledge queue
```

- Queue items belong to the active account; another account cannot read them.
- Edits created while a request is in flight remain queued for the next request.
- Task timestamps and deletion markers protect against stale uploads restoring deleted tasks.
- Habits, recurring items, and settings use collection-level versions.
- MongoDB updates compare the account revision before writing to avoid overwriting concurrent changes.

When a request fails, edits stay in that browser and the client retries. They become available on another device after a successful sync. The app does not currently include a service worker for loading the site offline.

### Check synchronization end to end

1. Sign in and add a task with a recognizable title.
2. Wait for **Synced / تمت المزامنة** and an empty pending count.
3. Sign into the same account in another browser.
4. Open the same date and confirm that the task appears.
5. Change its status there and verify that the first browser receives the update.

If sync fails, inspect `/api/sync/batch` in the browser Network panel and the matching `API failure:` entry in hosting logs. Send the response status and redacted error when reporting an issue. Keep tokens and credentials private.

## Existing browser data

Older browser-only accounts are not automatically converted to server accounts. Sign into a server account and open Settings to download a legacy backup or explicitly import data that belongs to you.

Legacy local `data/users.json` and `data/days.json` are preserved when present. The current server uses `data/accounts.json`; these files are excluded from new commits.

## Screenshot provenance

The main README preview, `docs/images/published-image.png`, shows the public live-demo sign-in page at its original 1440 × 1000 resolution.

The README's `docs/images/planner-light.png` and `planner-dark.png` are direct browser captures of the running app using an isolated local example account. They show the same eight sample tasks on October 12, 2026. They contain no personal account data, and the screenshots retain their original proportions and an opaque background.

The theme-aware SVG banners are decorative branding, separate from the product screenshots.
