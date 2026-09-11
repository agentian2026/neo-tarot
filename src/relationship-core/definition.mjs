export const VERSIONS = Object.freeze({
  assessment_version: '1.1.0',
  question_version: '1.1.0',
  scoring_version: '1.1.0',
  archetype_version: '1.1.0',
  tarot_version: '1.1.0',
});

export const AXES = Object.freeze([
  { id: 'AFF', name: '애정표현', low: '애정표현 절제', high: '애정표현 적극' },
  { id: 'CON', name: '연락욕구', low: '느슨한 연락', high: '밀착된 연락' },
  { id: 'IND', name: '독립성', low: '함께하는 시간 선호', high: '개인 공간 선호' },
  { id: 'LEA', name: '관계주도', low: '상대 흐름을 따름', high: '관계를 직접 주도' },
  { id: 'JEA', name: '질투민감', low: '관계 경계에 관대', high: '관계 경계에 민감' },
  { id: 'CFI', name: '갈등직면', low: '생각할 시간 필요', high: '바로 이야기해 해결' },
  { id: 'INT', name: '친밀속도', low: '천천히 가까워짐', high: '빠르게 깊어짐' },
]);

const option = (questionNumber, optionNumber, text, primaryScores) => Object.freeze({
  option_id: `REL_Q${String(questionNumber).padStart(2, '0')}_${String.fromCharCode(64 + optionNumber)}`,
  text,
  primary_scores: Object.freeze(primaryScores),
  secondary_signals: Object.freeze([]),
});

const question = (number, text, options) => Object.freeze({
  question_id: `REL_Q${String(number).padStart(2, '0')}`,
  position: number,
  text,
  options: Object.freeze(options),
});

