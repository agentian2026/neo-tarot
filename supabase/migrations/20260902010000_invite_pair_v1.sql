create table public.profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null,
  created_at timestamptz not null default now(),
  assessment_version text not null,
  question_version text not null,
  scoring_version text not null,
  archetype_version text not null,
  tarot_version text not null,
  answers_json jsonb not null check (jsonb_typeof(answers_json) = 'array' and jsonb_array_length(answers_json) = 15),
  relationship_vector_json jsonb not null check (jsonb_typeof(relationship_vector_json) = 'object'),
  primary_archetype_id text not null,
  secondary_archetype_id text not null,
  classification text not null check (classification in ('CLEAR', 'MIXED', 'HYBRID')),
  tarot_expression_id text not null,
  presentation_preference text not null check (presentation_preference in ('MASCULINE', 'FEMININE', 'ANY')),
  selected_asset_id text not null,
  asset_manifest_version text not null,
  selection_algorithm_version text not null,
  status text not null default 'VALID' check (status = 'VALID')
);

create table public.relationship_invites (
  id uuid primary key default gen_random_uuid(),
  create_request_id uuid not null unique,
  public_token text not null unique check (public_token ~ '^[0-9a-f]{64}$'),
  inviter_profile_snapshot_id uuid not null references public.profile_snapshots(id),
  status text not null default 'OPEN' check (status in ('OPEN', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_profile_snapshot_id uuid references public.profile_snapshots(id),
  pair_id uuid,
  accept_request_id uuid unique,
  check (expires_at > created_at),
  check (
    (status = 'OPEN' and accepted_at is null and accepted_profile_snapshot_id is null and pair_id is null and accept_request_id is null)
    or (status = 'ACCEPTED' and accepted_at is not null and accepted_profile_snapshot_id is not null and pair_id is not null and accept_request_id is not null)
    or (status in ('EXPIRED', 'REVOKED') and accepted_at is null and accepted_profile_snapshot_id is null and pair_id is null and accept_request_id is null)
  )
);

create unique index relationship_invites_one_open_per_snapshot
  on public.relationship_invites (inviter_profile_snapshot_id)
  where status = 'OPEN';
create index relationship_invites_token_lookup on public.relationship_invites (public_token);

create table public.relationship_pairs (
  id uuid primary key default gen_random_uuid(),
  profile_a_snapshot_id uuid not null references public.profile_snapshots(id),
  profile_b_snapshot_id uuid not null references public.profile_snapshots(id),
  source_invite_id uuid not null unique references public.relationship_invites(id),
  created_at timestamptz not null default now(),
  status text not null default 'PAIR_READY' check (status = 'PAIR_READY'),
  check (profile_a_snapshot_id <> profile_b_snapshot_id)
);

alter table public.relationship_invites
  add constraint relationship_invites_pair_fk
  foreign key (pair_id) references public.relationship_pairs(id);

alter table public.profile_snapshots enable row level security;
alter table public.relationship_invites enable row level security;
alter table public.relationship_pairs enable row level security;

revoke all on public.profile_snapshots from anon, authenticated;
revoke all on public.relationship_invites from anon, authenticated;
revoke all on public.relationship_pairs from anon, authenticated;
grant select, insert, delete on public.profile_snapshots to service_role;
grant select, insert, update, delete on public.relationship_invites to service_role;
grant select, insert, delete on public.relationship_pairs to service_role;

create function public.reject_immutable_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'IMMUTABLE_RECORD';
end;
$$;

create trigger profile_snapshots_immutable
before update on public.profile_snapshots
for each row execute function public.reject_immutable_update();

create trigger relationship_pairs_immutable
before update on public.relationship_pairs
for each row execute function public.reject_immutable_update();

create function public.create_invite_v1(
  p_create_request_id uuid,
  p_public_token text,
  p_participant_id uuid,
  p_assessment_version text,
  p_question_version text,
  p_scoring_version text,
  p_archetype_version text,
  p_tarot_version text,
  p_answers_json jsonb,
  p_relationship_vector_json jsonb,
  p_primary_archetype_id text,
  p_secondary_archetype_id text,
  p_classification text,
  p_tarot_expression_id text,
  p_presentation_preference text,
  p_selected_asset_id text,
  p_asset_manifest_version text,
  p_selection_algorithm_version text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_existing public.relationship_invites;
  v_profile_id uuid;
  v_invite_id uuid;
begin
  select * into v_existing
  from public.relationship_invites
  where create_request_id = p_create_request_id;

  if found then
    if (select participant_id from public.profile_snapshots where id = v_existing.inviter_profile_snapshot_id) <> p_participant_id then
      return jsonb_build_object('ok', false, 'error', 'INVALID_REQUEST');
    end if;
    return jsonb_build_object(
      'ok', true,
      'reused', true,
      'invite_id', v_existing.id,
      'profile_snapshot_id', v_existing.inviter_profile_snapshot_id,
      'public_token', v_existing.public_token,
      'status', case when v_existing.status = 'OPEN' and v_existing.expires_at <= statement_timestamp() then 'EXPIRED' else v_existing.status end,
      'expires_at', v_existing.expires_at
    );
  end if;

  insert into public.profile_snapshots (
    participant_id, assessment_version, question_version, scoring_version, archetype_version, tarot_version,
    answers_json, relationship_vector_json, primary_archetype_id, secondary_archetype_id, classification,
    tarot_expression_id, presentation_preference, selected_asset_id, asset_manifest_version, selection_algorithm_version
  ) values (
    p_participant_id, p_assessment_version, p_question_version, p_scoring_version, p_archetype_version, p_tarot_version,
    p_answers_json, p_relationship_vector_json, p_primary_archetype_id, p_secondary_archetype_id, p_classification,
    p_tarot_expression_id, p_presentation_preference, p_selected_asset_id, p_asset_manifest_version, p_selection_algorithm_version
  ) returning id into v_profile_id;

  insert into public.relationship_invites (
    create_request_id, public_token, inviter_profile_snapshot_id, expires_at
  ) values (
    p_create_request_id, p_public_token, v_profile_id, statement_timestamp() + interval '7 days'
  ) returning id into v_invite_id;

  return jsonb_build_object(
    'ok', true, 'reused', false, 'invite_id', v_invite_id, 'profile_snapshot_id', v_profile_id,
    'public_token', p_public_token, 'status', 'OPEN', 'expires_at', statement_timestamp() + interval '7 days'
  );
end;
$$;

create function public.get_invite_status_v1(p_public_token text, p_participant_id uuid, p_inviter_view boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_invite public.relationship_invites;
  v_inviter_participant uuid;
begin
  if p_public_token !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'error', 'INVALID_INVITE');
  end if;
  select * into v_invite from public.relationship_invites where public_token = p_public_token;
  if not found then return jsonb_build_object('ok', false, 'error', 'INVALID_INVITE'); end if;
  select participant_id into v_inviter_participant from public.profile_snapshots where id = v_invite.inviter_profile_snapshot_id;
  if p_inviter_view then
    if v_inviter_participant <> p_participant_id then return jsonb_build_object('ok', false, 'error', 'INVALID_INVITE'); end if;
    return jsonb_build_object('ok', true, 'status', case when v_invite.status = 'ACCEPTED' then 'PAIR_READY' when v_invite.status = 'OPEN' and v_invite.expires_at <= statement_timestamp() then 'EXPIRED' else v_invite.status end);
  end if;
  if v_inviter_participant = p_participant_id then return jsonb_build_object('ok', false, 'error', 'SELF_INVITE'); end if;
  if v_invite.status = 'ACCEPTED' then return jsonb_build_object('ok', false, 'error', 'ALREADY_ACCEPTED'); end if;
  if v_invite.status = 'EXPIRED' or (v_invite.status = 'OPEN' and v_invite.expires_at <= statement_timestamp()) then
    return jsonb_build_object('ok', false, 'error', 'EXPIRED_INVITE');
  end if;
  if v_invite.status <> 'OPEN' then return jsonb_build_object('ok', false, 'error', 'INVALID_INVITE'); end if;
  return jsonb_build_object('ok', true, 'status', 'OPEN');
end;
$$;

create function public.accept_invite_v1(
  p_public_token text,
  p_accept_request_id uuid,
  p_participant_id uuid,
  p_assessment_version text,
  p_question_version text,
  p_scoring_version text,
  p_archetype_version text,
  p_tarot_version text,
  p_answers_json jsonb,
  p_relationship_vector_json jsonb,
  p_primary_archetype_id text,
  p_secondary_archetype_id text,
  p_classification text,
  p_tarot_expression_id text,
  p_presentation_preference text,
  p_selected_asset_id text,
  p_asset_manifest_version text,
  p_selection_algorithm_version text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_invite public.relationship_invites;
  v_inviter public.profile_snapshots;
  v_profile_b_id uuid;
  v_pair_id uuid;
begin
  if p_public_token !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok', false, 'error', 'INVALID_INVITE'); end if;
  select * into v_invite from public.relationship_invites where public_token = p_public_token for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'INVALID_INVITE'); end if;

  if v_invite.status = 'ACCEPTED' then
    if v_invite.accept_request_id = p_accept_request_id then
      return jsonb_build_object('ok', true, 'idempotent', true, 'status', 'PAIR_READY', 'pair_id', v_invite.pair_id, 'profile_snapshot_id', v_invite.accepted_profile_snapshot_id);
    end if;
    return jsonb_build_object('ok', false, 'error', 'ALREADY_ACCEPTED');
  end if;
  if v_invite.status = 'EXPIRED' or (v_invite.status = 'OPEN' and v_invite.expires_at <= statement_timestamp()) then
    if v_invite.status = 'OPEN' then update public.relationship_invites set status = 'EXPIRED' where id = v_invite.id; end if;
    return jsonb_build_object('ok', false, 'error', 'EXPIRED_INVITE');
  end if;
  if v_invite.status <> 'OPEN' then return jsonb_build_object('ok', false, 'error', 'INVALID_INVITE'); end if;

  select * into v_inviter from public.profile_snapshots where id = v_invite.inviter_profile_snapshot_id;
  if v_inviter.participant_id = p_participant_id then return jsonb_build_object('ok', false, 'error', 'SELF_INVITE'); end if;
  if (v_inviter.assessment_version, v_inviter.question_version, v_inviter.scoring_version, v_inviter.archetype_version, v_inviter.tarot_version)
    is distinct from (p_assessment_version, p_question_version, p_scoring_version, p_archetype_version, p_tarot_version) then
    return jsonb_build_object('ok', false, 'error', 'PAIR_VERSION_MISMATCH');
  end if;

  insert into public.profile_snapshots (
    participant_id, assessment_version, question_version, scoring_version, archetype_version, tarot_version,
    answers_json, relationship_vector_json, primary_archetype_id, secondary_archetype_id, classification,
    tarot_expression_id, presentation_preference, selected_asset_id, asset_manifest_version, selection_algorithm_version
  ) values (
    p_participant_id, p_assessment_version, p_question_version, p_scoring_version, p_archetype_version, p_tarot_version,
    p_answers_json, p_relationship_vector_json, p_primary_archetype_id, p_secondary_archetype_id, p_classification,
    p_tarot_expression_id, p_presentation_preference, p_selected_asset_id, p_asset_manifest_version, p_selection_algorithm_version
  ) returning id into v_profile_b_id;

  insert into public.relationship_pairs (profile_a_snapshot_id, profile_b_snapshot_id, source_invite_id)
  values (v_invite.inviter_profile_snapshot_id, v_profile_b_id, v_invite.id)
  returning id into v_pair_id;

  update public.relationship_invites set
    status = 'ACCEPTED', accepted_at = statement_timestamp(), accepted_profile_snapshot_id = v_profile_b_id,
    pair_id = v_pair_id, accept_request_id = p_accept_request_id
  where id = v_invite.id;

  return jsonb_build_object('ok', true, 'idempotent', false, 'status', 'PAIR_READY', 'pair_id', v_pair_id, 'profile_snapshot_id', v_profile_b_id);
end;
$$;

revoke all on function public.create_invite_v1(uuid,text,uuid,text,text,text,text,text,jsonb,jsonb,text,text,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.get_invite_status_v1(text,uuid,boolean) from public, anon, authenticated;
revoke all on function public.accept_invite_v1(text,uuid,uuid,text,text,text,text,text,jsonb,jsonb,text,text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_invite_v1(uuid,text,uuid,text,text,text,text,text,jsonb,jsonb,text,text,text,text,text,text,text,text) to service_role;
grant execute on function public.get_invite_status_v1(text,uuid,boolean) to service_role;
grant execute on function public.accept_invite_v1(text,uuid,uuid,text,text,text,text,text,jsonb,jsonb,text,text,text,text,text,text,text,text) to service_role;

comment on table public.profile_snapshots is 'Immutable server-calculated Person Engine snapshots.';
comment on table public.relationship_invites is 'One-completion anonymous invite records; public_token is a 256-bit bearer secret protected by RLS.';
comment on table public.relationship_pairs is 'Immutable inviter/invitee snapshot membership, ending Phase 3-A at PAIR_READY.';
