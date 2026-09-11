import { AXES } from '../relationship-core/definition.mjs';

export const ARCHETYPE_SUMMARIES = Object.freeze({
  relationship_archetype_01: '관계의 방향을 정하고 움직이는 데 익숙한 사람',
  relationship_archetype_02: '마음이 열리면 관계 안으로 깊게 들어가는 사람',
  relationship_archetype_03: '좋아하는 사람을 챙기고 관계를 지키려는 사람',
  relationship_archetype_04: '사랑하면서도 서로의 공간을 중요하게 생각하는 사람',
  relationship_archetype_05: '서두르기보다 충분히 알아가며 마음을 여는 사람',
  relationship_archetype_06: '마음이 생기면 표현하고 관계를 앞으로 움직이는 사람',
  relationship_archetype_07: '상대와 나 사이의 온도를 읽고 균형을 맞추는 사람',
  relationship_archetype_08: '먼저 생각하고 확신이 생긴 뒤 마음을 보여주는 사람',
});

export const PRESENTATION_PREFERENCES = Object.freeze([
  { value: 'MASCULINE', label: '남성적인 이미지' },
  { value: 'FEMININE', label: '여성적인 이미지' },
  { value: 'ANY', label: '상관없어요' },
]);

export function bucketScore(value) {
  if (value <= 34) return 'LOW';
  if (value <= 65) return 'MID';
  return 'HIGH';
}

export function buildDayCopy(vector) {
  const aff = bucketScore(vector.AFF);
  const lea = bucketScore(vector.LEA);
  const ind = bucketScore(vector.IND);
  if (lea === 'HIGH' && aff === 'HIGH') return '마음을 분명히 표현하며 관계의 방향도 적극적으로 만들어가는 편입니다.';
  if (ind === 'HIGH' && aff !== 'HIGH') return '편안하게 각자의 시간을 지키면서 천천히 마음을 보여주는 편입니다.';
  if (aff === 'HIGH') return '좋아하는 마음을 따뜻한 말과 행동으로 자연스럽게 보여주는 편입니다.';
  if (lea === 'HIGH') return '필요한 순간에는 먼저 제안하고 관계를 앞으로 움직이는 편입니다.';
  if (ind === 'LOW') return '함께 보내는 시간을 소중히 여기며 일상 속에서 가까움을 표현하는 편입니다.';
  return '상대의 흐름과 자신의 속도를 함께 살피며 자연스럽게 관계를 만들어갑니다.';
}

export function buildNightCopy(vector) {
  const con = bucketScore(vector.CON);
  const jea = bucketScore(vector.JEA);
  const cfi = bucketScore(vector.CFI);
  const intimacy = bucketScore(vector.INT);
  if (con === 'HIGH' && intimacy === 'HIGH') return '가까워질수록 자주 연결되고 깊이 마음을 나누고 싶어합니다.';
  if (jea === 'HIGH' && cfi === 'HIGH') return '관계의 경계가 흔들리면 솔직한 대화로 빠르게 확인해야 마음이 놓입니다.';
  if (cfi === 'HIGH') return '서운한 일이 생기면 오래 미루기보다 대화로 풀어야 마음이 놓입니다.';
  if (intimacy === 'LOW' && con !== 'HIGH') return '마음속 깊은 이야기는 충분한 신뢰와 시간이 쌓인 뒤에 꺼내는 편입니다.';
  if (jea === 'HIGH') return '가까운 관계일수록 서로가 지켜야 할 경계와 확신을 중요하게 느낍니다.';
  if (con === 'LOW') return '연결을 확인하기보다 각자의 리듬을 존중할 때 관계가 더 편안해집니다.';
  return '가까워진 뒤에도 감정과 대화의 속도를 조율하며 안정감을 찾는 편입니다.';
}

export function buildResultPresentation(result) {
  const primaryId = result.archetype_result.primary.archetype_id;
  return Object.freeze({
    tarot_name: result.tarot_result.tarot_name,
    primary_name: result.archetype_result.primary.name,
    secondary_name: result.archetype_result.secondary.name,
    classification: result.archetype_result.classification,
    summary: ARCHETYPE_SUMMARIES[primaryId],
    day: buildDayCopy(result.relationship_vector),
    night: buildNightCopy(result.relationship_vector),
    axes: AXES.map((axis) => ({ ...axis, value: result.relationship_vector[axis.id] })),
  });
}
