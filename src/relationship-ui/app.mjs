import { QUESTIONS, VERSIONS } from '../relationship-core/definition.mjs';
import { evaluateAssessment } from '../relationship-core/engine.mjs';
import { resolveAssetSnapshot, selectCardAsset } from '../card-assets/selector.mjs';
import { getCardDisplayModel } from './card-view.mjs';
import {
  INVITE_STORAGE_KEY,
  buildAssessmentPayload,
  callInviteApi,
  getOrCreateParticipantId,
  inviteUrl,
} from './invite-client.mjs';
import { buildResultPresentation, PRESENTATION_PREFERENCES } from './presentation.mjs';
import {
  SESSION_STORAGE_KEY,
  canEvaluate,
  createAssessmentState,
  restoreSessionState,
  serializeSessionState,
  setAnswer,
  setPresentationPreference,
  toAnswerRecords,
  withCurrentQuestion,
  withAssetSelection,
  withResult,
} from './state.mjs';

const byId = (id) => document.getElementById(id);
const landingScreen = byId('landing-screen');
const assessmentScreen = byId('relationship-assessment-screen');
const preferenceScreen = byId('relationship-preference-screen');
const resultScreen = byId('relationship-result-screen');
const inviteLandingScreen = byId('relationship-invite-landing-screen');
const pairReadyScreen = byId('relationship-pair-ready-screen');
const startButton = byId('start-btn');
const questionNumber = byId('relationship-question-number');
const questionText = byId('relationship-question-text');
const optionsWrap = byId('relationship-options-wrap');
const progressLabel = byId('relationship-progress-label');
const progressBar = byId('relationship-progress-bar');
const backButton = byId('relationship-back-btn');
const preferenceWrap = byId('relationship-preference-options');
const preferenceBack = byId('relationship-preference-back');
const resultButton = byId('relationship-result-btn');
const errorBox = byId('relationship-error');
const retryButton = byId('relationship-retry-btn');
const inviteLandingStart = byId('relationship-invite-start-btn');
const inviteLandingError = byId('relationship-invite-landing-error');
const inviteCta = byId('relationship-invite-cta');
const invitePanel = byId('relationship-invite-panel');
const inviteError = byId('relationship-invite-error');
const inviteUrlInput = byId('relationship-invite-url');
const inviteCopy = byId('relationship-invite-copy');
const inviteShare = byId('relationship-invite-share');
const inviteStatusButton = byId('relationship-invite-status-btn');
const inviteStatusText = byId('relationship-invite-status-text');

const incomingInviteToken = new URLSearchParams(location.search).get('invite');
let participantId;
try {
  participantId = getOrCreateParticipantId();
} catch {
  participantId = crypto.randomUUID();
}

let state = loadState();

function loadState() {
  try {
    return restoreSessionState(sessionStorage.getItem(SESSION_STORAGE_KEY));
  } catch {
    return createAssessmentState();
  }
}

function persistState() {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, serializeSessionState(state));
  } catch {
    // Session persistence is best-effort; the active in-memory flow remains usable.
  }
}

