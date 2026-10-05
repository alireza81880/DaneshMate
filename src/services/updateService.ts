import { GITHUB_REPO, APP_VERSION } from '../config/version';

export interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
  content_type?: string;
}

export interface GitHubReleaseResponse {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  assets: GitHubAsset[];
}

export interface ExtractedApkAsset {
  name: string;
  downloadUrl: string;
  sizeBytes: number;
  sizeFormatted: string;
}

export interface ReleaseInfo {
  tagName: string;
  version: string;
  name: string;
  publishedAt: string;
  body: string;
  htmlUrl: string;
  apkAsset?: ExtractedApkAsset;
}

export interface UpdateCheckResult {
  isUpdateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  release?: ReleaseInfo;
}

/**
 * Parses a semantic version string into [major, minor, patch] numbers.
 */
export function parseSemver(versionStr: string): [number, number, number] {
  const clean = versionStr.replace(/^v/, '').trim();
  const parts = clean.split('.').map((p) => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

/**
 * Returns true if remote version is strictly newer than current version.
 */
export function isNewerVersion(current: string, remote: string): boolean {
  const [cMaj, cMin, cPat] = parseSemver(current);
  const [rMaj, rMin, rPat] = parseSemver(remote);

  if (rMaj > cMaj) return true;
  if (rMaj < cMaj) return false;
  if (rMin > cMin) return true;
  if (rMin < cMin) return false;
  return rPat > cPat;
}

/**
 * Formats byte size into human readable string (e.g. 78.4 MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Fetches the latest published release from GitHub REST API.
 * Uses AbortController with 7 seconds timeout.
 */
export async function fetchLatestRelease(repo: string = GITHUB_REPO): Promise<GitHubReleaseResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('هنوز هیچ نسخه‌ای در مخزن منتشر نشده است.');
      }
      if (response.status === 403) {
        throw new Error('محدودیت موقت درخواست به سرور گیت‌هاب (لطفاً دقایقی دیگر دوباره تلاش فرمایید).');
      }
      throw new Error(`خطای دریافت از سرور گیت‌هاب (کد وضعیت: ${response.status})`);
    }

    const data = (await response.json()) as GitHubReleaseResponse;
    return data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('زمان انتظار به پایان رسید (مهلت ۷ ثانیه). لطفاً اتصال اینترنت خود را بررسی فرمایید.');
      }
      throw err;
    }
    throw new Error('عدم برقراری ارتباط با مخزن گیت‌هاب.');
  }
}

/**
 * Main update checker function for DaneshMate.
 * Non-blocking, offline-aware, never modifies local database.
 */
export async function checkAppUpdate(currentVersion: string = APP_VERSION): Promise<UpdateCheckResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('دستگاه در حالت آفلاین است. لطفاً اتصال اینترنت خود را برقرار نمایید.');
  }

  const release = await fetchLatestRelease();
  const remoteVersion = release.tag_name ? release.tag_name.replace(/^v/, '') : '0.0.0';
  const hasNewer = isNewerVersion(currentVersion, remoteVersion);

  const apkAssetRaw = release.assets?.find(
    (a) => a.name && a.name.toLowerCase().endsWith('.apk')
  );

  let apkAsset: ExtractedApkAsset | undefined;
  if (apkAssetRaw) {
    apkAsset = {
      name: apkAssetRaw.name,
      downloadUrl: apkAssetRaw.browser_download_url,
      sizeBytes: apkAssetRaw.size,
      sizeFormatted: formatFileSize(apkAssetRaw.size),
    };
  }

  return {
    isUpdateAvailable: hasNewer,
    currentVersion,
    latestVersion: remoteVersion,
    release: {
      tagName: release.tag_name,
      version: remoteVersion,
      name: release.name || release.tag_name,
      publishedAt: release.published_at,
      body: release.body || '',
      htmlUrl: release.html_url,
      apkAsset,
    },
  };
}
