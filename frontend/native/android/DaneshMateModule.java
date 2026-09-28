package com.daneshmate.app;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * DaneshMate Native Android Bridge Module
 * Connects React Native JS/TS directly to the embedded Rust 'daneshmate_core' library via JNI.
 */
public class DaneshMateModule extends ReactContextBaseJavaModule {
    public static final String MODULE_NAME = "DaneshMateCore";
    private static volatile boolean isLoaded = false;

    static {
        try {
            System.loadLibrary("daneshmate_core");
            isLoaded = true;
        } catch (Throwable t) {
            isLoaded = false;
            System.err.println("DaneshMateModule: Failed to load libdaneshmate_core.so: " + t.getMessage());
        }
    }

    public DaneshMateModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    // Direct JNI functions exported by libdaneshmate_core.so
    private static native void nativeInitCore();
    private static native String nativeSyncData(String payloadJson);
    private static native void nativeResetStore();

    @ReactMethod
    public void initCore(Promise promise) {
        if (!isLoaded) {
            promise.reject("E_NOT_LOADED", "libdaneshmate_core.so is not loaded");
            return;
        }
        try {
            nativeInitCore();
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("E_INIT_FAILED", "Failed to initialize DaneshMate native core: " + t.getMessage(), t);
        }
    }

    @ReactMethod
    public void syncData(String payloadJson, Promise promise) {
        if (!isLoaded) {
            promise.reject("E_NOT_LOADED", "libdaneshmate_core.so is not loaded");
            return;
        }
        try {
            String resultJson = nativeSyncData(payloadJson != null ? payloadJson : "");
            promise.resolve(resultJson);
        } catch (Throwable t) {
            promise.reject("E_SYNC_FAILED", "Native Rust data synchronization failed: " + t.getMessage(), t);
        }
    }

    @ReactMethod
    public void resetStore(Promise promise) {
        if (!isLoaded) {
            promise.reject("E_NOT_LOADED", "libdaneshmate_core.so is not loaded");
            return;
        }
        try {
            nativeResetStore();
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("E_RESET_FAILED", "Failed to reset DaneshMate native store: " + t.getMessage(), t);
        }
    }
}
