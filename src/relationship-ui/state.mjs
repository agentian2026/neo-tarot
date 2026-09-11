import { QUESTIONS, VERSIONS } from '../relationship-core/definition.mjs';
import { resolveAssetSnapshot } from '../card-assets/selector.mjs';
import { PRESENTATION_PREFERENCES } from './presentation.mjs';

export const SESSION_STORAGE_KEY = 'neoTarotRelationshipAssessmentV1';
const QUESTION_IDS = new Set(QUESTIONS.map(({ question_id }) => question_id));
const PREFERENCE_VALUES = new Set(PRESENTATION_PREFERENCES.map(({ value }) => value));

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createAssessmentState(assessmentInstanceId = globalThis.crypto?.randomUUID?.()) {
  if (!UUID_V4_PATTERN.test(assessmentInstanceId ?? '')) throw new Error('Secure assessment instance ID unavailable');
  return {
    versions: { ...VERSIONS },
    assessment_instance_id: assessmentInstanceId,
    current_question_index: 0,
    answers_by_question: {},
    presentation_preference: null,
    result: null,
    asset_selection: null,
  };
}

export function setAnswer(state, questionId, optionId) {
  const question = QUESTIONS.find((candidate) => candidate.question_id === questionId);
  if (!question || !question.options.some((option) => option.option_id === optionId)) {
    throw new TypeError('Unknown question or option');
  }
  return {
    ...state,
    answers_by_question: { ...state.answers_by_question, [questionId]: optionId },
    result: null,
    asset_selection: null,
  };
}

export function setPresentationPreference(state, value) {
  if (!PREFERENCE_VALUES.has(value)) throw new TypeError('Unknown presentation preference');
  return { ...state, presentation_preference: value, result: null, asset_selection: null };
}

export function toAnswerRecords(state) {
  return QUESTIONS
    .filter(({ question_id }) => state.answers_by_question[question_id])
    .map(({ question_id }) => ({ question_id, option_id: state.answers_by_question[question_id] }));
}

export function canEvaluate(state) {
  return toAnswerRecords(state).length === QUESTIONS.length && PREFERENCE_VALUES.has(state.presentation_preference);
}

export function withCurrentQuestion(state, index) {
  const bounded = Math.max(0, Math.min(QUESTIONS.length - 1, index));
  return { ...state, current_question_index: bounded };
}

export function withResult(state, result) {
  if (result?.status !== 'OK') throw new TypeError('Only a valid engine result can be stored');
  return { ...state, result, asset_selection: null };
}

export function withAssetSelection(state, assetSelection) {
  if (assetSelection?.status !== 'OK' || !resolveAssetSnapshot(assetSelection)) throw new TypeError('Only a valid asset selection can be stored');
  return { ...state, asset_selection: { ...assetSelection } };
}

export function serializeSessionState(state) {
  return JSON.stringify(state);
}

export function restoreSessionState(serialized) {
  if (!serialized) return createAssessmentState();
  try {
    const parsed = JSON.parse(serialized);
    if (!parsed?.versions || Object.entries(VERSIONS).some(([key, value]) => parsed.versions[key] !== value)) {
      return createAssessmentState();
    }
    if (!UUID_V4_PATTERN.test(parsed.assessment_instance_id ?? '')) return createAssessmentState();
    if (!parsed.answers_by_question || typeof parsed.answers_by_question !== 'object') return createAssessmentState();
    for (const [questionId, optionId] of Object.entries(parsed.answers_by_question)) {
      if (!QUESTION_IDS.has(questionId)) return createAssessmentState();
      const question = QUESTIONS.find((candidate) => candidate.question_id === questionId);
      if (!question.options.some((option) => option.option_id === optionId)) return createAssessmentState();
    }
    if (parsed.presentation_preference !== null && !PREFERENCE_VALUES.has(parsed.presentation_preference)) return createAssessmentState();
    if (parsed.result && parsed.result.status !== 'OK') return createAssessmentState();
    const assetSelection = resolveAssetSnapshot(parsed.asset_selection) ? parsed.asset_selection : null;
    return {
      ...createAssessmentState(parsed.assessment_instance_id),
      ...parsed,
      current_question_index: Math.max(0, Math.min(QUESTIONS.length - 1, Number(parsed.current_question_index) || 0)),
      asset_selection: assetSelection,
    };
  } catch {
    return createAssessmentState();
  }
}
