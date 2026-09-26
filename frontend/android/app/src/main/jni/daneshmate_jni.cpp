#include <jni.h>
#include <string>

// External Rust C-ABI symbol declarations from libdaneshmate_core
extern "C" {
    void daneshmate_init_core(void);
    char* daneshmate_sync_data(const char* payload_json);
    void daneshmate_free_string(char* ptr);
}

extern "C" JNIEXPORT void JNICALL
Java_com_daneshmate_app_DaneshMateModule_nativeInitCore(
    JNIEnv* env,
    jclass /* clazz */) {
    daneshmate_init_core();
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_daneshmate_app_DaneshMateModule_nativeSyncData(
    JNIEnv* env,
    jclass /* clazz */,
    jstring payload_json) {
    const char* c_payload = nullptr;
    if (payload_json != nullptr) {
        c_payload = env->GetStringUTFChars(payload_json, nullptr);
    }

    char* rust_result = daneshmate_sync_data(c_payload);

    if (c_payload != nullptr) {
        env->ReleaseStringUTFChars(payload_json, c_payload);
    }

    jstring j_result = env->NewStringUTF(rust_result ? rust_result : "{}");

    if (rust_result != nullptr) {
        daneshmate_free_string(rust_result);
    }

    return j_result;
}
