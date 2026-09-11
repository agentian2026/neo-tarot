import { ASSET_MANIFEST } from './manifest.mjs';
import { TAROT_VISUAL_INTENTS } from './tarot-visual-intents.mjs';
import { VOCABULARY } from './vocabulary.mjs';

const enumSet = (key) => new Set(VOCABULARY[key]);
const allIn = (values, allowed) => values.every((value) => allowed.has(value));

export function validateManifest({ filesystemPaths = null } = {}) {
  const errors = [];
  const assets = ASSET_MANIFEST.assets;
  if (assets.length !== 512) errors.push(`Expected 512 assets, got ${assets.length}`);
  const ids = new Set();
  const paths = new Set();
  const combinations = new Set();
  const poolCoverage = new Map();
  for (const asset of assets) {
    if (ids.has(asset.asset_id)) errors.push(`Duplicate asset_id: ${asset.asset_id}`);
    if (paths.has(asset.path)) errors.push(`Duplicate path: ${asset.path}`);
    ids.add(asset.asset_id);
    paths.add(asset.path);
    const combination = `${asset.legacy_gender_presentation}:${asset.legacy_mbti}:${asset.legacy_mode}:${asset.legacy_variant}`;
    if (combinations.has(combination)) errors.push(`Duplicate legacy combination: ${combination}`);
    combinations.add(combination);
    const poolKey = `${asset.legacy_gender_presentation}:${asset.legacy_mbti}:${asset.legacy_mode}`;
    poolCoverage.set(poolKey, (poolCoverage.get(poolKey) ?? 0) + 1);
    if (!/^legacy_[mf]_[a-z]{4}_(day|night)_0[1-8]$/.test(asset.asset_id)) errors.push(`Invalid asset_id: ${asset.asset_id}`);
    if (!/^cards\/[mf]_[a-z]{4}_(day|night)_[1-8]_result\.webp$/.test(asset.path)) errors.push(`Invalid path: ${asset.path}`);
    if (asset.pair_status !== 'NO_PAIR' || asset.pair_id !== null) errors.push(`Invalid pair semantics: ${asset.asset_id}`);
    if (!Number.isInteger(asset.legacy_variant) || asset.legacy_variant < 1 || asset.legacy_variant > 8) errors.push(`Invalid variant: ${asset.asset_id}`);
    for (const field of ['active', 'default_result_eligible']) if (typeof asset[field] !== 'boolean') errors.push(`Invalid boolean ${field}: ${asset.asset_id}`);
    for (const field of ['visual_families', 'presentation', 'palette', 'setting', 'wardrobe', 'context_tags']) {
      if (!Array.isArray(asset[field]) || !asset[field].length || !allIn(asset[field], enumSet(field))) errors.push(`Invalid ${field}: ${asset.asset_id}`);
    }
    for (const field of ['intensity', 'sensuality', 'tarot_dependency', 'reuse_classification', 'approval_status']) {
      if (!enumSet(field).has(asset[field])) errors.push(`Invalid ${field}: ${asset.asset_id}`);
    }
    const unsafe = asset.sensuality === 'HIGH' || asset.context_tags.some((tag) => ['CASINO_GAMBLING', 'ALCOHOL_PROMINENT', 'ADULT_NIGHTLIFE_PROMINENT', 'HIGH_SENSUALITY'].includes(tag));
    if (unsafe && asset.default_result_eligible) errors.push(`Unsafe default eligibility: ${asset.asset_id}`);
  }
  if (poolCoverage.size !== 64 || [...poolCoverage.values()].some((count) => count !== 8)) errors.push('Legacy pool/mode coverage is not exactly 64 × 8');
  if (filesystemPaths) {
    const filesystemSet = new Set(filesystemPaths);
    for (const path of paths) if (!filesystemSet.has(path)) errors.push(`Manifest path missing on filesystem: ${path}`);
    for (const path of filesystemSet) if (!paths.has(path)) errors.push(`Filesystem card missing in manifest: ${path}`);
  }
  if (TAROT_VISUAL_INTENTS.length !== 20) errors.push(`Expected 20 Tarot intents, got ${TAROT_VISUAL_INTENTS.length}`);
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), asset_count: assets.length, unique_asset_ids: ids.size, unique_paths: paths.size, pool_mode_count: poolCoverage.size });
}
