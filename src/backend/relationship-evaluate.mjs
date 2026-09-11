import { VERSIONS } from '../relationship-core/definition.mjs';
import { evaluateAssessment } from '../relationship-core/engine.mjs';
import { selectCardAsset } from '../card-assets/selector.mjs';
import { ASSET_VERSIONS, PRESENTATION_FILTER } from '../card-assets/vocabulary.mjs';

export const SERVER_ERROR_CODES = Object.freeze({
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_ANSWERS: 'INVALID_ANSWERS',
  VERSION_MISMATCH: 'VERSION_MISMATCH',
  INVALID_PRESENTATION: 'INVALID_PRESENTATION',
  SERVER_ERROR: 'SERVER_ERROR',
});

const CORE_VERSION_KEYS = Object.freeze(Object.keys(VERSIONS));

function exactVersions(input, expected, keys) {
  return input && typeof input === 'object'
    && keys.every((key) => input[key] === expected[key]);
}

export async function evaluateRelationshipOnServer(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { status: 'ERROR', error: SERVER_ERROR_CODES.INVALID_REQUEST };
  }
  if (!exactVersions(payload.versions, VERSIONS, CORE_VERSION_KEYS)
    || payload.asset_manifest_version !== ASSET_VERSIONS.asset_manifest_version
    || payload.selection_algorithm_version !== ASSET_VERSIONS.selection_algorithm_version) {
    return { status: 'ERROR', error: SERVER_ERROR_CODES.VERSION_MISMATCH };
  }
  if (!(payload.presentation_preference in PRESENTATION_FILTER)) {
    return { status: 'ERROR', error: SERVER_ERROR_CODES.INVALID_PRESENTATION };
  }
  const assessment = await evaluateAssessment({
    answers: payload.answers,
    assessment_instance_id: payload.assessment_instance_id,
    versions: Object.fromEntries(CORE_VERSION_KEYS.map((key) => [key, payload.versions[key]])),
  });
  if (assessment.status !== 'OK') {
    return { status: 'ERROR', error: SERVER_ERROR_CODES.INVALID_ANSWERS };
  }
  const selection = await selectCardAsset({
    answers: assessment.answers,
    versions: assessment.versions,
    tarot_expression_id: assessment.tarot_result.tarot_expression_id,
    presentation_preference: payload.presentation_preference,
  });
  if (selection.status !== 'OK') {
    return { status: 'ERROR', error: SERVER_ERROR_CODES.SERVER_ERROR };
  }
  return Object.freeze({
    status: 'OK',
    versions: assessment.versions,
    assessment_instance_id: assessment.assessment_instance_id,
    answers: assessment.answers,
    relationship_vector: assessment.relationship_vector,
    archetype_result: assessment.archetype_result,
    tarot_result: assessment.tarot_result,
    asset_result: selection,
  });
}
