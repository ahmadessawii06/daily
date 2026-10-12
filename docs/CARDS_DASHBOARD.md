# Cards dashboard — Phase 1

This change adds a category-based daily workspace beside the existing timeline. Both views edit the same daily task records. The implementation is on `feature/cards-dashboard-phase-one`.

## Behavior

- New accounts start in Cards. Accounts without workspace metadata retain Timeline; their first explicit switch is saved and synchronized.
- Add a task inside a card by entering a title and pressing Enter. Its start time, end time and duration remain unset unless supplied later.
- Create cards, edit names and icons, or collapse them. Preferences belong to the account and persist across dates.
- Removing a card leaves every associated task on its original date. Those tasks appear under **Unassigned**, and can be reassigned in the task editor.
- Timeline retains inline editing, completion states, filters, arbitrary start times, and the optional 24-hour template. Untimed tasks have a separate section.
- Prayer times, authentication, archive, statistics, language, themes and image export remain available. Exports temporarily reveal collapsed card contents and then restore the layout.
- A full-width prayer card shows exactly five prayer slots. It reuses matching daily tasks; an empty slot creates a completed, untimed task only when clicked. Extra worship tasks and duplicate prayer records remain in category cards. Scheduling an existing prayer updates its time without duplicating or resetting its status.
- The prayer card appears first on every selected day, with independent daily completion, prayer labels and time-of-day icons. Completing all five reveals a compact 100% completion banner and a small, randomly selected Quranic verse. The verse stays stable during ordinary UI updates; changing a prayer back to incomplete hides both messages.

## Data and compatibility

`DayRecord.tasks` remains the only task store. `Task.categoryId` is optional; legacy `category`, task IDs, timestamps, notes, duration and completion history are retained. Cards hide unnamed hourly placeholders without deleting them.

`Account.state.workspace` is an optional metadata object containing category records, the selected view and change timestamps. New registrations initialize it; old accounts require no database migration. It uses the existing authenticated batch endpoint and account revision check.

Workspace changes have their own queue entry. Categories merge by ID and timestamp, independently from the view preference. Deletion markers prevent stale devices from reviving removed cards. Edits made during a sync stay queued and merge remote metadata. A backend that does not return workspace support cannot silently acknowledge workspace edits.

The browser continues to use account-scoped local storage. New Cards days start empty; legacy Timeline days retain hourly initialization. Switching views never rewrites an existing day.

Cached sessions open immediately and synchronize in the background. A fresh sign-in, or a restored session without any cached workspace or days, waits for the first sync before initializing a day.

## Files

| Area | Files |
| --- | --- |
| Dashboard UI | `src/components/CardsDashboard.tsx`, `CategoryEditor.tsx`, `PrayerCard.tsx`, `src/utils/prayerTasks.ts` |
| Shared view integration | `src/App.tsx`, `AddTaskModal.tsx`, `EditTaskModal.tsx`, `TaskList.tsx`, `TaskRow.tsx` |
| Workspace model and persistence | `src/types/index.ts`, `src/shared/workspace.ts`, `src/utils/workspace.ts`, `src/utils/storage.ts` |
| API and synchronization | `backend/app.ts`, `backend/repository.ts`, `src/services/api.ts`, `syncEngine.ts`, `syncQueue.ts`, `src/components/LoginScreen.tsx` |
| Full-content export | `src/utils/exportDailyTrack.ts` |
| Regression tests | `tests/dashboard.test.ts`, `prayerTasks.test.ts`, `client.test.ts`, `backend.test.ts`, `vercel.test.ts` |

## Validation

Run `npm test` and `npm run build` (the build includes TypeScript checking).

Regression coverage includes view defaults, account isolation, empty Cards days, exact legacy task preservation, untimed creation and editing, category removal, stale uploads, independent category merges, edits during sync, API persistence and native Node ESM imports for Vercel.

Browser validation uses an isolated local file database, with new and legacy account fixtures. It covers Enter-to-add, completion/editing/deletion across views, real API synchronization, remembered preferences after fresh sign-in, category editing, prayer insertion, archive/statistics access, PNG export, Arabic/English, both themes, and 320/390/1440px layouts.

## Limits and review notes

- Simultaneous edits to the same category use its latest timestamp; this is not field-by-field collaborative editing. Category deletion wins over stale edits.
- Existing weekly analytics retain their existing title-based classification; custom card names do not redefine historical report categories.
- Validation does not contact a production Atlas database. A Vercel preview and Safari/iOS testing are still appropriate before a production merge.
- The existing large export bundle warning remains. No dependencies were added.
- Rebalancing, recurring-task generation, automatic carryover and advanced resizing are outside this phase.
