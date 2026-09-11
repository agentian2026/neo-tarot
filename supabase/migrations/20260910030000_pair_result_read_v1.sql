create or replace function public.get_relationship_pair_for_result_v1(
  p_pair_id uuid,
  p_participant_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_pair public.relationship_pairs; v_a public.profile_snapshots; v_b public.profile_snapshots;
begin
  select * into v_pair from public.relationship_pairs where id = p_pair_id;
  if not found then return jsonb_build_object('ok',false,'error','INVALID_INVITE'); end if;
  select * into v_a from public.profile_snapshots where id = v_pair.profile_a_snapshot_id;
  select * into v_b from public.profile_snapshots where id = v_pair.profile_b_snapshot_id;
  if not found or v_a.participant_id <> p_participant_id and v_b.participant_id <> p_participant_id then
    return jsonb_build_object('ok',false,'error','INVALID_INVITE');
  end if;
  return jsonb_build_object('ok',true,'pair',jsonb_build_object(
    'pair_id',v_pair.id,'participantA',jsonb_build_object('participant_id',v_a.participant_id,'relationship_vector',v_a.relationship_vector_json),
    'participantB',jsonb_build_object('participant_id',v_b.participant_id,'relationship_vector',v_b.relationship_vector_json)
  ));
end; $$;
revoke all on function public.get_relationship_pair_for_result_v1(uuid,uuid) from public, anon, authenticated;
grant execute on function public.get_relationship_pair_for_result_v1(uuid,uuid) to service_role;
