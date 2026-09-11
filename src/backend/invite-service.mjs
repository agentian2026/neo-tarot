import { evaluateRelationshipOnServer } from './relationship-evaluate.mjs';

export const INVITE_TTL_DAYS = 7;
export const INVITE_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
export const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const ANALYTICS_EVENT_NAMES = Object.freeze([
  'individual_result_viewed',
  'invite_cta_clicked',
  'invite_created',
  'invite_share_clicked',
  'invite_landing_viewed',
  'invite_assessment_started',
  'invite_assessment_completed',
  'pair_ready',
]);

export function secureUuid() {
  if (!globalThis.crypto?.randomUUID) throw new Error('Secure UUID unavailable');
  return globalThis.crypto.randomUUID();
}

export function secureInviteToken() {
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure random unavailable');
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function validUuid(value) {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value);
}

function snapshotRpcParams(evaluated, payload) {
  return {
    p_participant_id: payload.participant_id,
    p_assessment_instance_id: evaluated.assessment_instance_id,
    p_assessment_version: evaluated.versions.assessment_version,
    p_question_version: evaluated.versions.question_version,
    p_scoring_version: evaluated.versions.scoring_version,
    p_archetype_version: evaluated.versions.archetype_version,
    p_tarot_version: evaluated.versions.tarot_version,
    p_answers_json: evaluated.answers,
    p_relationship_vector_json: evaluated.relationship_vector,
    p_primary_archetype_id: evaluated.archetype_result.primary.archetype_id,
    p_secondary_archetype_id: evaluated.archetype_result.secondary.archetype_id,
    p_classification: evaluated.archetype_result.classification,
    p_tarot_expression_id: evaluated.tarot_result.tarot_expression_id,
    p_presentation_preference: payload.presentation_preference,
    p_selected_asset_id: evaluated.asset_result.selected_asset_id,
    p_asset_manifest_version: evaluated.asset_result.asset_manifest_version,
    p_selection_algorithm_version: evaluated.asset_result.selection_algorithm_version,
  };
}

const errorResult = (error) => ({ status: 'ERROR', error });

export async function handleInviteOperation(payload, database) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !database?.rpc) return errorResult('INVALID_REQUEST');
  if (!validUuid(payload.participant_id)) return errorResult('INVALID_REQUEST');
  try {
    if (payload.action === 'create') {
      if (!validUuid(payload.create_request_id)) return errorResult('INVALID_REQUEST');
      const evaluated = await evaluateRelationshipOnServer(payload);
      if (evaluated.status !== 'OK') return evaluated;
      const row = await database.rpc('create_invite_v2', {
        p_create_request_id: payload.create_request_id,
        p_public_token: secureInviteToken(),
        ...snapshotRpcParams(evaluated, payload),
      });
      if (!row?.ok) return errorResult(row?.error ?? 'PAIR_CREATION_FAILED');
      return { status: 'OK', invite_status: row.status, invite_token: row.public_token, expires_at: row.expires_at, reused: row.reused };
    }
    if (payload.action === 'status' || payload.action === 'inviter_status') {
      if (!INVITE_TOKEN_PATTERN.test(payload.invite_token ?? '')) return errorResult('INVALID_INVITE');
      const row = await database.rpc('get_invite_status_v1', {
        p_public_token: payload.invite_token,
        p_participant_id: payload.participant_id,
        p_inviter_view: payload.action === 'inviter_status',
      });
      if (!row?.ok) return errorResult(row?.error ?? 'INVALID_INVITE');
      return { status: 'OK', invite_status: row.status };
    }
    if (payload.action === 'pair_result') {
      if (!validUuid(payload.pair_id)) return errorResult('INVALID_REQUEST');
      const row = await database.rpc('get_relationship_pair_for_result_v1', {
        p_pair_id: payload.pair_id,
        p_participant_id: payload.participant_id,
      });
      if (!row?.ok) return errorResult(row?.error ?? 'INVALID_INVITE');
      return { status: 'OK', pair: row.pair };
    }
    if (payload.action === 'accept') {
      if (!validUuid(payload.accept_request_id) || !INVITE_TOKEN_PATTERN.test(payload.invite_token ?? '')) return errorResult('INVALID_REQUEST');
      const evaluated = await evaluateRelationshipOnServer(payload);
      if (evaluated.status !== 'OK') return evaluated;
      const row = await database.rpc('accept_invite_v2', {
        p_public_token: payload.invite_token,
        p_accept_request_id: payload.accept_request_id,
        ...snapshotRpcParams(evaluated, payload),
      });
      if (!row?.ok) return errorResult(row?.error ?? 'PAIR_CREATION_FAILED');
      return { status: 'OK', invite_status: 'PAIR_READY', ...(payload.include_pair_id && row.pair_id ? { pair_id: row.pair_id } : {}), idempotent: row.idempotent };
    }
    return errorResult('INVALID_REQUEST');
  } catch {
    return errorResult('SERVER_ERROR');
  }
}
