import { ASSET_MANIFEST } from '../card-assets/manifest.mjs';

export const COUPLE_VISUAL_MAPPING_VERSION = '1.0';

const NAMES = Object.freeze({
  C01: '동행형', C02: '자석형', C03: '온도차형', C04: '궤도형',
  C05: '나침반형', C06: '두 개의 왕관형', C07: '시차형', C08: '안개와 등대형',
});

const INTENTS = Object.freeze({
  C01: 'shared journey and companionship', C02: 'attraction and connection',
  C03: 'warmth and contrast', C04: 'distance and orbit', C05: 'direction and guidance',
  C06: 'dual strength and equal presence', C07: 'time and asynchronous rhythm',
  C08: 'fog, light and trust',
});

const ELIGIBLE = Object.freeze(ASSET_MANIFEST.assets
  .filter((asset) => asset.active && asset.default_result_eligible
    && ['APPROVED', 'APPROVED_WITH_CONSTRAINTS'].includes(asset.approval_status))
  .sort((a, b) => a.asset_id.localeCompare(b.asset_id)));

function hash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function selectCoupleVisual({ pairId, archetypeId }) {
  const id = String(archetypeId || 'C01');
  const pool = ELIGIBLE.length ? ELIGIBLE : ASSET_MANIFEST.assets;
  const selected = pool[hash(`${String(pairId)}:${id}:${COUPLE_VISUAL_MAPPING_VERSION}`) % pool.length];
  const name = NAMES[id] || NAMES.C01;
  return Object.freeze({
    assetId: selected.asset_id,
    path: selected.path,
    alt: `네오타로 커플 카드 — ${name}`,
    archetypeId: id,
    mappingVersion: COUPLE_VISUAL_MAPPING_VERSION,
    intent: INTENTS[id] || INTENTS.C01,
  });
}

export { NAMES as COUPLE_ARCHETYPE_DISPLAY_NAMES };
