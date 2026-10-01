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
            // Check if it is already a content:// URI
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

            File file = new File(cleanPath);
            if (!file.exists()) {
                call.reject("فایل در حافظه دستگاه یافت نشد.");
                return;
            }

            // Resolve MIME type if missing or generic
            if (contentType == null || contentType.isEmpty() || "*/*".equals(contentType)) {
                String name = file.getName();
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
            Uri contentUri = FileProvider.getUriForFile(getContext(), authority, file);

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
