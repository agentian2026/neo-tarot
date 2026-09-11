create table public.backend_foundation_probe (
  id boolean primary key default true check (id),
  created_at timestamptz not null default now()
);

alter table public.backend_foundation_probe enable row level security;

revoke all on table public.backend_foundation_probe from anon, authenticated;
grant select, insert, update, delete on table public.backend_foundation_probe to service_role;

comment on table public.backend_foundation_probe is
  'Phase 3-0 local-only RLS capability probe; contains no product or user data.';