export const QUESTIONS = Object.freeze([
  question(1, '바쁜 날, 하루 종일 서로 연락을 거의 못 했다면?', [
    option(1, 1, '자기 전에는 하루 이야기를 하고 싶다', { CON: 100, IND: 0 }),
    option(1, 2, '짧게라도 안부를 주고받으면 좋다', { CON: 70, IND: 30 }),
    option(1, 3, '바쁜 날은 연락이 없어도 괜찮다', { CON: 30, IND: 70 }),
    option(1, 4, '다음 날 이야기해도 전혀 문제없다', { CON: 0, IND: 100 }),
  ]),
  question(2, '좋아하는 사람이 오늘 정말 힘든 하루를 보냈다면?', [
    option(2, 1, '직접 만나서라도 챙겨주고 싶다', { AFF: 100, IND: 0 }),
    option(2, 2, '충분히 이야기를 들어준다', { AFF: 70, IND: 30 }),
    option(2, 3, '무엇을 원하는지 먼저 물어본다', { AFF: 30, IND: 70 }),
    option(2, 4, '필요할 때 이야기할 때까지 기다린다', { AFF: 0, IND: 100 }),
  ]),
  question(3, '주말 데이트를 정할 때 나는?', [
    option(3, 1, '내가 하고 싶은 걸 먼저 제안한다', { LEA: 100 }),
    option(3, 2, '몇 가지를 같이 골라본다', { LEA: 70 }),
    option(3, 3, '상대가 원하는 걸 따라가는 편이다', { LEA: 30 }),
    option(3, 4, '그날 기분 따라 정한다', { LEA: 0 }),
  ]),
  question(4, '좋아하는 사람이 가까운 이성과 단둘이 식사한다면?', [
    option(4, 1, '누구인지와 상황이 많이 신경 쓰인다', { JEA: 100, IND: 0 }),
    option(4, 2, '괜찮지만 미리 이야기해줬으면 한다', { JEA: 70, IND: 30 }),
    option(4, 3, '특별한 이유가 없다면 크게 신경 쓰지 않는다', { JEA: 30, IND: 70 }),
    option(4, 4, '상대의 인간관계는 상대의 영역이라고 생각한다', { JEA: 0, IND: 100 }),
  ]),
  question(5, '상대에게 서운한 일이 생겼다면?', [
    option(5, 1, '그 자리에서 바로 이야기한다', { CFI: 100 }),
    option(5, 2, '조금 진정한 뒤 그날 이야기한다', { CFI: 70 }),
    option(5, 3, '하루 정도 생각할 시간이 필요하다', { CFI: 30 }),
    option(5, 4, '마음이 충분히 정리된 뒤 이야기한다', { CFI: 0 }),
  ]),
  question(6, '평소보다 답장이 많이 늦는다면?', [
    option(6, 1, '먼저 다시 연락해본다', { CON: 100, IND: 0 }),
    option(6, 2, '궁금하지만 조금 기다린다', { CON: 75, IND: 30 }),
    option(6, 3, '바쁜가 보다 생각한다', { CON: 25, IND: 70 }),
    option(6, 4, '답장 속도는 크게 신경 쓰지 않는다', { CON: 0, IND: 100 }),
  ]),
  question(7, '서로 호감이 확실하다고 느껴지는 초반이라면?', [
    option(7, 1, '빨리 관계를 확실히 하고 싶다', { INT: 100 }),
    option(7, 2, '몇 번 더 만나며 자연스럽게 가까워진다', { INT: 70 }),
    option(7, 3, '더 오래 알아본 뒤 결정하고 싶다', { INT: 30 }),
    option(7, 4, '굳이 빨리 관계를 정의하지 않는다', { INT: 0 }),
  ]),
  question(8, '좋아하는 사람에게 애정을 표현할 때 나는?', [
    option(8, 1, '자주 말이나 행동으로 표현한다', { AFF: 100 }),
    option(8, 2, '작은 행동으로 꾸준히 표현한다', { AFF: 70 }),
    option(8, 3, '중요한 순간에 확실히 표현한다', { AFF: 30 }),
    option(8, 4, '자주 표현하지 않아도 마음은 알 수 있다고 생각한다', { AFF: 0 }),
  ]),
  question(9, '둘이 여행을 가게 됐다면?', [
    option(9, 1, '일정 대부분을 내가 짠다', { LEA: 100 }),
    option(9, 2, '중요한 것만 같이 정한다', { LEA: 70 }),
    option(9, 3, '상대가 짠 계획을 따라가는 편이다', { LEA: 30 }),
    option(9, 4, '거의 계획하지 않고 즉흥적으로 움직인다', { LEA: 0 }),
  ]),
  question(10, '싸우다가 상대가 “지금은 말하고 싶지 않아”라고 한다면?', [
    option(10, 1, '그래도 핵심은 지금 이야기하고 싶다', { CFI: 100, IND: 0 }),
    option(10, 2, '잠깐 쉬었다가 오늘 안에는 이야기한다', { CFI: 70, IND: 30 }),
    option(10, 3, '시간이 필요하다면 기다려준다', { CFI: 30, IND: 70 }),
    option(10, 4, '상대가 먼저 이야기할 때까지 기다린다', { CFI: 0, IND: 100 }),
  ]),
  question(11, '아직 만난 지 오래되지 않았지만 점점 가까워지고 있다. 힘든 일이나 내 약한 모습을 보여주는 건?', [
    option(11, 1, '마음이 가면 비교적 빨리 솔직하게 보여준다', { INT: 100 }),
    option(11, 2, '상대가 먼저 마음을 열면 나도 자연스럽게 이야기한다', { INT: 70 }),
    option(11, 3, '충분히 믿을 수 있다는 확신이 생긴 뒤 이야기한다', { INT: 30 }),
    option(11, 4, '꽤 가까워져도 개인적인 약점은 천천히 보여준다', { INT: 0 }),
  ]),
  question(12, '기분 좋은 데이트가 끝난 뒤에는?', [
    option(12, 1, '집에 가서도 한동안 계속 연락한다', { AFF: 100, CON: 100 }),
    option(12, 2, '잘 도착했는지 묻고 조금 이야기한다', { AFF: 70, CON: 70 }),
    option(12, 3, '다음에 만날 때 이야기해도 괜찮다', { AFF: 30, CON: 30 }),
    option(12, 4, '데이트가 끝나면 각자 시간을 보내는 편이다', { AFF: 0, CON: 0 }),
  ]),
  question(13, '서로 좋아한다는 느낌이 생겼을 때 개인적인 이야기는?', [
    option(13, 1, '깊은 이야기까지 빠르게 나눈다', { INT: 100, IND: 0 }),
    option(13, 2, '조금씩 개인적인 이야기를 늘려간다', { INT: 70, IND: 30 }),
    option(13, 3, '충분한 신뢰가 생길 때까지 기다린다', { INT: 30, IND: 70 }),
    option(13, 4, '가까워져도 개인적인 영역은 천천히 연다', { INT: 0, IND: 100 }),
  ]),
  question(14, '둘이 원하는 것이 서로 다를 때 나는?', [
    option(14, 1, '내 생각을 설명하고 설득해본다', { LEA: 100, CFI: 80 }),
    option(14, 2, '서로 이야기해서 중간 지점을 찾는다', { LEA: 55, CFI: 100 }),
    option(14, 3, '이번에는 맞추고 나중에 내 의견을 이야기한다', { LEA: 25, CFI: 45 }),
    option(14, 4, '중요하지 않은 일이라면 상대에게 맞춘다', { LEA: 0, CFI: 25 }),
  ]),
  question(15, '좋아하는 사람이 전 연인과 가끔 연락하고 있다면?', [
    option(15, 1, '가능하면 연락하지 않았으면 한다', { JEA: 100, IND: 0 }),
    option(15, 2, '어떤 관계인지 설명은 듣고 싶다', { JEA: 70, IND: 30 }),
    option(15, 3, '지금 우리 관계에 문제가 없다면 괜찮다', { JEA: 30, IND: 70 }),
    option(15, 4, '과거 인간관계까지 제한할 필요는 없다고 생각한다', { JEA: 0, IND: 100 }),
  ]),
]);