function showScreen(next) {
  [landingScreen, assessmentScreen, preferenceScreen, resultScreen, inviteLandingScreen, pairReadyScreen].forEach((screen) => {
    screen.classList.toggle('hidden', screen !== next);
    screen.classList.toggle('opacity-0', screen !== next);
    screen.classList.toggle('pointer-events-none', screen !== next);
    screen.classList.toggle('opacity-100', screen === next);
  });
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderQuestion() {
  const question = QUESTIONS[state.current_question_index];
  const selectedOptionId = state.answers_by_question[question.question_id];
  questionNumber.textContent = `Q${question.position}`;
  questionText.textContent = question.text;
  progressLabel.textContent = `${question.position} / ${QUESTIONS.length}`;
  progressBar.style.width = `${(question.position / QUESTIONS.length) * 100}%`;
  backButton.disabled = state.current_question_index === 0;
  backButton.classList.toggle('opacity-30', backButton.disabled);
  optionsWrap.replaceChildren(...question.options.map((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.optionId = option.option_id;
    button.className = `option-btn group w-full flex items-center gap-4 rounded-2xl px-5 py-5 text-left border transition-all duration-300 active:scale-[0.98] ${
      option.option_id === selectedOptionId
        ? 'border-neonpink bg-neonpink/10 shadow-neon'
        : 'border-neonpurple/30 bg-white/[0.03] hover:border-neonpurple hover:bg-neonpurple/10'
    }`;
    const marker = document.createElement('span');
    marker.className = 'flex-shrink-0 w-9 h-9 rounded-full border border-neonpurple/50 flex items-center justify-center font-display text-sm text-neonpurple';
    marker.textContent = String.fromCharCode(65 + index);
    const label = document.createElement('span');
    label.className = 'text-sm sm:text-base text-purple-100 leading-snug';
    label.textContent = option.text;
    button.append(marker, label);
    button.addEventListener('click', () => {
      state = setAnswer(state, question.question_id, option.option_id);
      persistState();
      if (state.current_question_index === QUESTIONS.length - 1) {
        renderPreference();
        showScreen(preferenceScreen);
      } else {
        state = withCurrentQuestion(state, state.current_question_index + 1);
        persistState();
        renderQuestion();
      }
    });
    return button;
  }));
  showScreen(assessmentScreen);
}

function renderPreference() {
  preferenceWrap.replaceChildren(...PRESENTATION_PREFERENCES.map((preference) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.preference = preference.value;
    button.textContent = preference.label;
    button.className = `w-full rounded-2xl px-5 py-4 border text-sm font-semibold transition-all ${
      state.presentation_preference === preference.value
        ? 'border-neonpink bg-neonpink/15 text-white shadow-neon'
        : 'border-neonpurple/30 bg-white/[0.03] text-purple-100 hover:border-neonpurple'
    }`;
    button.addEventListener('click', () => {
      state = setPresentationPreference(state, preference.value);
      persistState();
      renderPreference();
    });
    return button;
  }));
  resultButton.disabled = !canEvaluate(state);
  resultButton.classList.toggle('opacity-40', resultButton.disabled);
}

function renderResult(result, assetSelection = state.asset_selection) {
  const view = buildResultPresentation(result);
  const asset = resolveAssetSnapshot(assetSelection);
  byId('relationship-result-tarot').textContent = `THE ${view.tarot_name.toUpperCase()}`;
  byId('relationship-card-symbol').textContent = '✦';
  byId('relationship-card-label').textContent = view.tarot_name;
  const cardImage = byId('relationship-card-image');
  const cardFallback = byId('relationship-card-fallback');
  const applyCardDisplay = (status) => {
    const display = getCardDisplayModel(assetSelection, status);
    cardImage.classList.toggle('hidden', !display.show_image);
    cardFallback.classList.toggle('hidden', !display.show_generic_fallback);
  };
  cardImage.onload = () => applyCardDisplay('loaded');
  cardImage.onerror = () => applyCardDisplay('error');
  if (asset) {
    applyCardDisplay('pending');
    cardImage.alt = `${view.tarot_name} · NeoTarot visual card`;
    cardImage.src = asset.path;
  } else {
    cardImage.removeAttribute('src');
    applyCardDisplay('error');
  }
  byId('relationship-result-primary').textContent = view.primary_name;
  byId('relationship-result-summary').textContent = view.summary;
  byId('relationship-result-classification').textContent = view.classification;
  byId('relationship-result-day').textContent = view.day;
  byId('relationship-result-night').textContent = view.night;
  byId('relationship-result-secondary').textContent = view.secondary_name;
  const axesWrap = byId('relationship-axes');
  axesWrap.replaceChildren(...view.axes.map((axis) => {
    const item = document.createElement('div');
    item.className = 'rounded-2xl border border-white/10 bg-white/[0.025] p-4';
    item.innerHTML = `<div class="flex items-center justify-between gap-3"><span data-axis-name class="font-semibold text-sm text-white"></span><span data-axis-value class="font-display text-sm text-neonpurple"></span></div><div class="mt-3 h-2 rounded-full bg-white/10 overflow-hidden"><div data-axis-bar class="h-full rounded-full bg-gradient-to-r from-neonpurple2 via-neonpurple to-neonpink"></div></div><div class="mt-2 flex justify-between gap-3 text-[10px] text-purple-200/65"><span data-axis-low></span><span data-axis-high class="text-right"></span></div>`;
    item.querySelector('[data-axis-name]').textContent = axis.name;
    item.querySelector('[data-axis-value]').textContent = axis.value;
    item.querySelector('[data-axis-bar]').style.width = `${axis.value}%`;
    item.querySelector('[data-axis-low]').textContent = axis.low;
    item.querySelector('[data-axis-high]').textContent = axis.high;
    return item;
  }));
  errorBox.classList.add('hidden');
  restoreInvitePanel();
  showScreen(resultScreen);
}

