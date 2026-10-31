# Staff tracking validation and release

Scope: frontend GPS lifecycle and admin freshness. Existing Nest auth, active staff profile checks, salary policy, wallet settlement, database schema and saved attendance remain unchanged. The new optional Axios AbortSignal preserves the existing POST body and endpoint.

The marketing page owns one GPS tracker per active session. It serializes location posts, throttles successful posts for 45 seconds, backs off failed watch events for five seconds, retries in the foreground, and disposes timers, watchers and pending requests on session change/unmount/logout. Denied location permission or HTTP 401/403 stops automatic tracking. Stale GPS samples and invalid coordinates are rejected before posting. A delayed location or network response from a stopped tracker cannot send or update the next shift. Account changes invalidate loaded profile responses; actions verify the current login before posting.

Optional localStorage reminder writes cannot turn accepted server GPS into a false failure. These reminders are UI-only; backend rules remain authoritative. Admin default day uses Asia/Kathmandu. Visible dashboard refreshes every thirty seconds and on focus/online; outdated filter and staff-search responses are ignored.

## Automated checks

`node scripts/test-staff-tracking.cjs` executes the actual tracker and admin loader with mocked geolocation/HTTP. It covers concurrent watch/heartbeat events, disposal and pending GPS grants, late HTTP responses, independent shifts, auth/permission denial, auto-completion, offline backoff/retry, invalid GPS, the Nepal date boundary and stale admin responses. No actual locations, staff attendance or wallet writes are submitted. CI also runs TypeScript and the production build.

## Required operator verification

Use designated test accounts in staging. Confirm marketing/reception access boundaries; start an allowed test shift; check one accepted GPS point and the admin row; switch dashboard date/type rapidly; simulate offline/online; deny permission; end the test shift; ensure no later GPS posts appear; log out/switch accounts and ensure the previous profile and watcher are gone. Confirm reception does not start a GPS watcher. Use synthetic records and an isolated wallet if testing settlement: this change does not verify payment amounts or production credits.

A web page cannot promise continuous GPS when a phone is locked, the browser is backgrounded or the application is closed. The UI now states this limit. An API request may already have reached the server before cancellation; AbortSignal does not undo server writes. Native background tracking, payroll correctness, multi-tab settlement races and real-device GPS accuracy are not established by these mocks.

## Release and rollback

Frontend-only, no migration or new backend deployment dependency. Before production, verify current frontend CI/build, role checks on the running API and actual browser behavior. The previous Vercel release remains the rollback candidate. Rollback the frontend deployment if the operator checks fail; no data rollback is required. Vercel previously reported a daily deployment quota limit; verify readiness rather than claiming release from a merged PR. VPS/API access remains necessary to diagnose server-only errors.
