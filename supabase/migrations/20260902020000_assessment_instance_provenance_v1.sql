alter table public.profile_snapshots
  add column assessment_instance_id uuid not null default gen_random_uuid();

create index profile_snapshots_assessment_instance_idx
  on public.profile_snapshots (assessment_instance_id);

create function public.assign_assessment_instance_id()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_id text;
begin
  v_id := current_setting('neotarot.assessment_instance_id', true);
  if v_id is not null and v_id <> '' then
    new.assessment_instance_id := v_id::uuid;
  end if;
  return new;
end;
$$;

create trigger profile_snapshots_assessment_instance
before insert on public.profile_snapshots
for each row execute function public.assign_assessment_instance_id();

create function public.create_invite_v2(
  p_create_request_id uuid,
  p_public_token text,
  p_participant_id uuid,
  p_assessment_instance_id uuid,
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
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
  perform set_config('neotarot.assessment_instance_id', p_assessment_instance_id::text, true);
  v_result := public.create_invite_v1(
    p_create_request_id, p_public_token, p_participant_id, p_assessment_version,
    p_question_version, p_scoring_version, p_archetype_version, p_tarot_version,
    p_answers_json, p_relationship_vector_json, p_primary_archetype_id,
    p_secondary_archetype_id, p_classification, p_tarot_expression_id,
    p_presentation_preference, p_selected_asset_id, p_asset_manifest_version,
    p_selection_algorithm_version
  );
  return v_result;
end;
$$;

create function public.accept_invite_v2(
  p_public_token text,
  p_accept_request_id uuid,
  p_participant_id uuid,
  p_assessment_instance_id uuid,
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
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
  perform set_config('neotarot.assessment_instance_id', p_assessment_instance_id::text, true);
  v_result := public.accept_invite_v1(
    p_public_token, p_accept_request_id, p_participant_id, p_assessment_version,
    p_question_version, p_scoring_version, p_archetype_version, p_tarot_version,
    p_answers_json, p_relationship_vector_json, p_primary_archetype_id,
    p_secondary_archetype_id, p_classification, p_tarot_expression_id,
    p_presentation_preference, p_selected_asset_id, p_asset_manifest_version,
    p_selection_algorithm_version
  );
  return v_result;
end;
$$;

revoke all on function public.create_invite_v2(uuid,text,uuid,uuid,text,text,text,text,text,jsonb,jsonb,text,text,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.accept_invite_v2(text,uuid,uuid,uuid,text,text,text,text,text,jsonb,jsonb,text,text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_invite_v2(uuid,text,uuid,uuid,text,text,text,text,text,jsonb,jsonb,text,text,text,text,text,text,text,text) to service_role;
grant execute on function public.accept_invite_v2(text,uuid,uuid,uuid,text,text,text,text,text,jsonb,jsonb,text,text,text,text,text,text,text,text) to service_role;

comment on column public.profile_snapshots.assessment_instance_id is 'Secure assessment lifecycle identifier; Tarot profile_id provenance, distinct from snapshot primary key.';