const inviteErrorCopy = Object.freeze({
  NETWORK_ERROR: '네트워크 연결을 확인하고 다시 시도해주세요.',
  INVALID_INVITE: '유효하지 않은 초대 링크예요.',
  EXPIRED_INVITE: '초대 링크의 유효기간이 지났어요.',
  ALREADY_ACCEPTED: '이미 완료된 초대예요.',
  SELF_INVITE: '내가 만든 초대 링크예요. 다른 사람에게 보내주세요.',
  VERSION_MISMATCH: '현재 테스트 버전과 맞지 않아 다시 진행할 수 없어요.',
  PAIR_VERSION_MISMATCH: '두 결과의 버전이 달라 연결할 수 없어요.',
  INVALID_ANSWERS: '답변을 확인하고 다시 시도해주세요.',
  PAIR_CREATION_FAILED: '관계를 연결하지 못했어요. 잠시 후 다시 시도해주세요.',
  SERVER_ERROR: '잠시 후 다시 시도해주세요.',
});

function messageForInviteError(code) {
  return inviteErrorCopy[code] ?? inviteErrorCopy.NETWORK_ERROR;
}

function loadInviteReference() {
  try { return JSON.parse(localStorage.getItem(INVITE_STORAGE_KEY)); } catch { return null; }
}

function saveInviteReference(reference) {
  try { localStorage.setItem(INVITE_STORAGE_KEY, JSON.stringify(reference)); } catch { /* best effort */ }
}

function assessmentKey() {
  return JSON.stringify(buildAssessmentPayload(state));
}

function restoreInvitePanel() {
  const reference = loadInviteReference();
  if (!reference || reference.assessment_key !== assessmentKey()) {
    invitePanel.classList.add('hidden');
    return;
  }
  inviteUrlInput.value = inviteUrl(reference.invite_token);
  invitePanel.classList.remove('hidden');
  inviteStatusText.textContent = reference.invite_status === 'PAIR_READY'
    ? '상대가 테스트를 완료했어요. 두 사람의 관계 결과를 만들 준비가 됐어요.'
    : '아직 상대의 답변을 기다리고 있어요.';
}

async function createInvite() {
  if (state.result?.status !== 'OK' || !state.asset_selection) return;
  inviteCta.disabled = true;
  inviteCta.textContent = '초대 링크 만드는 중…';
  inviteError.classList.add('hidden');
  try {
    const key = assessmentKey();
    const existing = loadInviteReference();
    const createRequestId = existing?.assessment_key === key ? existing.create_request_id : crypto.randomUUID();
    const result = await callInviteApi({
      action: 'create', participant_id: participantId, create_request_id: createRequestId, ...buildAssessmentPayload(state),
    });
    saveInviteReference({
      assessment_key: key,
      create_request_id: createRequestId,
      invite_token: result.invite_token,
      invite_status: result.invite_status,
      expires_at: result.expires_at,
    });
    restoreInvitePanel();
  } catch (error) {
    inviteError.textContent = messageForInviteError(error.code);
    inviteError.classList.remove('hidden');
  } finally {
    inviteCta.disabled = false;
    inviteCta.textContent = '그 사람과의 관계 확인하기';
  }
}

async function refreshInviterStatus() {
  const reference = loadInviteReference();
  if (!reference) return;
  inviteStatusButton.disabled = true;
  try {
    const result = await callInviteApi({ action: 'inviter_status', participant_id: participantId, invite_token: reference.invite_token });
    reference.invite_status = result.invite_status;
    saveInviteReference(reference);
    restoreInvitePanel();
  } catch (error) {
    inviteStatusText.textContent = messageForInviteError(error.code);
  } finally {
    inviteStatusButton.disabled = false;
  }
}

async function acceptIncomingInvite() {
  let acceptRequestId;
  const key = `neoTarotInviteAcceptRequestV1:${incomingInviteToken}`;
  try {
    acceptRequestId = sessionStorage.getItem(key) || crypto.randomUUID();
    sessionStorage.setItem(key, acceptRequestId);
  } catch {
    acceptRequestId = crypto.randomUUID();
  }
  const result = await callInviteApi({
    action: 'accept', participant_id: participantId, accept_request_id: acceptRequestId,
    invite_token: incomingInviteToken, include_pair_id: true, ...buildAssessmentPayload(state),
  });
  if (result.invite_status !== 'PAIR_READY') throw Object.assign(new Error('PAIR_CREATION_FAILED'), { code: 'PAIR_CREATION_FAILED' });
  if (result.pair_id) { location.href = `couple.html?pair=${encodeURIComponent(result.pair_id)}`; return; }
  showScreen(pairReadyScreen);
}

