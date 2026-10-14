# Deployment & configuration

[← Back to the README](../README.md)

## Configuration

| Variable | Purpose | Requirement |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string with a database name and database-user credentials. | Required in production. |
| `JWT_SECRET` | Stable random secret, at least 32 characters, used to sign sessions. | Required in production. |
| `PORT` | Local server port; defaults to `3000`. | Optional. |
| `DATA_DIR` | Alternative directory for the local file store. | Optional. |
| `APP_URL` | Trusted public HTTPS origin for password reset links. | Required for recovery email. |
| `RESEND_API_KEY` | Server-side Resend API key. | Required for recovery email. |
| `RESET_EMAIL_FROM` | Sender address on a verified Resend domain. | Required for recovery email. |

See [User administration](ADMIN.md) for first-admin bootstrap and role setup. Account administration uses MongoDB transactions and requires Atlas or another replica set.

Generate a signing secret locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Store credentials only in server environment variables. Keep `.env`, account data, and connection strings out of Git. The `VITE_` prefix exposes variables to the frontend, so do not use it for secrets. Changing `JWT_SECRET` invalidates existing sessions.

## Vercel

1. Import the GitHub repository.
2. Set the root directory to the folder containing `package.json` and `vercel.json`.
3. Use `npm run build` and the output directory `dist`.
4. Add `MONGODB_URI` and `JWT_SECRET` for **Production**, and for **Preview** if preview deployments need working accounts.
5. Check that the Atlas cluster is running, the database user has read/write access, and its network access list allows the deployment to connect.
6. Deploy. Create a new deployment after changing environment variables.

`vercel.json` routes `/api/*` to `api/index.ts`, which uses the shared Express app. Other routes load the frontend.

## Netlify

Import the repository and configure the same server variables. `netlify.toml` sets the build command, `dist` output, and API redirects. `netlify/functions/api.ts` adapts the same Express app for Netlify Functions.

## Standalone Node server

Build the frontend:

```bash
npm run build
```

Set `NODE_ENV=production`, `MONGODB_URI`, and `JWT_SECRET` in your hosting environment, then run:

```bash
npm start
```

The Node server serves both the frontend from `dist` and the API. Production requires persistent MongoDB storage.

## Health check

```bash
curl https://daily-ten-rose.vercel.app/api/health
```

Expected production response:

```json
{"connected":true,"database":"MongoDB"}
```

A healthy response confirms database connectivity. Follow the [cross-browser sync check](DEVELOPMENT.md#check-synchronization-end-to-end) to verify account data too.

## Troubleshooting

| Symptom | What to inspect |
| --- | --- |
| `FUNCTION_INVOCATION_FAILED` | Function runtime logs and native ESM import paths. |
| Missing production configuration | Environment scope, URI placeholders, secret length, and whether a new deployment was created. |
| Authentication failure | Atlas **database user** credentials and URI encoding for special characters. |
| DNS lookup failure | Cluster hostname and DNS availability. |
| Cluster unreachable | Atlas network access, cluster status, and hosting connectivity. |
| Pending sync count | `/api/sync/batch` response and the matching server log entry. |

The frontend intentionally returns a general message for server failures. Use the hosting logs for diagnostics, and retain browser storage while edits are pending.
