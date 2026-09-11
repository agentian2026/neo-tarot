import { calculateCoupleDimensions } from '../../scripts/lib/couple-math-v1-candidate.mjs';
import { buildCoupleResultViewModel } from './result-view-model.mjs';

export const COUPLE_RESULT_VERSION = '1.0';
export function buildCompletedPairResult({ pairId, participantA, participantB, viewerRole = 'A', secondaryArchetype = null }) {
  if (!pairId || !participantA?.relationship_vector || !participantB?.relationship_vector) throw new Error('PAIR_INCOMPLETE');
  const dimensions = calculateCoupleDimensions(participantA.relationship_vector, participantB.relationship_vector);
  const primaryArchetype = participantA.couple_archetype?.primary_archetype_id ?? participantA.primary_archetype_id;
  if (!primaryArchetype) throw new Error('ARCHETYPE_UNAVAILABLE');
  const content = buildCoupleResultViewModel({ primaryArchetype, secondaryArchetype, coupleDimensions: dimensions, personA: participantA.relationship_vector, personB: participantB.relationship_vector, viewer: viewerRole, metadata: { pairId, resultVersion: COUPLE_RESULT_VERSION } });
  return Object.freeze({ pairId, viewerRole, personA: participantA.relationship_vector, personB: participantB.relationship_vector, coupleMath: dimensions, ...content, share: { url: `/couple/${encodeURIComponent(pairId)}`, text: `우리 관계 타로는 ‘${content.archetypeName}’이래. 너는 우리랑 맞는 것 같아?` } });
}
