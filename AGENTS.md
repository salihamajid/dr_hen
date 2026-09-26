<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Data access rules: auth and farmer scoping (do not weaken)

Roles are ADMIN and FARMER. `src/proxy.ts` is only a first filter: it reads the signed cookie and never
touches the database, so it can't see revoked sessions. The real enforcement is the Data Access Layer,
`src/lib/auth/dal.ts`. Every page and route handler that reads or writes data must call it itself.

1. **`farmerId` comes only from the session.** Get it from `requireFarmer()` (pages) or
   `requireFarmerApi()` (route handlers). Never take a farmer id from a request body, query string or URL
   segment. That is why farmer endpoints are `/api/farmer/...` and not `/api/farmers/[id]/...`.
2. **Filter client-supplied ids, never fetch-then-compare.** A flock, alert or report id from the request
   is only ever a filter beside the session's id: `findFirst({ where: { id, farmerId } })`. Don't use
   `findUnique({ where: { id } })` on farmer-owned models (Flock, DailyReport, Alert, Message, ...) in
   farmer code.
3. **Scoped writes.** Use `updateMany` / `deleteMany` with `farmerId` in the `where`, and treat a count
   of 0 as "not found". Return 404, not 403, so ids of other farmers' records aren't revealed.
4. **Every admin route handler calls `requireAdminApi()`; every admin page that reads data calls
   `requireAdmin()`.** Public exceptions are only `/api/auth/*` and `/api/whatsapp/webhook` (Meta
   authenticates by HMAC signature). Farmer API routes return JSON 401, never a redirect.
5. **Validate every write with a zod schema** (see `src/lib/validators/`), and never put `farmerId`,
   `role`, `status` or `active` in one. `parseJsonBody` also requires `application/json`.
6. **Medicine safety is unchanged:** medicine names reach farmers only through `buildFarmerReply` from
   `DISEASE_PROTOCOL`. Farmer-typed text such as `DailyReport.medicineGiven` is a record, and must never
   be passed to the AI or shown as a recommendation.
7. **Capacitor:** the Android app is a WebView on `server.url`. Cookie sessions rely on that. Don't
   switch it to a static export or the login design stops working.

Run `node scripts/check-auth.mjs` before committing; it fails if a handler or page is missing its check.
