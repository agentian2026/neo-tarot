import { VERSIONS } from '../relationship-core/definition.mjs';
import { calculateCoupleDimensions } from '../../scripts/lib/couple-math-v1-candidate.mjs';
import { calculateCoupleArchetype } from '../../scripts/lib/couple-archetype-v1-candidate.mjs';
import { calculateGlobalPercentiles, COUPLE_CALIBRATION_ARTIFACT } from './calibration/couple-archetype-v1-global-cdf.mjs';
import { buildCoupleResultViewModel } from './result-view-model.mjs';
const axes=['AFF','CON','IND','LEA','JEA','CFI','INT'];
const validVector=v=>v&&axes.every(k=>Number.isFinite(v[k])&&v[k]>=0&&v[k]<=100);
export async function getCoupleResult({ pairId, viewerParticipantId, repository }) {
  const pair=await repository?.getPair?.(pairId); if(!pair)return{state:'NOT_FOUND'};
  const a=pair.participantA,b=pair.participantB;if(!a||!b)return{state:'WAITING'};
  if(!validVector(a.relationship_vector)||!validVector(b.relationship_vector))return{state:'INVALID'};
  const viewerRole=viewerParticipantId===a.participant_id?'A':viewerParticipantId===b.participant_id?'B':null;if(!viewerRole)return{state:'VIEWER_UNRESOLVED'};
  const math=calculateCoupleDimensions(a.relationship_vector,b.relationship_vector),p=calculateGlobalPercentiles(math),g={AFF:Math.abs(a.relationship_vector.AFF-b.relationship_vector.AFF)/100,CON:Math.abs(a.relationship_vector.CON-b.relationship_vector.CON)/100,IND:Math.abs(a.relationship_vector.IND-b.relationship_vector.IND)/100,LEA:Math.abs(a.relationship_vector.LEA-b.relationship_vector.LEA)/100,CFI:Math.abs(a.relationship_vector.CFI-b.relationship_vector.CFI)/100,JEA:Math.abs(a.relationship_vector.JEA-b.relationship_vector.JEA)/100,INT:Math.abs(a.relationship_vector.INT-b.relationship_vector.INT)/100,SC:Math.abs(math.D6.boundary_alignment-math.D6.intimacy_alignment)/100};
  const archetype=calculateCoupleArchetype(a.relationship_vector,b.relationship_vector,math,{percentiles:p,gaps:g});const content=buildCoupleResultViewModel({primaryArchetype:archetype.primary_archetype,secondaryArchetype:archetype.secondary_archetype_internal,coupleDimensions:math,personA:a.relationship_vector,personB:b.relationship_vector,viewer:viewerRole});return{state:'COMPLETE',pairId,viewerRole,coupleMath:math,archetype,content,versions:{personEngineVersion:VERSIONS.scoring_version,coupleMathVersion:'v1',coupleArchetypeModelVersion:archetype.archetype_candidate_version,calibrationArtifactVersion:COUPLE_CALIBRATION_ARTIFACT.artifactVersion,copyVersion:content.metadata.copyVersion}};
}
