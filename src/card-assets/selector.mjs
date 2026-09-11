import { canonicalizeAnswers } from '../relationship-core/engine.mjs';
import { ASSET_BY_ID, ASSET_MANIFEST } from './manifest.mjs';
import { TAROT_VISUAL_INTENT_BY_ID } from './tarot-visual-intents.mjs';
import { ASSET_VERSIONS, DEFAULT_RESULT_FORBIDDEN_CONTEXT_TAGS, PRESENTATION_FILTER } from './vocabulary.mjs';

export const NO_ELIGIBLE_ASSET = 'NO_ELIGIBLE_ASSET';

const intersects = (left, right) => left.some((value) => right.includes(value));

function baseEligible(asset, intent) {
  return asset.active
    && ['APPROVED', 'APPROVED_WITH_CONSTRAINTS'].includes(asset.approval_status)
    && asset.default_result_eligible
    && asset.sensuality !== 'HIGH'
    && !asset.context_tags.some((tag) => DEFAULT_RESULT_FORBIDDEN_CONTEXT_TAGS.includes(tag))
    && !asset.context_tags.some((tag) => intent.excluded_context_tags.includes(tag));
}

function presentationEligible(asset, preference) {
  const required = PRESENTATION_FILTER[preference];
  return required === null || asset.presentation.includes(required);
}

export function getEligibleAssets(tarotExpressionId, presentationPreference) {
  const intent = TAROT_VISUAL_INTENT_BY_ID.get(tarotExpressionId);
  if (!intent || !(presentationPreference in PRESENTATION_FILTER)) throw new TypeError('Unknown Tarot expression or presentation preference');
  const safe = ASSET_MANIFEST.assets.filter((asset) => baseEligible(asset, intent));
  const samePresentation = safe.filter((asset) => presentationEligible(asset, presentationPreference));
  const levels = [
    { fallback_level: 1, reason: 'PREFERRED_VISUAL_FAMILY', candidates: samePresentation.filter((asset) => intersects(asset.visual_families, intent.preferred_visual_families)) },
    { fallback_level: 2, reason: 'ALLOWED_VISUAL_FAMILY', candidates: samePresentation.filter((asset) => intersects(asset.visual_families, intent.allowed_visual_families)) },
    { fallback_level: 3, reason: 'PRESENTATION_AND_SAFETY', candidates: samePresentation },
    { fallback_level: 4, reason: 'ANY_PRESENTATION_AND_SAFETY', candidates: safe },
  ];
  const selectedLevel = levels.find(({ candidates }) => candidates.length > 0);
  if (!selectedLevel) return { status: NO_ELIGIBLE_ASSET, fallback_level: null, reason: NO_ELIGIBLE_ASSET, assets: [] };
  return { status: 'OK', ...selectedLevel, assets: [...selectedLevel.candidates].sort((a, b) => a.asset_id.localeCompare(b.asset_id)) };
}

export function buildAssetSelectionSeed({ answers, versions, tarot_expression_id, presentation_preference }) {
  return [
    `answers:${canonicalizeAnswers(answers)}`,
    `assessment_version:${versions.assessment_version}`,
    `scoring_version:${versions.scoring_version}`,
    `archetype_version:${versions.archetype_version}`,
    `tarot_version:${versions.tarot_version}`,
    `tarot_expression_id:${tarot_expression_id}`,
    `presentation_preference:${presentation_preference}`,
    `asset_manifest_version:${ASSET_VERSIONS.asset_manifest_version}`,
    `selection_algorithm_version:${ASSET_VERSIONS.selection_algorithm_version}`,
  ].join('\n');
}

async function sha256Hex(value) {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 Web Crypto API is unavailable');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function selectCardAsset(input) {
  const eligibility = getEligibleAssets(input.tarot_expression_id, input.presentation_preference);
  if (eligibility.status !== 'OK') return eligibility;
  const seed = buildAssetSelectionSeed(input);
  const hash = await sha256Hex(seed);
  const index = Number(BigInt(`0x${hash.slice(0, 16)}`) % BigInt(eligibility.assets.length));
  const selected = eligibility.assets[index];
  return Object.freeze({
    status: 'OK',
    selected_asset_id: selected.asset_id,
    asset_manifest_version: ASSET_VERSIONS.asset_manifest_version,
    selection_algorithm_version: ASSET_VERSIONS.selection_algorithm_version,
    asset_selection_reason: eligibility.reason,
    fallback_level: eligibility.fallback_level,
    eligible_count: eligibility.assets.length,
    selection_seed_hash: hash,
  });
}

export function resolveAssetSnapshot(snapshot) {
  if (!snapshot
    || snapshot.asset_manifest_version !== ASSET_VERSIONS.asset_manifest_version
    || snapshot.selection_algorithm_version !== ASSET_VERSIONS.selection_algorithm_version) return null;
  return ASSET_BY_ID.get(snapshot.selected_asset_id) ?? null;
}
