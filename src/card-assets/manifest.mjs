import { ASSET_VERSIONS, DEFAULT_RESULT_FORBIDDEN_CONTEXT_TAGS } from './vocabulary.mjs';

const MBTIS = Object.freeze(['ENFJ', 'ENFP', 'ENTJ', 'ENTP', 'ESFJ', 'ESFP', 'ESTJ', 'ESTP', 'INFJ', 'INFP', 'INTJ', 'INTP', 'ISFJ', 'ISFP', 'ISTJ', 'ISTP']);

const FAMILY_BY_MBTI = Object.freeze({
  ESTJ: ['AUTHORITY_COMMAND'],
  INFP: ['MYSTIC_INTROSPECTIVE'],
  ISTJ: ['DISCIPLINED_CRAFT'],
  ISFJ: ['WARM_NURTURING_GUIDING'],
  INFJ: ['MYSTIC_INTROSPECTIVE'],
  INTJ: ['AUTHORITY_COMMAND', 'ANALYTICAL_TECHNOLOGICAL'],
  ISTP: ['DISCIPLINED_CRAFT', 'ANALYTICAL_TECHNOLOGICAL'],
  ISFP: ['SENSORY_ROMANTIC'],
  INTP: ['ANALYTICAL_TECHNOLOGICAL', 'MYSTIC_INTROSPECTIVE'],
  ESTP: ['ENERGETIC_SPONTANEOUS'],
  ESFP: ['ENERGETIC_SPONTANEOUS'],
  ENFP: ['ENERGETIC_SPONTANEOUS'],
  ENTP: ['ENERGETIC_SPONTANEOUS', 'ANALYTICAL_TECHNOLOGICAL'],
  ESFJ: ['WARM_NURTURING_GUIDING'],
  ENFJ: ['WARM_NURTURING_GUIDING', 'AUTHORITY_COMMAND'],
  ENTJ: ['AUTHORITY_COMMAND'],
});

const MEDIUM_TAROT_POOLS = new Set(['m_ESTJ', 'm_INFJ', 'm_INTJ', 'm_ESFP', 'm_ESFJ', 'm_ENFJ', 'm_ENTJ', 'f_INFJ', 'f_INTJ', 'f_ISFP', 'f_INFP', 'f_ESTJ', 'f_ESFJ', 'f_ENFJ', 'f_ENTJ']);
const LIMITED_POOLS = new Set(['m_ESTP', 'm_ESFP', 'm_ENFP', 'f_ISFJ', 'f_ISFP', 'f_ESTP', 'f_ESFP', 'f_ENFP']);
const GAMBLING_NIGHT_POOLS = new Set(['m_INTP', 'm_ESTP', 'm_ENTP', 'f_ESTP']);
const ALCOHOL_NIGHT_POOLS = new Set(['m_ISTJ', 'm_ESFP']);
const HIGH_SENSUALITY_ASSET_OVERRIDES = new Set([
  'legacy_f_enfj_day_05',
  'legacy_f_enfj_day_06',
  'legacy_f_enfj_day_08',
  'legacy_f_enfj_day_04',
  'legacy_f_enfj_night_07',
  'legacy_f_enfp_day_05',
  'legacy_f_entj_day_03',
  'legacy_f_entj_night_06',
  'legacy_f_entj_night_08',
  'legacy_f_entp_night_08',
  'legacy_f_entp_night_02',
  'legacy_f_esfp_day_08',
  'legacy_f_esfj_night_07',
  'legacy_f_estj_night_01',
  'legacy_f_estj_night_06',
  'legacy_f_isfp_day_08',
  'legacy_f_intp_night_07',
  'legacy_f_istp_night_05',
  'legacy_m_esfj_night_03',
  'legacy_m_enfj_night_01',
  'legacy_m_enfj_night_02',
  'legacy_m_enfj_night_03',
  'legacy_m_enfj_night_04',
  'legacy_m_entj_night_01',
]);
const ALCOHOL_ASSET_OVERRIDES = new Set(['legacy_f_istp_night_05']);

function dayMetadata(mbti) {
  if (['ESTJ', 'INTJ', 'ENTJ', 'ENFJ', 'ESFJ', 'ISTJ'].includes(mbti)) return {
    palette: ['NATURAL_DAYLIGHT', 'NAVY_GOLD'], setting: ['PROFESSIONAL_INTERIOR'], wardrobe: ['FORMAL_TAILORING'], context: ['PORTRAIT', 'DAYLIGHT', 'PROFESSIONAL'],
  };
  if (['INFP', 'ISFJ', 'INFJ'].includes(mbti)) return {
    palette: ['NATURAL_DAYLIGHT', 'WARM_NEUTRAL'], setting: ['DOMESTIC_INTERIOR'], wardrobe: ['CASUAL_KNIT'], context: ['PORTRAIT', 'DAYLIGHT', 'DOMESTIC'],
  };
  if (['ISTP', 'ISFP', 'INTP'].includes(mbti)) return {
    palette: ['NATURAL_DAYLIGHT', 'COOL_NEUTRAL'], setting: ['CREATIVE_WORKSPACE'], wardrobe: ['CREATIVE_CASUAL'], context: ['PORTRAIT', 'DAYLIGHT', 'CREATIVE'],
  };
  return {
    palette: ['NATURAL_DAYLIGHT', 'SATURATED_COLOR'], setting: ['URBAN_OUTDOOR'], wardrobe: ['URBAN_LEATHER'], context: ['PORTRAIT', 'DAYLIGHT', 'URBAN', 'OUTDOOR'],
  };
}

