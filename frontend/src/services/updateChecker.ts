/**
 * DaneshMate In-App Update Checker Service
 * Checks GitHub Releases with 24h snooze suppression.
 */

import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GitHubReleaseAsset {
  id: number;
  name: string;
  browser_download_url: string;
  size: number;
  content_type: string;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: GitHubReleaseAsset[];
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  releasePageUrl?: string;
  publishedAt?: string;
  reason?: 'up_to_date' | 'offline' | 'snoozed' | 'fetch_error';
}

const STORAGE_KEY_UPDATE_SNOOZE = '@daneshmate/update_snooze_until';
const DEFAULT_REPO_OWNER = 'alireza81880';
const DEFAULT_REPO_NAME = 'DaneshMate';

// Single source of truth for the app version: app.json (CI sets it from the git tag).
function readAppVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const appJson = require('../../app.json');
    return String(appJson?.expo?.version || '1.0.0');
  } catch {
    return '1.0.0';
  }
}

export const CURRENT_APP_VERSION = readAppVersion();

async function storageGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    }
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function storageSet(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

async function storageRemove(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

class UpdateCheckerService {
  private repoOwner: string = DEFAULT_REPO_OWNER;
  private repoName: string = DEFAULT_REPO_NAME;

  public setRepository(owner: string, repo: string): void {
    this.repoOwner = owner;
    this.repoName = repo;
  }

  public async isSnoozed(): Promise<boolean> {
    const rawVal = await storageGet(STORAGE_KEY_UPDATE_SNOOZE);
    if (!rawVal) return false;
    const snoozeUntil = parseInt(rawVal, 10);
    return !isNaN(snoozeUntil) && Date.now() < snoozeUntil;
  }

  public async snooze(hours: number = 24): Promise<void> {
    const until = Date.now() + hours * 60 * 60 * 1000;
    await storageSet(STORAGE_KEY_UPDATE_SNOOZE, until.toString());
  }

  public async clearSnooze(): Promise<void> {
    await storageRemove(STORAGE_KEY_UPDATE_SNOOZE);
  }

  /** SemVer comparator: true if remote is strictly newer. Ignores pre-release suffixes like -release. */
  public compareVersions(local: string, remote: string): boolean {
    const clean = (v: string) => v.replace(/^v/i, '').split('-')[0].trim();
    const localParts = clean(local).split('.').map((p) => parseInt(p, 10) || 0);
    const remoteParts = clean(remote).split('.').map((p) => parseInt(p, 10) || 0);

    const length = Math.max(localParts.length, remoteParts.length);
    for (let i = 0; i < length; i++) {
      const l = localParts[i] || 0;
      const r = remoteParts[i] || 0;
      if (r > l) return true;
      if (r < l) return false;
    }
    return false;
  }

  public async checkForUpdates(force: boolean = false): Promise<UpdateCheckResult> {
    if (!force && (await this.isSnoozed())) {
      return { hasUpdate: false, currentVersion: CURRENT_APP_VERSION, reason: 'snoozed' };
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = setTimeout(() => controller?.abort(), 6000);

    try {
      const apiUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/latest`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'DaneshMate-App-UpdateChecker',
        },
        signal: controller?.signal as any,
      });

      if (!response.ok) {
        return { hasUpdate: false, currentVersion: CURRENT_APP_VERSION, reason: 'fetch_error' };
      }

      const release: GitHubRelease = await response.json();
      const remoteVersion = release.tag_name || '';
      if (!this.compareVersions(CURRENT_APP_VERSION, remoteVersion)) {
        return {
          hasUpdate: false,
          currentVersion: CURRENT_APP_VERSION,
          latestVersion: remoteVersion,
          reason: 'up_to_date',
        };
      }

      const apkAsset = Array.isArray(release.assets)
        ? release.assets.find((a) => (a.name || '').toLowerCase().endsWith('.apk'))
        : undefined;

      return {
        hasUpdate: true,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: remoteVersion,
        releaseNotes: release.body || 'بهینه‌سازی‌های عملکردی و رفع اشکالات جزئی.',
        downloadUrl: apkAsset?.browser_download_url || release.html_url,
        releasePageUrl: release.html_url,
        publishedAt: release.published_at,
      };
    } catch {
      return { hasUpdate: false, currentVersion: CURRENT_APP_VERSION, reason: 'offline' };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Opens the download URL. canOpenURL() returns false for https on Android 11+ without
   * <queries> in the manifest, so we call openURL directly.
   */
  public async openDownloadUrl(url?: string): Promise<void> {
    if (!url) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.warn('[UpdateChecker] Could not open URL:', err);
    }
  }
}

export const updateChecker = new UpdateCheckerService();
