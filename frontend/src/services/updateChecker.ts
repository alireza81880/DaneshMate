/**
 * DaneshMate In-App Update Checker Service
 * Connects directly to GitHub Releases API with network awareness and 24h snooze suppression.
 */

import { Linking, Platform } from 'react-native';

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
const DEFAULT_REPO_OWNER = 'alireza818800';
const DEFAULT_REPO_NAME = 'daneshmate';
export const CURRENT_APP_VERSION = '1.0.0';

class UpdateCheckerService {
  private repoOwner: string = DEFAULT_REPO_OWNER;
  private repoName: string = DEFAULT_REPO_NAME;

  /**
   * Configures custom repository path if needed
   */
  public setRepository(owner: string, repo: string): void {
    this.repoOwner = owner;
    this.repoName = repo;
  }

  /**
   * Helper: Check if connectivity is currently active before making HTTP calls
   */
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }

  /**
   * Reads the snooze timestamp from local persistent storage
   */
  public async isSnoozed(): Promise<boolean> {
    try {
      let rawVal: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        rawVal = window.localStorage.getItem(STORAGE_KEY_UPDATE_SNOOZE);
      }
      if (!rawVal) return false;

      const snoozeUntil = parseInt(rawVal, 10);
      return !isNaN(snoozeUntil) && Date.now() < snoozeUntil;
    } catch {
      return false;
    }
  }

  /**
   * Snoozes update alerts for a given number of hours (default 24h)
   */
  public async snooze(hours: number = 24): Promise<void> {
    try {
      const until = Date.now() + hours * 60 * 60 * 1000;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_UPDATE_SNOOZE, until.toString());
      }
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Resets any active snooze timer
   */
  public async clearSnooze(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY_UPDATE_SNOOZE);
      }
    } catch {
      // Graceful fallback
    }
  }

  /**
   * SemVer comparator: Checks if remoteVersion is strictly higher than localVersion
   */
  public compareVersions(local: string, remote: string): boolean {
    const cleanLocal = local.replace(/^v/i, '').trim();
    const cleanRemote = remote.replace(/^v/i, '').trim();

    const localParts = cleanLocal.split('.').map((p) => parseInt(p, 10) || 0);
    const remoteParts = cleanRemote.split('.').map((p) => parseInt(p, 10) || 0);

    const length = Math.max(localParts.length, remoteParts.length);
    for (let i = 0; i < length; i++) {
      const l = localParts[i] || 0;
      const r = remoteParts[i] || 0;
      if (r > l) return true;
      if (r < l) return false;
    }
    return false;
  }

  /**
   * Silently checks GitHub Releases for newer application versions
   */
  public async checkForUpdates(force: boolean = false): Promise<UpdateCheckResult> {
    // 1. Device connectivity check
    if (!this.isOnline()) {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        reason: 'offline',
      };
    }

    // 2. Snooze check (bypassed if user explicitly tapped 'Check for Updates' in Settings)
    if (!force && (await this.isSnoozed())) {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        reason: 'snoozed',
      };
    }

    try {
      const apiUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/latest`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'DaneshMate-App-UpdateChecker',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          hasUpdate: false,
          currentVersion: CURRENT_APP_VERSION,
          reason: 'fetch_error',
        };
      }

      const release: GitHubRelease = await response.json();
      const remoteVersion = release.tag_name || '';
      const isNewer = this.compareVersions(CURRENT_APP_VERSION, remoteVersion);

      if (!isNewer) {
        return {
          hasUpdate: false,
          currentVersion: CURRENT_APP_VERSION,
          latestVersion: remoteVersion,
          reason: 'up_to_date',
        };
      }

      // 3. Locate direct Android APK asset, fallback to release HTML page
      let apkDownloadUrl: string | undefined;
      if (Array.isArray(release.assets)) {
        const apkAsset = release.assets.find(
          (a) => a.name.toLowerCase().endsWith('.apk') || a.browser_download_url.includes('.apk')
        );
        if (apkAsset) {
          apkDownloadUrl = apkAsset.browser_download_url;
        }
      }

      return {
        hasUpdate: true,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: remoteVersion,
        releaseNotes: release.body || 'بهینه‌سازی‌های عملکردی و رفع اشکالات جزئی.',
        downloadUrl: apkDownloadUrl || release.html_url,
        releasePageUrl: release.html_url,
        publishedAt: release.published_at,
      };
    } catch {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        reason: 'fetch_error',
      };
    }
  }

  /**
   * Safely opens download URL in system browser / APK installer
   */
  public async openDownloadUrl(url?: string): Promise<void> {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  }
}

export const updateChecker = new UpdateCheckerService();