function nightMetadata(pool, mbti, isLimited) {
  const context = ['PORTRAIT', 'NIGHTLIFE'];
  let setting = ['NEON_NIGHTLIFE'];
  if (['INTJ', 'ISTP', 'INTP', 'ENTP'].includes(mbti)) {
    setting = ['TECHNOLOGY_INTERIOR'];
    context.push('TECHNOLOGY');
  }
  if (['INFP', 'INFJ', 'ISFP'].includes(mbti)) {
    setting = ['FANTASY_INTERIOR'];
    context.push('FANTASY', 'ROMANTIC_GLAMOUR');
  }
  if (GAMBLING_NIGHT_POOLS.has(pool)) {
    setting = ['CASINO_GAMBLING'];
    context.push('CASINO_GAMBLING');
  }
  if (ALCOHOL_NIGHT_POOLS.has(pool)) context.push('ALCOHOL_PROMINENT');
  if (isLimited) context.push('ADULT_NIGHTLIFE_PROMINENT', 'HIGH_SENSUALITY');
  return {
    palette: mbti === 'INTP' || mbti === 'ISTP' || mbti === 'INTJ' ? ['NEON_BLUE_CYAN'] : ['NEON_RED_MAGENTA', 'SATURATED_COLOR'],
    setting,
    wardrobe: ['EVENING_GLAMOUR'],
    context,
  };
}

function createRecord(gender, mbti, mode, variant) {
  const pool = `${gender}_${mbti}`;
  const limited = LIMITED_POOLS.has(pool);
  const modeMetadata = mode === 'day' ? dayMetadata(mbti) : nightMetadata(pool, mbti, limited);
  const assetId = `legacy_${gender}_${mbti.toLowerCase()}_${mode}_${String(variant).padStart(2, '0')}`;
  const assetLevelHighSensuality = HIGH_SENSUALITY_ASSET_OVERRIDES.has(assetId);
  if (assetLevelHighSensuality && !modeMetadata.context.includes('HIGH_SENSUALITY')) modeMetadata.context.push('HIGH_SENSUALITY');
  if (ALCOHOL_ASSET_OVERRIDES.has(assetId) && !modeMetadata.context.includes('ALCOHOL_PROMINENT')) modeMetadata.context.push('ALCOHOL_PROMINENT');
  const sensuality = assetLevelHighSensuality ? 'HIGH' : (mode === 'night' ? (limited ? 'HIGH' : 'MEDIUM') : 'LOW');
  const defaultEligible = !modeMetadata.context.some((tag) => DEFAULT_RESULT_FORBIDDEN_CONTEXT_TAGS.includes(tag)) && sensuality !== 'HIGH';
  const variant2 = String(variant).padStart(2, '0');
  return Object.freeze({
    asset_id: assetId,
    path: `cards/${gender}_${mbti.toLowerCase()}_${mode}_${variant}_result.webp`,
    legacy_gender_presentation: gender,
    legacy_mbti: mbti,
    legacy_mode: mode,
    legacy_variant: variant,
    pair_status: 'NO_PAIR',
    pair_id: null,
    visual_families: Object.freeze([...FAMILY_BY_MBTI[mbti]]),
    presentation: Object.freeze([gender === 'm' ? 'MASCULINE_PRESENTING' : 'FEMININE_PRESENTING']),
    palette: Object.freeze(modeMetadata.palette),
    setting: Object.freeze(modeMetadata.setting),
    wardrobe: Object.freeze(modeMetadata.wardrobe),
    intensity: mode === 'day' ? 'MEDIUM' : 'HIGH',
    sensuality,
    context_tags: Object.freeze(modeMetadata.context),
    tarot_dependency: MEDIUM_TAROT_POOLS.has(pool) ? 'MEDIUM_TAROT_DEPENDENCY' : 'LOW_TAROT_DEPENDENCY',
    reuse_classification: limited ? 'LIMITED_REUSE' : 'KEEP_WITH_NEW_METADATA',
    approval_status: limited ? 'APPROVED_WITH_CONSTRAINTS' : 'APPROVED',
    active: true,
    default_result_eligible: defaultEligible,
    metadata_basis: assetLevelHighSensuality ? 'PHASE2C_DIRECT_VISUAL_OVERRIDE' : 'PHASE1G_POOL_MODE_CONSERVATIVE',
  });
}

const assets = [];
for (const gender of ['f', 'm']) {
  for (const mbti of MBTIS) {
    for (const mode of ['day', 'night']) {
      for (let variant = 1; variant <= 8; variant += 1) assets.push(createRecord(gender, mbti, mode, variant));
    }
  }
}

export const ASSET_MANIFEST = Object.freeze({
  ...ASSET_VERSIONS,
  source_audit: 'NEOTAROT_PHASE1G_CARD_ASSET_AUDIT',
  expected_asset_count: 512,
  assets: Object.freeze(assets),
});

export const ASSET_BY_ID = new Map(ASSET_MANIFEST.assets.map((asset) => [asset.asset_id, asset]));
