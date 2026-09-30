import { Capacitor } from '@capacitor/core';
import { FilePicker, PickedFile } from '@capawesome/capacitor-file-picker';
import { nativeStorageService } from './nativeStorageService';
import type { AttachedFile, FileCategory } from '../App';

class FilePickerService {
  /**
   * Determine file category from extension and mime-type
   */
  public determineCategory(name: string, mimeType?: string): FileCategory {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const mime = (mimeType || '').toLowerCase();

    if (ext === 'pdf' || mime.includes('pdf')) return 'pdf';
    if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) {
      return 'powerpoint';
    }
    if (['doc', 'docx'].includes(ext) || mime.includes('word') || mime.includes('document')) {
      return 'word';
    }
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || mime.startsWith('image/')) {
      return 'image';
    }
    if (['mp3', 'm4a', 'wav', 'aac', 'ogg'].includes(ext) || mime.startsWith('audio/')) {
      return 'audio';
    }
    return 'other';
  }

  /**
   * Format bytes to readable Persian string
   */
  public formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) return '۰ کیلوبایت';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) {
      return `${mb.toFixed(1).replace('.', '/')} مگابایت`;
    }
    const kb = Math.max(1, Math.round(bytes / 1024));
    return `${kb} کیلوبایت`;
  }

  /**
   * Pick files from real Android device storage using system document picker
   */
  public async pickFiles(): Promise<AttachedFile[]> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await FilePicker.pickFiles({
          types: [
            'application/pdf',
            'image/*',
            'audio/*',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            '*/*',
          ],
          limit: 0, // multiple
          readData: false, // Don't crash memory with base64 for large files
        });

        if (!result.files || result.files.length === 0) {
          return [];
        }

        const attachedFiles: AttachedFile[] = [];

        for (const file of result.files) {
          const category = this.determineCategory(file.name, file.mimeType);
          const sizeText = this.formatFileSize(file.size);

          // Copy file to persistent app-private storage
          const saved = await nativeStorageService.saveAttachment(
            file.path,
            file.name,
            file.blob
          );

          attachedFiles.push({
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            type: category,
            sizeText,
            uri: saved.persistentUri,
            url: saved.webViewUrl,
          });
        }

        return attachedFiles;
      } catch (err: any) {
        if (err?.message?.includes('canceled') || err?.message?.includes('cancelled')) {
          return [];
        }
        console.error('[FilePicker] Failed to pick native files:', err);
        throw new Error(err?.message || 'خطا در انتخاب فایل از حافظه دستگاه');
      }
    } else {
      // Browser fallback using HTML5 input element
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*,audio/*,.pdf,.ppt,.pptx,.doc,.docx';

        input.onchange = async () => {
          if (!input.files || input.files.length === 0) {
            return resolve([]);
          }

          const files = Array.from(input.files);
          const attachedFiles: AttachedFile[] = [];

          for (const file of files) {
            const category = this.determineCategory(file.name, file.type);
            const sizeText = this.formatFileSize(file.size);

            const saved = await nativeStorageService.saveAttachment(
              undefined,
              file.name,
              file
            );

            attachedFiles.push({
              id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: file.name,
              type: category,
              sizeText,
              uri: saved.persistentUri,
              url: saved.webViewUrl,
            });
          }

          resolve(attachedFiles);
        };

        input.oncancel = () => resolve([]);
        input.click();
      });
    }
  }

  /**
   * Delete an attachment file from disk and revoke URLs
   */
  public async deleteFile(file: AttachedFile): Promise<void> {
    const targetPath = file.uri || file.url;
    if (targetPath) {
      await nativeStorageService.deleteFile(targetPath);
    }
  }

  /**
   * Open or view an attachment using native WebView or external viewer
   */
  public openFile(file: AttachedFile): string {
    const target = file.url || file.uri;
    if (!target) {
      throw new Error('آدرس فایل پیوست در دسترس نیست.');
    }

    const webViewUrl = nativeStorageService.getWebViewUrl(target);

    // If it's a web link or blob, open directly
    try {
      window.open(webViewUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore popup blocker
    }

    return webViewUrl;
  }
}

export const filePickerService = new FilePickerService();
