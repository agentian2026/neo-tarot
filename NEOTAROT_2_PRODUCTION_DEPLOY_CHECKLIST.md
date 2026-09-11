# NeoTarot 2.0 Production Deploy Checklist

## Frontend

- Deploy the static site root (`index.html`, `couple.html`, `cards/`, `src/`) using the existing static hosting target.
- Verify `/` starts the Relationship v2 flow and `/couple.html?pair=<opaque-id>` remains reachable.

## Supabase migrations

Apply, in filename order, if not already applied:

- `supabase/migrations/20260902000000_backend_foundation.sql`
- `supabase/migrations/20260902010000_invite_pair_v1.sql`
- `supabase/migrations/20260902020000_assessment_instance_provenance_v1.sql`
- `supabase/migrations/20260910030000_pair_result_read_v1.sql`

Remote migration state: UNKNOWN (not queried in this phase).

## Edge Functions

- `supabase/functions/relationship-evaluate/index.ts`
- `supabase/functions/relationship-invite/index.ts` (create, accept, status, pair_result)

Deploy both after migrations; current remote state: UNKNOWN.

## Environment

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (public client configuration)
- `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions only; never browser)

## Order and smoke test

1. Apply migrations.
2. Deploy Edge Functions and configure server secrets.
3. Publish static frontend/assets.
4. In two independent browser sessions: A completes, creates invite; B accepts and completes; verify Couple Result, refresh, A revisit, and share fallback.

## Rollback

Keep the previous static artifact and Edge Function versions available for rollback. Do not apply destructive database changes; revert frontend/function versions first.
