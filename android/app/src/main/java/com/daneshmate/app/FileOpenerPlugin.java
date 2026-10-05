package com.daneshmate.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.webkit.MimeTypeMap;

import androidx.core.content.FileProvider;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "FileOpener")
public class FileOpenerPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        String filePath = call.getString("filePath");
        String contentType = call.getString("contentType");
        String chooserTitle = call.getString("chooserTitle");
        if (chooserTitle == null || chooserTitle.trim().isEmpty()) {
            chooserTitle = "باز کردن فایل با";
        }

        if (filePath == null || filePath.trim().isEmpty()) {
            call.reject("filePath is required");
            return;
        }

        try {
            // Keep content:// handling working cleanly
            if (filePath.startsWith("content://")) {
                Uri contentUri = Uri.parse(filePath);
                if (contentType == null || contentType.isEmpty() || "*/*".equals(contentType)) {
                    contentType = getContext().getContentResolver().getType(contentUri);
                    if (contentType == null) contentType = "*/*";
                }

                Intent viewIntent = new Intent(Intent.ACTION_VIEW);
                viewIntent.setDataAndType(contentUri, contentType);
                viewIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent chooserIntent = Intent.createChooser(viewIntent, chooserTitle);
                chooserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                chooserIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                getContext().startActivity(chooserIntent);
                call.resolve();
                return;
            }

            // 3. Reject ../ traversal attempts upfront
            if (filePath.contains("../") || filePath.contains("..\\") || filePath.contains("/..") || filePath.contains("\\..")) {
                call.reject("مسیر فایل حاوی نویسه‌های غیرمجاز است.", "PATH_TRAVERSAL_DETECTED");
                return;
            }

            // Normal file path or file:// URI
            String cleanPath = filePath;
            if (filePath.startsWith("file://")) {
                try {
                    cleanPath = Uri.parse(filePath).getPath();
                } catch (Exception ignored) {
                    cleanPath = filePath.substring(7);
                }
            }

            if (cleanPath == null) {
                cleanPath = filePath;
            }

            File rawFile = new File(cleanPath);

            // 1. Canonical path resolution
            File canonicalFile;
            try {
                canonicalFile = rawFile.getCanonicalFile();
            } catch (IOException e) {
                call.reject("خطا در حل مسیر فایل: " + e.getMessage(), "CANONICALIZATION_FAILED");
                return;
            }

            // 5. Reject non-existent files or directories
            if (!canonicalFile.exists() || !canonicalFile.isFile()) {
                call.reject("فایل در حافظه دستگاه یافت نشد.", "FILE_NOT_FOUND");
                return;
            }

            // 2, 4, 6. Allowed-root validation and symlink escape prevention
            // Allowed roots are strictly the application's actual attachment, recording, and cache folders
            List<File> allowedRoots = new ArrayList<>();
            File filesDir = getContext().getFilesDir();
            File attachmentsDir = new File(filesDir, "attachments");
            if (!attachmentsDir.exists()) attachmentsDir.mkdirs();
            allowedRoots.add(attachmentsDir.getCanonicalFile());

            File recordingsDir = new File(filesDir, "recordings");
            if (!recordingsDir.exists()) recordingsDir.mkdirs();
            allowedRoots.add(recordingsDir.getCanonicalFile());

            File cacheDir = getContext().getCacheDir();
            if (cacheDir != null) {
                allowedRoots.add(cacheDir.getCanonicalFile());
            }

            File extCache = getContext().getExternalCacheDir();
            if (extCache != null) {
                allowedRoots.add(extCache.getCanonicalFile());
            }

            boolean isWithinAllowedRoot = false;
            String targetCanonicalPath = canonicalFile.getCanonicalPath();

            for (File root : allowedRoots) {
                String rootCanonicalPath = root.getCanonicalPath();
                if (!rootCanonicalPath.endsWith(File.separator)) {
                    rootCanonicalPath = rootCanonicalPath + File.separator;
                }
                if (targetCanonicalPath.startsWith(rootCanonicalPath)) {
                    isWithinAllowedRoot = true;
                    break;
                }
            }

            if (!isWithinAllowedRoot) {
                call.reject("دسترسی به فایل خارج از محدوده مجاز ذخیره‌سازی امکان‌پذیر نیست.", "ACCESS_DENIED");
                return;
            }

            // Resolve MIME type if missing or generic
            if (contentType == null || contentType.isEmpty() || "*/*".equals(contentType)) {
                String name = canonicalFile.getName();
                int dotIndex = name.lastIndexOf('.');
                if (dotIndex > 0) {
                    String extension = name.substring(dotIndex + 1).toLowerCase();
                    String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
                    if (mime != null) {
                        contentType = mime;
                    }
                }
            }

            if (contentType == null || contentType.isEmpty()) {
                contentType = "*/*";
            }

            String authority = getContext().getPackageName() + ".fileprovider";
            Uri contentUri = FileProvider.getUriForFile(getContext(), authority, canonicalFile);

            Intent viewIntent = new Intent(Intent.ACTION_VIEW);
            viewIntent.setDataAndType(contentUri, contentType);
            viewIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooserIntent = Intent.createChooser(viewIntent, chooserTitle);
            chooserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            chooserIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            getContext().startActivity(chooserIntent);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("NO_APP_FOUND");
        } catch (Exception e) {
            call.reject("خطا در باز کردن فایل: " + e.getMessage());
        }
    }
}