const vector = (AFF, CON, IND, LEA, JEA, CFI, INT) => Object.freeze({ AFF, CON, IND, LEA, JEA, CFI, INT });
const archetype = (number, name, target, weights) => Object.freeze({
  archetype_id: `relationship_archetype_${String(number).padStart(2, '0')}`,
  name,
  target: vector(...target),
  weights: vector(...weights),
});

export const ARCHETYPES = Object.freeze([
  archetype(1, '리더', [50, 50, 50, 75, 50, 70, 45], [1, 1, 1, 2, 1, 1.5, 1.2]),
  archetype(2, '몰입자', [70, 70, 40, 45, 55, 50, 70], [2, 1.7, 1.4, 1, 1, 1, 2]),
  archetype(3, '수호자', [70, 70, 40, 40, 55, 50, 55], [1.8, 1.8, 1.4, 1, 1.3, 1, 1]),
  archetype(4, '자유인', [45, 35, 75, 50, 30, 45, 50], [1, 1.7, 2, 1, 1.3, 1, 1]),
  archetype(5, '탐색자', [45, 40, 70, 35, 35, 40, 30], [1, 1, 1.8, 1, 1, 1.3, 2]),
  archetype(6, '직진러', [60, 55, 50, 75, 45, 65, 75], [1.3, 1, 1, 1.8, 1, 1.5, 2]),
  archetype(7, '조율자', [70, 65, 45, 50, 45, 65, 55], [1.6, 1.3, 1, 1, 1, 1.8, 1]),
  archetype(8, '관찰자', [40, 40, 70, 35, 35, 30, 35], [1.4, 1.3, 1.8, 1, 1, 1.7, 1]),
]);

const tarot = (number, name, archetypeNumber, target) => Object.freeze({
  tarot_expression_id: `tarot_expression_${String(number).padStart(2, '0')}`,
  name,
  primary_archetype_id: `relationship_archetype_${String(archetypeNumber).padStart(2, '0')}`,
  target: vector(...target),
  weights: vector(1, 1, 1, 1, 1, 1, 1),
});

export const TAROT_EXPRESSIONS = Object.freeze([
  tarot(1, 'Emperor', 1, [55, 60, 40, 90, 65, 75, 60]),
  tarot(2, 'Chariot', 1, [60, 55, 55, 85, 40, 80, 80]),
  tarot(3, 'Tower', 1, [45, 45, 45, 95, 55, 90, 70]),
  tarot(4, 'World', 1, [65, 55, 50, 80, 35, 65, 55]),
  tarot(5, 'Lovers', 2, [90, 80, 25, 55, 60, 60, 90]),
  tarot(6, 'Star', 2, [80, 75, 35, 45, 50, 50, 75]),
  tarot(7, 'Empress', 3, [85, 80, 30, 45, 55, 50, 55]),
  tarot(8, 'Sun', 3, [80, 75, 40, 55, 45, 60, 65]),
  tarot(9, 'Fool', 4, [60, 35, 85, 55, 25, 45, 70]),
  tarot(10, 'Wheel of Fortune', 4, [50, 40, 80, 65, 30, 55, 60]),
  tarot(11, 'Hermit', 5, [40, 35, 85, 30, 30, 30, 25]),
  tarot(12, 'Moon', 5, [55, 45, 70, 35, 50, 35, 40]),
  tarot(13, 'High Priestess', 5, [45, 40, 75, 45, 35, 40, 35]),
  tarot(14, 'Strength', 6, [70, 60, 55, 80, 35, 75, 85]),
  tarot(15, 'Devil', 6, [75, 70, 40, 85, 65, 70, 90]),
  tarot(16, 'Temperance', 7, [75, 70, 45, 45, 40, 60, 55]),
  tarot(17, 'Judgement', 7, [70, 65, 40, 60, 45, 80, 60]),
  tarot(18, 'Magician', 8, [40, 35, 75, 45, 25, 35, 40]),
  tarot(19, 'Justice', 8, [35, 40, 70, 40, 30, 45, 25]),
  tarot(20, 'Hanged Man', 8, [45, 35, 80, 25, 25, 20, 30]),
]);

export const CALIBRATION = Object.freeze({
  calibration_version: '1.1.0',
  classification: Object.freeze({ clear_min_absolute_gap: 0.010, mixed_min_absolute_gap: 0.003 }),
  tarot: Object.freeze({ near_tie_max_absolute_gap_exclusive: 0.005 }),
});
