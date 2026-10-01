import { Capacitor, registerPlugin } from '@capacitor/core';
import { FilePicker, PickedFile } from '@capawesome/capacitor-file-picker';
import { nativeStorageService } from './nativeStorageService';
import type { AttachedFile, FileCategory } from '../App';

interface FileOpenerPluginInterface {
  open(options: { filePath: string; contentType?: string; chooserTitle?: string }): Promise<void>;
}

const FileOpener = registerPlugin<FileOpenerPluginInterface>('FileOpener');

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
   * Resolve accurate MIME type for Android ACTION_VIEW intent
   */
  public getMimeType(fileName: string, category?: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc':
        return 'application/msword';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'ppt':
        return 'application/vnd.ms-powerpoint';
      case 'aac':
        return 'audio/aac';
      case 'm4a':
        return 'audio/mp4';
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'txt':
        return 'text/plain';
      default:
        if (category === 'image') return 'image/*';
        if (category === 'pdf') return 'application/pdf';
        if (category === 'word') return 'application/msword';
        if (category === 'powerpoint') return 'application/vnd.ms-powerpoint';
        if (category === 'audio') return 'audio/*';
        return '*/*';
    }
  }

  /**
   * Open attachment with Android's system "Open With / Chooser" intent
   */
  public async openWithNativeChooser(file: AttachedFile): Promise<void> {
    let rawTarget = file.uri || file.url;
    if (!rawTarget) {
      throw new Error('آدرس فایل پیوست در دسترس نیست.');
    }

    if (rawTarget.includes('_capacitor_file_')) {
      rawTarget = rawTarget.replace(/^https?:\/\/[^/]+\/_capacitor_file_/, 'file://');
    }

    if (Capacitor.isNativePlatform()) {
      try {
        const mime = this.getMimeType(file.name, file.type);
        await FileOpener.open({
          filePath: rawTarget,
          contentType: mime,
          chooserTitle: `باز کردن «${file.name}» با`,
        });
        return;
      } catch (err: any) {
        const msg = String(err?.message || err || '');
        if (msg.includes('NO_APP_FOUND')) {
          throw new Error('برنامه‌ای برای باز کردن این فایل روی گوشی پیدا نشد.');
        }
        throw new Error(msg || 'خطا در باز کردن فایل با برنامه‌های گوشی.');
      }
    }

    // Web platform fallback
    const webViewUrl = nativeStorageService.getWebViewUrl(rawTarget);
    if (typeof window !== 'undefined' && webViewUrl) {
      window.open(webViewUrl, '_blank', 'noopener,noreferrer');
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
   * Get usable webview URL for previewing or opening
   */
  public getFileUrl(file: AttachedFile): string {
    const target = file.url || file.uri;
    if (!target) return '';
    return nativeStorageService.getWebViewUrl(target);
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
      if (typeof window !== 'undefined') {
        window.open(webViewUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      // ignore popup blocker
    }

    return webViewUrl;
  }
}

export const filePickerService = new FilePickerService();
