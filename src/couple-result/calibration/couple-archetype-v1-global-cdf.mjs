import artifact from './couple-archetype-v1-global-cdf.json' with { type: 'json' };
import { lookupPercentile } from '../../../scripts/lib/empirical-cdf-v1.mjs';
export const COUPLE_CALIBRATION_ARTIFACT = artifact;
export function loadCoupleArchetypeCalibration(version = artifact.artifactVersion) { if (version !== artifact.artifactVersion) throw new Error('CALIBRATION_VERSION_UNAVAILABLE'); return artifact; }
export function calculateGlobalPercentiles(dimensions, calibration = artifact) { return Object.fromEntries(Object.entries(dimensions).map(([k,v]) => [k, lookupPercentile(calibration.cdf[k], v.raw_score)])); }
