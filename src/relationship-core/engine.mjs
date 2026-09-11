import { ARCHETYPES, AXES, CALIBRATION, QUESTIONS, TAROT_EXPRESSIONS, VERSIONS } from './definition.mjs';

export const INVALID_STATUS = 'ASSESSMENT_INCOMPLETE_OR_INVALID';
const AXIS_IDS = AXES.map(({ id }) => id);
const QUESTION_BY_ID = new Map(QUESTIONS.map((question) => [question.question_id, question]));
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function canonicalizeAnswers(answers) {
  return [...answers]
    .sort((a, b) => a.question_id.localeCompare(b.question_id))
    .map(({ question_id, option_id }) => `${question_id}=${option_id}`)
    .join('&');
}

export function validateAssessmentInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, status: INVALID_STATUS, errors: [{ code: 'INVALID_INPUT' }] };
  }
  const answers = Array.isArray(input.answers) ? input.answers : [];
  if (answers.length !== QUESTIONS.length) errors.push({ code: 'INVALID_ANSWER_COUNT', expected: 15, actual: answers.length });
  const seen = new Set();
  for (const answer of answers) {
    const questionId = answer?.question_id;
    const optionId = answer?.option_id;
    if (seen.has(questionId)) errors.push({ code: 'DUPLICATE_ANSWER', question_id: questionId });
    seen.add(questionId);
    const question = QUESTION_BY_ID.get(questionId);
    if (!question) {
      errors.push({ code: 'UNKNOWN_QUESTION', question_id: questionId });
      continue;
    }
    if (!question.options.some((candidate) => candidate.option_id === optionId)) {
      errors.push({ code: 'UNKNOWN_OPTION', question_id: questionId, option_id: optionId });
    }
  }
  for (const question of QUESTIONS) {
    if (!seen.has(question.question_id)) errors.push({ code: 'MISSING_ANSWER', question_id: question.question_id });
  }
  if (!input.versions || Object.entries(VERSIONS).some(([key, value]) => input.versions[key] !== value)) {
    errors.push({ code: 'VERSION_MISMATCH' });
  }
  if (typeof input.assessment_instance_id !== 'string' || !UUID_V4_PATTERN.test(input.assessment_instance_id)) {
    errors.push({ code: 'INVALID_ASSESSMENT_INSTANCE_ID' });
  }
  return errors.length ? { valid: false, status: INVALID_STATUS, errors } : { valid: true, errors: [] };
}

export function roundHalfUp(value) {
  return Math.floor(value + 0.5);
}

export function calculateRelationshipVector(answers) {
  const observations = Object.fromEntries(AXIS_IDS.map((axis) => [axis, []]));
  for (const answer of answers) {
    const selected = QUESTION_BY_ID.get(answer.question_id).options.find((candidate) => candidate.option_id === answer.option_id);
    for (const [axis, score] of Object.entries(selected.primary_scores)) {
      observations[axis].push({ question_id: answer.question_id, option_id: answer.option_id, score, weight: 1 });
    }
  }
  const relationshipVector = {};
  const axisEvidence = {};
  for (const axis of AXIS_IDS) {
    const evidence = observations[axis];
    if (evidence.length === 0) throw new Error(`No evidence for axis ${axis}`);
    const raw = evidence.reduce((sum, item) => sum + item.score, 0) / evidence.length;
    relationshipVector[axis] = Math.max(0, Math.min(100, roundHalfUp(raw)));
    axisEvidence[axis] = { observation_count: evidence.length, weighted_raw: raw, integer_value: relationshipVector[axis], observations: evidence };
  }
  return { relationship_vector: relationshipVector, axis_evidence: axisEvidence };
}

export function weightedDistance(personVector, target, weights) {
  let weightedSquares = 0;
  let totalWeight = 0;
  for (const axis of AXIS_IDS) {
    const weight = weights[axis];
    const normalizedDifference = (personVector[axis] - target[axis]) / 100;
    weightedSquares += weight * normalizedDifference ** 2;
    totalWeight += weight;
  }
  return weightedSquares / totalWeight;
}

export function classifyAbsoluteGap(absoluteGap) {
  if (absoluteGap >= CALIBRATION.classification.clear_min_absolute_gap) return 'CLEAR';
  if (absoluteGap >= CALIBRATION.classification.mixed_min_absolute_gap) return 'MIXED';
  return 'HYBRID';
}