async function calculateResult() {
  if (!canEvaluate(state)) return;
  resultButton.disabled = true;
  resultButton.textContent = '카드를 펼치는 중…';
  errorBox.classList.add('hidden');
  try {
    const result = await evaluateAssessment({
      versions: { ...VERSIONS },
      answers: toAnswerRecords(state),
      assessment_instance_id: state.assessment_instance_id,
    });
    if (result.status !== 'OK') throw new Error(result.status);
    state = withResult(state, result);
    const assetSelection = await selectCardAsset({
      answers: toAnswerRecords(state),
      versions: result.versions,
      tarot_expression_id: result.tarot_result.tarot_expression_id,
      presentation_preference: state.presentation_preference,
    });
    if (assetSelection.status !== 'OK') throw new Error(assetSelection.status);
    state = withAssetSelection(state, assetSelection);
    persistState();
    renderResult(result, assetSelection);
    if (incomingInviteToken) await acceptIncomingInvite();
  } catch (error) {
    if (incomingInviteToken && state.result?.status === 'OK') {
      inviteError.textContent = messageForInviteError(error.code);
      inviteError.classList.remove('hidden');
      showScreen(resultScreen);
    } else {
      errorBox.textContent = '결과 또는 관계 연결을 완료하지 못했어요. 잠시 후 다시 시도해주세요.';
      errorBox.classList.remove('hidden');
    }
  } finally {
    resultButton.textContent = '내 관계 타로 펼치기';
    resultButton.disabled = !canEvaluate(state);
  }
}

startButton.addEventListener('click', () => {
  if (state.result?.status === 'OK') restoreOrSelectAsset();
  else renderQuestion();
});
backButton.addEventListener('click', () => {
  if (state.current_question_index > 0) {
    state = withCurrentQuestion(state, state.current_question_index - 1);
    persistState();
    renderQuestion();
  }
});
preferenceBack.addEventListener('click', () => {
  state = withCurrentQuestion(state, QUESTIONS.length - 1);
  persistState();
  renderQuestion();
});
resultButton.addEventListener('click', calculateResult);
retryButton.addEventListener('click', () => {
  state = createAssessmentState();
  persistState();
  renderQuestion();
});
inviteLandingStart.addEventListener('click', () => {
  state = createAssessmentState();
  persistState();
  renderQuestion();
});
inviteCta.addEventListener('click', createInvite);
inviteStatusButton.addEventListener('click', refreshInviterStatus);
inviteCopy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(inviteUrlInput.value);
    inviteCopy.textContent = '복사 완료';
  } catch {
    inviteUrlInput.select();
    document.execCommand('copy');
    inviteCopy.textContent = '복사 완료';
  }
});
inviteShare.addEventListener('click', async () => {
  if (navigator.share) {
    try { await navigator.share({ title: 'NeoTarot 관계 타로 초대', text: '같은 관계 타로를 하고 두 사람의 결과를 준비해보세요.', url: inviteUrlInput.value }); } catch { /* user cancellation */ }
  } else inviteCopy.click();
});

async function restoreOrSelectAsset() {
  if (state.result?.status !== 'OK') return;
  if (!resolveAssetSnapshot(state.asset_selection)) {
    try {
      const assetSelection = await selectCardAsset({
        answers: toAnswerRecords(state),
        versions: state.result.versions,
        tarot_expression_id: state.result.tarot_result.tarot_expression_id,
        presentation_preference: state.presentation_preference,
      });
      if (assetSelection.status !== 'OK') throw new Error(assetSelection.status);
      state = withAssetSelection(state, assetSelection);
      persistState();
    } catch {
      state = { ...state, asset_selection: null };
    }
  }
  renderResult(state.result, state.asset_selection);
}

async function initialize() {
  if (incomingInviteToken) {
    inviteLandingStart.disabled = true;
    try {
      await callInviteApi({ action: 'status', participant_id: participantId, invite_token: incomingInviteToken });
      inviteLandingStart.disabled = false;
      showScreen(inviteLandingScreen);
    } catch (error) {
      inviteLandingError.textContent = messageForInviteError(error.code);
      inviteLandingError.classList.remove('hidden');
      showScreen(inviteLandingScreen);
    }
  } else if (state.result?.status === 'OK') restoreOrSelectAsset();
}

initialize();
