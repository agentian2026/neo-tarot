export const ASSET_VERSIONS = Object.freeze({
  asset_manifest_version: '1.0.0',
  asset_schema_version: '1.0.0',
  visual_vocabulary_version: '1.0.0',
  selection_algorithm_version: '1.0.0',
});

export const VOCABULARY = Object.freeze({
  visual_families: Object.freeze([
    'AUTHORITY_COMMAND',
    'WARM_NURTURING_GUIDING',
    'MYSTIC_INTROSPECTIVE',
    'ANALYTICAL_TECHNOLOGICAL',
    'DISCIPLINED_CRAFT',
    'SENSORY_ROMANTIC',
    'ENERGETIC_SPONTANEOUS',
  ]),
  presentation: Object.freeze(['MASCULINE_PRESENTING', 'FEMININE_PRESENTING']),
  palette: Object.freeze(['NATURAL_DAYLIGHT', 'WARM_NEUTRAL', 'COOL_NEUTRAL', 'NAVY_GOLD', 'NEON_RED_MAGENTA', 'NEON_BLUE_CYAN', 'SATURATED_COLOR']),
  setting: Object.freeze(['DAYLIGHT_INTERIOR', 'PROFESSIONAL_INTERIOR', 'DOMESTIC_INTERIOR', 'CREATIVE_WORKSPACE', 'URBAN_OUTDOOR', 'NATURE_OUTDOOR', 'NEON_NIGHTLIFE', 'TECHNOLOGY_INTERIOR', 'FANTASY_INTERIOR', 'CASINO_GAMBLING']),
  wardrobe: Object.freeze(['FORMAL_TAILORING', 'SMART_CASUAL', 'CASUAL_KNIT', 'CREATIVE_CASUAL', 'URBAN_LEATHER', 'EVENING_GLAMOUR']),
  intensity: Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
  sensuality: Object.freeze(['NONE', 'LOW', 'MEDIUM', 'HIGH']),
  context_tags: Object.freeze(['PORTRAIT', 'DAYLIGHT', 'PROFESSIONAL', 'DOMESTIC', 'CREATIVE', 'URBAN', 'OUTDOOR', 'NIGHTLIFE', 'TECHNOLOGY', 'FANTASY', 'ROMANTIC_GLAMOUR', 'CASINO_GAMBLING', 'ALCOHOL_PROMINENT', 'ADULT_NIGHTLIFE_PROMINENT', 'HIGH_SENSUALITY']),
  pair_status: Object.freeze(['NO_PAIR']),
  tarot_dependency: Object.freeze(['LOW_TAROT_DEPENDENCY', 'MEDIUM_TAROT_DEPENDENCY', 'HIGH_TAROT_DEPENDENCY']),
  reuse_classification: Object.freeze(['KEEP_WITH_NEW_METADATA', 'LIMITED_REUSE']),
  approval_status: Object.freeze(['APPROVED', 'APPROVED_WITH_CONSTRAINTS']),
});

export const DEFAULT_RESULT_FORBIDDEN_CONTEXT_TAGS = Object.freeze([
  'CASINO_GAMBLING',
  'ALCOHOL_PROMINENT',
  'ADULT_NIGHTLIFE_PROMINENT',
  'HIGH_SENSUALITY',
]);

export const PRESENTATION_FILTER = Object.freeze({
  MASCULINE: 'MASCULINE_PRESENTING',
  FEMININE: 'FEMININE_PRESENTING',
  ANY: null,
});
