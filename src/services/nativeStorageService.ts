import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const ATTACHMENTS_DIR = 'attachments';
const RECORDINGS_DIR = 'recordings';

export interface SavedFileResult {
  storagePath: string;
  persistentUri: string;
  webViewUrl: string;
}

class NativeStorageService {
  private initialized = false;

  private async ensureDirectories(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    if (this.initialized) return;

    try {
      await Filesystem.mkdir({
        path: ATTACHMENTS_DIR,
        directory: Directory.Data,
        recursive: true,
      }).catch(() => {});

      await Filesystem.mkdir({
        path: RECORDINGS_DIR,
        directory: Directory.Data,
        recursive: true,
      }).catch(() => {});

      this.initialized = true;
    } catch (e) {
      console.warn('[NativeStorage] Failed to ensure directories:', e);
    }
  }

  /**
   * Copy or write an attachment file to persistent app-private Directory.Data/attachments
   */
  public async saveAttachment(
    sourcePathOrUri: string | undefined,
    originalName: string,
    blob?: Blob
  ): Promise<SavedFileResult> {
    await this.ensureDirectories();

    const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const relativePath = `${ATTACHMENTS_DIR}/${uniqueId}_${cleanName}`;

    if (Capacitor.isNativePlatform()) {
      if (sourcePathOrUri) {
        try {
          // Copy from system picker temporary / cached path to permanent app storage
          await Filesystem.copy({
            from: sourcePathOrUri,
            to: relativePath,
            toDirectory: Directory.Data,
          });

          const uriResult = await Filesystem.getUri({
            path: relativePath,
            directory: Directory.Data,
          });

          const persistentUri = uriResult.uri;
          const webViewUrl = Capacitor.convertFileSrc(persistentUri);

          return {
            storagePath: relativePath,
            persistentUri,
            webViewUrl,
          };
        } catch (copyErr) {
          console.warn('[NativeStorage] Direct copy failed, attempting blob/base64 fallback:', copyErr);
        }
      }

      // Fallback: If blob exists or copy failed, read blob and write
      if (blob) {
        const base64 = await this.blobToBase64(blob);
        const writeRes = await Filesystem.writeFile({
          path: relativePath,
          directory: Directory.Data,
          data: base64,
        });

        const uriResult = await Filesystem.getUri({
          path: relativePath,
          directory: Directory.Data,
        });

        return {
          storagePath: relativePath,
          persistentUri: uriResult.uri || writeRes.uri,
          webViewUrl: Capacitor.convertFileSrc(uriResult.uri || writeRes.uri),
        };
      }
    }

    // Web fallback
    let webViewUrl = sourcePathOrUri || '';
    if (blob) {
      webViewUrl = URL.createObjectURL(blob);
    }

    return {
      storagePath: relativePath,
      persistentUri: webViewUrl,
      webViewUrl,
    };
  }

  /**
   * Save recorded voice memo from temporary recorder URI to Directory.Data/recordings/
   */
  public async saveRecording(
    tempUriOrPath: string | undefined,
    blob?: Blob
  ): Promise<SavedFileResult> {
    await this.ensureDirectories();

    const uniqueId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fileName = `${uniqueId}.aac`;
    const relativePath = `${RECORDINGS_DIR}/${fileName}`;

    if (Capacitor.isNativePlatform()) {
      if (tempUriOrPath) {
        try {
          await Filesystem.copy({
            from: tempUriOrPath,
            to: relativePath,
            toDirectory: Directory.Data,
          });

          const uriResult = await Filesystem.getUri({
            path: relativePath,
            directory: Directory.Data,
          });

          const persistentUri = uriResult.uri;
          const webViewUrl = Capacitor.convertFileSrc(persistentUri);

          return {
            storagePath: relativePath,
            persistentUri,
            webViewUrl,
          };
        } catch (copyErr) {
          console.warn('[NativeStorage] Recording copy failed, checking blob write:', copyErr);
        }
      }

      if (blob) {
        const base64 = await this.blobToBase64(blob);
        const writeRes = await Filesystem.writeFile({
          path: relativePath,
          directory: Directory.Data,
          data: base64,
        });

        const uriResult = await Filesystem.getUri({
          path: relativePath,
          directory: Directory.Data,
        });

        return {
          storagePath: relativePath,
          persistentUri: uriResult.uri || writeRes.uri,
          webViewUrl: Capacitor.convertFileSrc(uriResult.uri || writeRes.uri),
        };
      }
    }

    // Web fallback
    let webViewUrl = tempUriOrPath || '';
    if (blob) {
      webViewUrl = URL.createObjectURL(blob);
    }

    return {
      storagePath: relativePath,
      persistentUri: webViewUrl,
      webViewUrl,
    };
  }

  /**
   * Idempotently delete a physical file from Directory.Data
   */
  public async deleteFile(storagePathOrUri: string | undefined): Promise<boolean> {
    if (!storagePathOrUri) return true;

    // Web Blob URL cleanup
    if (storagePathOrUri.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(storagePathOrUri);
      } catch {}
      return true;
    }

    if (!Capacitor.isNativePlatform()) return true;

    try {
      // Determine if it's a relative storage path or full file:// URI
      if (storagePathOrUri.startsWith('file://')) {
        await Filesystem.deleteFile({
          path: storagePathOrUri,
        }).catch(async () => {
          // Try extracting relative path from URI
          const match = storagePathOrUri.match(/(attachments|recordings)\/.+$/);
          if (match) {
            await Filesystem.deleteFile({
              path: match[0],
              directory: Directory.Data,
            });
          }
        });
      } else {
        await Filesystem.deleteFile({
          path: storagePathOrUri,
          directory: Directory.Data,
        });
      }
      return true;
    } catch (err: any) {
      // If file is already missing, deletion is considered successful (idempotent)
      if (err?.message?.includes('does not exist') || err?.message?.includes('File not found')) {
        return true;
      }
      console.warn('[NativeStorage] File delete notice:', err);
      return true;
    }
  }

  /**
   * Convert any stored native URI or path to a WebView-safe URL
   */
  public getWebViewUrl(uriOrPath: string | undefined): string {
    if (!uriOrPath) return '';
    if (uriOrPath.startsWith('http://') || uriOrPath.startsWith('https://') || uriOrPath.startsWith('blob:')) {
      return uriOrPath;
    }
    if (Capacitor.isNativePlatform() && uriOrPath.startsWith('file://')) {
      return Capacitor.convertFileSrc(uriOrPath);
    }
    return uriOrPath;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1] || res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const nativeStorageService = new NativeStorageService();
