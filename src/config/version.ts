import packageJson from '../../package.json';

/**
 * DaneshMate Canonical Version Configuration
 *
 * Source of truth: root package.json
 * Android versionCode formula: MAJOR * 1_000_000 + MINOR * 1_000 + PATCH
 */

export const APP_VERSION: string = packageJson.version;

export function calculateVersionCode(versionStr: string): number {
  const parts = versionStr.replace(/^v/, '').trim().split('.').map((p) => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });
  const major = parts[0] || 0;
  const minor = parts[1] || 0;
  const patch = parts[2] || 0;
  return major * 1000000 + minor * 1000 + patch;
}

export const APP_VERSION_CODE: number = calculateVersionCode(APP_VERSION);

export const GITHUB_REPO = 'alireza81880/daneshmate';

export type DistributionChannel = 'myket' | 'github';

/**
 * Explicit Distribution Channel
 * Configured at build time: 'myket' (production) or 'github' (test/ci).
 * Never infer from whether Myket is installed.
 */
export const DISTRIBUTION_CHANNEL: DistributionChannel =
  (import.meta.env.VITE_DISTRIBUTION_CHANNEL as DistributionChannel) || 'myket';
