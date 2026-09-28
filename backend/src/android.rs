//! DaneshMate Android JNI Native Bindings
//!
//! Direct JNI exports for `com.daneshmate.app.DaneshMateModule`.
//! Eliminates external C++ JNI bridge and CMake build configurations.

use std::panic::{catch_unwind, AssertUnwindSafe};
use jni::objects::{JClass, JString};
use jni::sys::jstring;
use jni::JNIEnv;

/// JNI native binding for DaneshMateModule.nativeInitCore()
/// Initializes the DaneshMate embedded in-memory core.
#[no_mangle]
pub extern "system" fn Java_com_daneshmate_app_DaneshMateModule_nativeInitCore(
    mut _env: JNIEnv,
    _class: JClass,
) {
    let _ = catch_unwind(AssertUnwindSafe(|| {
        crate::daneshmate_init_core();
    }));
}

/// JNI native binding for DaneshMateModule.nativeResetStore()
/// Resets the in-memory data store to zero state.
#[no_mangle]
pub extern "system" fn Java_com_daneshmate_app_DaneshMateModule_nativeResetStore(
    mut _env: JNIEnv,
    _class: JClass,
) {
    let _ = catch_unwind(AssertUnwindSafe(|| {
        crate::daneshmate_reset_store();
    }));
}

/// JNI native binding for DaneshMateModule.nativeSyncData(String payloadJson)
/// Synchronizes student profile, classes, and multimodal logs in memory.
/// Preserves UTF-8 Persian characters without corruption.
#[no_mangle]
pub extern "system" fn Java_com_daneshmate_app_DaneshMateModule_nativeSyncData(
    mut env: JNIEnv,
    _class: JClass,
    payload_json: JString,
) -> jstring {
    let result = catch_unwind(AssertUnwindSafe(|| {
        let payload_str: Option<String> = if payload_json.is_null() {
            None
        } else {
            match env.get_string(&payload_json) {
                Ok(java_str) => Some(java_str.to_string_lossy().into_owned()),
                Err(_) => None,
            }
        };

        let response = crate::sync_data_core(payload_str.as_deref());
        serde_json::to_string(&response).unwrap_or_else(|e| {
            format!(r#"{{"success":false,"message":"Serialization failed: {}"}}"#, e)
        })
    }));

    let json_to_return = match result {
        Ok(json) => json,
        Err(_) => r#"{"success":false,"message":"Rust core panicked safely inside Android JNI boundary"}"#.to_string(),
    };

    match env.new_string(&json_to_return) {
        Ok(jstr) => jstr.into_raw(),
        Err(_) => std::ptr::null_mut(),
    }
}
