import { buildCoupleResultContent, COUPLE_ARCHETYPES } from './copy-engine.mjs';

const labels = Object.freeze({ D1:'연결 리듬', D2:'애정 표현', D3:'관계 거리', D4:'관계 주도', D5:'갈등 회복', D6:'신뢰와 친밀감' });
const modeText = Object.freeze({ CO_LEAD:'함께 방향을 잡는 편', A_LEADS:'한 사람이 먼저 방향을 잡는 편', B_LEADS:'한 사람이 먼저 방향을 잡는 편', DUAL_LEAD:'둘 다 방향을 잡는 편', LOW_INITIATIVE:'둘 다 먼저 제안하기보다 상대를 보는 편' });
export function buildCoupleResultViewModel(input) {
  const content = buildCoupleResultContent(input);
  const d = input.coupleDimensions ?? {};
  const map = Object.entries(labels).map(([id, name]) => ({ id, name, mode: id === 'D4' ? modeText[d[id]?.mode] ?? '함께 살펴보는 편' : (d[id]?.direction ? '리듬이 다른 편' : '비슷한 편') }));
  if (d.D6) map.push({ id:'D6_BOUNDARY', name:'관계의 경계 기준', mode:d.D6.boundary_direction ?? '서로의 기준을 살피는 편' }, { id:'D6_INTIMACY', name:'마음을 여는 속도', mode:d.D6.intimacy_direction ?? '서로의 속도를 살피는 편' });
  return Object.freeze({ ...content, relationshipMap: map, archetypeName: COUPLE_ARCHETYPES[input.primaryArchetype] });
}