export function selectArchetypes(personVector) {
  const ranked = ARCHETYPES.map((item) => ({ ...item, distance: weightedDistance(personVector, item.target, item.weights) }))
    .sort((a, b) => a.distance - b.distance || a.archetype_id.localeCompare(b.archetype_id));
  const [primary, secondary] = ranked;
  const absoluteGap = secondary.distance - primary.distance;
  return {
    primary: { archetype_id: primary.archetype_id, name: primary.name },
    secondary: { archetype_id: secondary.archetype_id, name: secondary.name },
    primary_distance: primary.distance,
    secondary_distance: secondary.distance,
    absolute_gap: absoluteGap,
    classification: classifyAbsoluteGap(absoluteGap),
  };
}

export function getTarotNearTieGroup(ranked) {
  if (ranked.length < 2) return { near_tie: false, tarot_gap: null, group: ranked };
  const first = ranked[0];
  const second = ranked[1];
  const tarotGap = second.distance - first.distance;
  if (tarotGap >= CALIBRATION.tarot.near_tie_max_absolute_gap_exclusive) {
    return { near_tie: false, tarot_gap: tarotGap, group: [first] };
  }
  const group = ranked.filter((candidate) =>
    candidate.distance - first.distance < CALIBRATION.tarot.near_tie_max_absolute_gap_exclusive);
  return { near_tie: true, tarot_gap: tarotGap, group };
}

async function sha256Hex(value) {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 Web Crypto API is unavailable');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function buildTarotSeed(assessmentInstanceId) {
  return [
    `profile_id:${assessmentInstanceId}`,
    `scoring_version:${VERSIONS.scoring_version}`,
    `archetype_version:${VERSIONS.archetype_version}`,
  ].join('\n');
}

export async function selectTarotExpression(personVector, primaryArchetypeId, seed) {
  const ranked = TAROT_EXPRESSIONS
    .filter((item) => item.primary_archetype_id === primaryArchetypeId)
    .map((item) => ({ ...item, distance: weightedDistance(personVector, item.target, item.weights) }))
    .sort((a, b) => a.distance - b.distance || a.tarot_expression_id.localeCompare(b.tarot_expression_id));
  if (ranked.length === 0) throw new Error(`No Tarot candidates for ${primaryArchetypeId}`);
  const tie = getTarotNearTieGroup(ranked);
  let selected = ranked[0];
  let tiebreakApplied = false;
  if (tie.near_tie) {
    const hash = await sha256Hex(seed);
    const index = Number(BigInt(`0x${hash.slice(0, 16)}`) % BigInt(tie.group.length));
    selected = [...tie.group].sort((a, b) => a.tarot_expression_id.localeCompare(b.tarot_expression_id))[index];
    tiebreakApplied = true;
  }
  return {
    tarot_expression_id: selected.tarot_expression_id,
    tarot_name: selected.name,
    distance: selected.distance,
    candidate_primary_archetype_id: primaryArchetypeId,
    near_tie: tie.near_tie,
    tarot_gap: tie.tarot_gap,
    near_tie_group: tie.group.map(({ tarot_expression_id }) => tarot_expression_id),
    tiebreak_applied: tiebreakApplied,
    tarot_selection_reason: tiebreakApplied ? 'STABLE_TIEBREAK' : 'VECTOR',
  };
}

export async function evaluateAssessment(input) {
  const validation = validateAssessmentInput(input);
  if (!validation.valid) return { status: INVALID_STATUS, errors: validation.errors };
  const answers = [...input.answers].sort((a, b) => a.question_id.localeCompare(b.question_id));
  const vectorResult = calculateRelationshipVector(answers);
  const archetypeResult = selectArchetypes(vectorResult.relationship_vector);
  const tarotResult = await selectTarotExpression(
    vectorResult.relationship_vector,
    archetypeResult.primary.archetype_id,
    buildTarotSeed(input.assessment_instance_id),
  );
  return {
    status: 'OK',
    versions: { ...VERSIONS },
    assessment_instance_id: input.assessment_instance_id,
    answers: answers.map(({ question_id, option_id }) => ({ question_id, option_id })),
    relationship_vector: vectorResult.relationship_vector,
    axis_evidence: vectorResult.axis_evidence,
    archetype_result: archetypeResult,
    tarot_result: tarotResult,
  };
}
