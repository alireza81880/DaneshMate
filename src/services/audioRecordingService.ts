import { Capacitor } from '@capacitor/core';
import { CapacitorAudioRecorder, RecordingStatus } from '@capgo/capacitor-audio-recorder';
import { nativeStorageService, SavedFileResult } from './nativeStorageService';

export interface RecordedAudioResult {
  durationSeconds: number;
  storagePath: string;
  persistentUri: string;
  webViewUrl: string;
}

class AudioRecordingService {
  private isRecording = false;
  private startTime = 0;
  private webMediaRecorder: MediaRecorder | null = null;
  private webAudioChunks: Blob[] = [];

  /**
   * Request microphone permission from user
   */
  public async requestMicPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const check = await CapacitorAudioRecorder.checkPermissions();
        if (check.recordAudio === 'granted') return true;

        const req = await CapacitorAudioRecorder.requestPermissions();
        return req.recordAudio === 'granted';
      } catch (e) {
        console.error('[AudioRecording] Native mic permission error:', e);
        return false;
      }
    } else {
      // Browser permission check
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        return true;
      } catch (e) {
        console.warn('[AudioRecording] Web mic permission denied:', e);
        return false;
      }
    }
  }

  /**
   * Start microphone audio recording
   */
  public async start(): Promise<void> {
    const hasPermission = await this.requestMicPermission();
    if (!hasPermission) {
      throw new Error('دسترسی به میکروفون دستگاه تأیید نشد. لطفاً مجوز را در تنظیمات فعال فرمایید.');
    }

    this.startTime = Date.now();

    if (Capacitor.isNativePlatform()) {
      try {
        // Ensure clean state before starting
        const status = await CapacitorAudioRecorder.getRecordingStatus().catch(() => ({ status: RecordingStatus.Inactive }));
        if (status.status === RecordingStatus.Recording) {
          await CapacitorAudioRecorder.cancelRecording().catch(() => {});
        }

        await CapacitorAudioRecorder.startRecording({
          sampleRate: 44100,
          bitRate: 128000,
        });
        this.isRecording = true;
      } catch (err: any) {
        this.isRecording = false;
        throw new Error(err?.message || 'خطا در آغاز ضبط صدای جلسه با میکروفون دستگاه');
      }
    } else {
      // Web / Browser MediaRecorder implementation
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.webAudioChunks = [];
        this.webMediaRecorder = new MediaRecorder(stream);
        this.webMediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.webAudioChunks.push(e.data);
        };
        this.webMediaRecorder.start();
        this.isRecording = true;
      } catch (err: any) {
        this.isRecording = false;
        throw new Error(err?.message || 'امکان دسترسی به میکروفون در مرورگر وجود ندارد');
      }
    }
  }

  /**
   * Stop recording and persist the audio file to app-private storage
   */
  public async stop(): Promise<RecordedAudioResult> {
    const elapsedSec = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

    if (Capacitor.isNativePlatform()) {
      try {
        const stopRes = await CapacitorAudioRecorder.stopRecording();
        this.isRecording = false;

        const durationSeconds = stopRes.duration ? Math.round(stopRes.duration / 1000) : elapsedSec;

        const savedFile: SavedFileResult = await nativeStorageService.saveRecording(
          stopRes.uri,
          stopRes.blob
        );

        return {
          durationSeconds: Math.max(1, durationSeconds),
          storagePath: savedFile.storagePath,
          persistentUri: savedFile.persistentUri,
          webViewUrl: savedFile.webViewUrl,
        };
      } catch (err: any) {
        this.isRecording = false;
        throw new Error(err?.message || 'خطا در توقف و ذخیره‌سازی فایل صوتی');
      }
    } else {
      // Web / Browser MediaRecorder stop
      return new Promise((resolve, reject) => {
        if (!this.webMediaRecorder) {
          this.isRecording = false;
          return resolve({
            durationSeconds: elapsedSec,
            storagePath: `recordings/web_${Date.now()}.aac`,
            persistentUri: '',
            webViewUrl: '',
          });
        }

        this.webMediaRecorder.onstop = async () => {
          try {
            const blob = new Blob(this.webAudioChunks, { type: 'audio/aac' });
            const savedFile = await nativeStorageService.saveRecording(undefined, blob);
            this.isRecording = false;

            // Stop all media tracks
            if (this.webMediaRecorder?.stream) {
              this.webMediaRecorder.stream.getTracks().forEach((t) => t.stop());
            }

            resolve({
              durationSeconds: elapsedSec,
              storagePath: savedFile.storagePath,
              persistentUri: savedFile.persistentUri,
              webViewUrl: savedFile.webViewUrl,
            });
          } catch (e: any) {
            reject(new Error(e?.message || 'خطا در استخراج صوت وب'));
          }
        };

        this.webMediaRecorder.stop();
      });
    }
  }

  /**
   * Cancel ongoing recording and discard temporary audio
   */
  public async cancel(): Promise<void> {
    if (!this.isRecording) return;
    this.isRecording = false;

    if (Capacitor.isNativePlatform()) {
      try {
        await CapacitorAudioRecorder.cancelRecording();
      } catch {}
    } else if (this.webMediaRecorder) {
      try {
        this.webMediaRecorder.stream.getTracks().forEach((t) => t.stop());
        this.webMediaRecorder.stop();
      } catch {}
      this.webAudioChunks = [];
    }
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const audioRecordingService = new AudioRecordingService();
