# User administration

Mizan includes a persisted user management panel with an overview, searchable user table, account details, and audit history. Open **Settings → User management** after signing in with an authorized account. The panel also opens at `/#admin`; its back button returns to settings.

## First administrator

1. Register a normal account in the application.
2. In a trusted terminal, configure the **same database and JWT secret as the deployment**. Keep credentials in environment variables, never command arguments or Git.
3. Run from the project directory:

   ```sh
   npm run admin:bootstrap -- your_existing_username
   ```

4. Sign in again. Bootstrap revokes that account's existing sessions.

Bootstrap runs only when no active Super Admin exists. Registration never accepts a privileged role. Subsequent promotions require a Super Admin and an audited reason. The panel prevents self-deletion, self-suspension, and self-demotion. A transaction protects the last active Super Admin, including concurrent requests.

## Transfer an existing local account to Atlas

Set `MONGODB_URI` privately to the target deployment's connection string, including the actual application database name. Never put credentials in command arguments. The operator-only transfer command performs a read-only preflight by default:

```sh
npm run account:transfer -- your_username --source path/to/accounts.json
```

After reviewing the target database and record counts, add `--apply` to perform the transfer. The account ID, account code, profile, password hash/salt, role, complete planner state, timestamps, and related audit entries are preserved. Active sessions, support grants, and outstanding reset links are excluded; the imported account requires a fresh sign-in using the same password. Existing Atlas accounts are never overwritten: collisions on ID, username, account code, email, or audit IDs stop the operation.

An ignored backup is saved under `data/transfer-backups/` before writing. The account and audit entries commit together using a MongoDB transaction, followed by a read-back comparison. The source remains intact; this is a snapshot transfer, not ongoing synchronization between a local JSON server and Atlas. Use a deployment connected to Atlas for subsequent edits across devices. This is a trusted terminal tool with no public API route.

## Roles

| Capability | User | Support | Admin | Super Admin |
| --- | :---: | :---: | :---: | :---: |
| Personal planner | ✓ | ✓ | ✓ | ✓ |
| View users and activity counts | | ✓ | ✓ | ✓ |
| Start read-only support for regular users | | ✓ | ✓ | ✓ |
| Edit, suspend, revoke, reset, delete, restore regular accounts | | | ✓ | ✓ |
| Manage staff accounts and assign roles | | | | ✓ |
| Read global audit history | | | ✓ | ✓ |

All permissions and target restrictions are checked on the server. A cached role or hidden button never grants access. Administrators cannot impersonate staff accounts.

## Password recovery with Resend

Configure these server environment variables and restart/redeploy:

```dotenv
APP_URL=https://your-deployment.example
RESEND_API_KEY=your_server_side_key
RESET_EMAIL_FROM=Mizan <support@your-verified-domain.example>
```

Verify the sender domain in [Resend](https://resend.com/docs/dashboard/domains/introduction). Email is sent using the [Resend HTTP API](https://resend.com/docs/api-reference/emails/send-email) and native `fetch`; no email dependency is added. `APP_URL` is a trusted configured origin, independent of request headers. Local development accepts `http://localhost:<port>`.

The account must have an email address and be active. The administrator supplies a reason. Links expire after 15 minutes, work once, and can be requested at most once per minute per account. Only a SHA-256 hash of the random 256-bit reset token is persisted. The token appears in the link fragment, is removed from the address bar on opening, and is never returned in admin API responses or audit entries. New passwords use the existing salted scrypt hashing and must contain 10–200 characters. A completed reset revokes all sessions and requires a fresh sign-in. Profile/email changes invalidate outstanding links. Delivery request failures invalidate the issued link and show an error; provider acceptance does not guarantee inbox delivery.

## Support sessions

Support sessions require a reason, last up to 15 minutes, and display a persistent banner with the target account, expiry, and **End & return to my account**. They are deliberately **read-only**: all API mutations are blocked, including password changes, role changes, and financial routes if added in the future. There is currently no financial subsystem.

The original administrator session stays separate from the support token. The support token is held in tab-scoped session storage; planner snapshots use a temporary support namespace and never enter the user's normal sync queue. Ending a session records an audit event, invalidates its grant, clears its temporary cache, and returns to the administrator. Expired sessions attempt the same return. If the original session was revoked, use Sign out from the banner and authenticate again. A closed tab leaves a grant that expires server-side; it does not create an explicit end event. Logout/session revocation and staff role changes also invalidate existing grants.

## Persistence and compatibility

- Production uses MongoDB. Administrative mutations, grant changes, and their audit events commit in a transaction. Use **MongoDB Atlas or a replica set**; standalone MongoDB does not support this transaction flow.
- Security transactions serialize through a control document to protect cross-account invariants such as retaining an active Super Admin. Monitor contention if administrative traffic grows.
- Existing accounts default to `user` and `active`, without a destructive migration. Existing tokens remain valid until expiry or the first account session revocation.
- Local development retains JSON persistence. Existing account maps are read transparently and written atomically into a versioned envelope containing accounts, grants, and audit entries. Run one Node process per local data directory. Back up local data before downgrading to an older application version.
- Soft deletion preserves planner records, prevents sign-in, and revokes sessions. Restoration preserves data and the previous suspension state; suspended accounts need activation too. Deleted usernames/email addresses remain reserved. There is no hard-delete operation.
- Activity details expose counts and account audit events, not passwords, hashes, reset tokens, session tokens, or planner task contents.
- Audit entries contain actor, action, target, timestamp, and reason. Do not enter secrets into the reason field. The database operator remains trusted; these records are not a tamper-proof external audit service.

## Verification

```sh
npm run lint
npm test
npm run build
```

The API tests use an isolated persisted local database and an injected mail adapter. They cover RBAC, privilege escalation, session revocation, self/last-admin protections, concurrent deletion, support start/end/expiry, mutation blocking, reset link expiry/single-use, soft deletion/restoration, and audit redaction. Before production rollout, smoke-test transactions on a staging MongoDB replica set and confirm a reset email arrives through your configured Resend sender.

API entry points: `GET /api/admin/overview`, `GET /api/admin/users`, `GET /api/admin/users/:id`, `GET /api/admin/audit`, and `POST /api/admin/users/:id/:operation`. End support through `POST /api/auth/impersonation/end` using the original administrator bearer session. Recovery uses `POST /api/auth/reset-password`.
