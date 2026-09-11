import { ASSET_VERSIONS } from '../card-assets/vocabulary.mjs';

export const INVITE_API_URL = globalThis.location?.hostname === '127.0.0.1' || globalThis.location?.hostname === 'localhost'
  ? 'http://127.0.0.1:55321/functions/v1/relationship-invite'
  : 'https://qyuwgknhhuywgkjbichi.supabase.co/functions/v1/relationship-invite';
export const PARTICIPANT_STORAGE_KEY = 'neoTarotAnonymousParticipantV1';
export const INVITE_STORAGE_KEY = 'neoTarotInviteReferenceV1';

export function getOrCreateParticipantId(storage = localStorage) {
  const existing = storage.getItem(PARTICIPANT_STORAGE_KEY);
  if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing;
  const created = crypto.randomUUID();
  storage.setItem(PARTICIPANT_STORAGE_KEY, created);
  return created;
}

export function buildAssessmentPayload(state) {
  return {
    assessment_instance_id: state.assessment_instance_id,
    answers: Object.entries(state.answers_by_question).map(([question_id, option_id]) => ({ question_id, option_id })),
    versions: { ...state.versions },
    presentation_preference: state.presentation_preference,
    asset_manifest_version: ASSET_VERSIONS.asset_manifest_version,
    selection_algorithm_version: ASSET_VERSIONS.selection_algorithm_version,
  };
}

export async function callInviteApi(payload, fetchImpl = fetch) {
  const response = await fetchImpl(INVITE_API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({ status: 'ERROR', error: 'NETWORK_ERROR' }));
  if (!response.ok || result.status !== 'OK') throw Object.assign(new Error(result.error ?? 'NETWORK_ERROR'), { code: result.error ?? 'NETWORK_ERROR' });
  return result;
}

export function inviteUrl(token, locationLike = location) {
  const url = new URL(locationLike.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('invite', token);
  return url.toString();
}
