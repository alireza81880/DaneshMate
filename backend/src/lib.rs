//! DaneshMate Embedded Local Native Library (FFI C-ABI Bridge)
//!
//! Provides zero-network, in-memory local data synchronization for iOS and Android.
//! Exposes panic-safe C-ABI functions for direct React Native TurboModule / JNI execution.

use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::sync::Once;
use chrono::Utc;
use parking_lot::RwLock;

pub mod models;
use models::{ClassItem, SessionLog, StudentProfile, SyncPayload, SyncResponse};

static INIT: Once = Once::new();
static DATA_STORE: RwLock<Option<SyncPayload>> = RwLock::new(None);

/// Helper: Safely converts a Rust String into an unmanaged raw C-string pointer.
/// The caller MUST eventually pass this pointer to `daneshmate_free_string`.
fn string_to_c_char(s: String) -> *mut c_char {
    match CString::new(s) {
        Ok(c_str) => c_str.into_raw(),
        Err(_) => std::ptr::null_mut(),
    }
}

/// Helper: Formats an error JSON string pointer across the FFI boundary.
fn error_json_ptr(msg: &str) -> *mut c_char {
    let err = serde_json::json!({
        "success": false,
        "server_timestamp": Utc::now().to_rfc3339(),
        "student_profile": null,
        "classes": [],
        "session_logs": [],
        "active_theme_id": null,
        "message": msg
    });
    string_to_c_char(err.to_string())
}

/// Initializes the DaneshMate embedded in-memory core with a clean zero-data state.
/// Thread-safe and panic-safe.
#[no_mangle]
pub extern "C" fn daneshmate_init_core() {
    let _ = catch_unwind(AssertUnwindSafe(|| {
        INIT.call_once(|| {
            let mut store = DATA_STORE.write();
            if store.is_none() {
                *store = Some(SyncPayload {
                    student_profile: None,
                    classes: vec![],
                    session_logs: vec![],
                    active_theme_id: None,
                    client_timestamp: Some(Utc::now()),
                });
            }
        });
    }));
}

/// Completely resets the in-memory data store to zero state.
/// Thread-safe, panic-safe reset handler for clear data / logout workflows.
#[no_mangle]
pub extern "C" fn daneshmate_reset_store() {
    let _ = catch_unwind(AssertUnwindSafe(|| {
        let mut store = DATA_STORE.write();
        *store = Some(SyncPayload {
            student_profile: None,
            classes: vec![],
            session_logs: vec![],
            active_theme_id: None,
            client_timestamp: Some(Utc::now()),
        });
    }));
}

/// Synchronizes data locally in-memory with zero network overhead.
///
/// - If `payload_json` is NULL or empty string, it reads and returns the current state.
/// - If `payload_json` contains updated data, it merges and persists in-memory.
/// - Returns a heap-allocated JSON C-string. The caller MUST free it with `daneshmate_free_string`.
#[no_mangle]
pub extern "C" fn daneshmate_sync_data(payload_json: *const c_char) -> *mut c_char {
    let result = catch_unwind(AssertUnwindSafe(|| {
        daneshmate_init_core();

        // 1. Check if caller requested read-only query (null or empty string)
        let is_query_only = if payload_json.is_null() {
            true
        } else {
            match unsafe { CStr::from_ptr(payload_json) }.to_str() {
                Ok(s) => s.trim().is_empty(),
                Err(_) => return error_json_ptr("Invalid UTF-8 in payload string"),
            }
        };

        if is_query_only {
            let store = DATA_STORE.read();
            let current = store.as_ref().cloned().unwrap_or_else(|| SyncPayload {
                student_profile: None,
                classes: vec![],
                session_logs: vec![],
                active_theme_id: None,
                client_timestamp: None,
            });

            let response = SyncResponse {
                success: true,
                server_timestamp: Utc::now(),
                student_profile: current.student_profile,
                classes: current.classes,
                session_logs: current.session_logs,
                active_theme_id: current.active_theme_id,
                message: "Fetched local in-memory snapshot via Native FFI".to_string(),
            };

            match serde_json::to_string(&response) {
                Ok(json_str) => string_to_c_char(json_str),
                Err(e) => error_json_ptr(&format!("Serialization failed: {}", e)),
            }
        } else {
            // 2. Parse mutations payload
            let json_str = match unsafe { CStr::from_ptr(payload_json) }.to_str() {
                Ok(s) => s,
                Err(_) => return error_json_ptr("Invalid UTF-8 string encoding"),
            };

            let payload: SyncPayload = match serde_json::from_str(json_str) {
                Ok(p) => p,
                Err(e) => return error_json_ptr(&format!("JSON Parse error: {}", e)),
            };

            let mut store = DATA_STORE.write();
            let current = store.get_or_insert_with(|| SyncPayload {
                student_profile: None,
                classes: vec![],
                session_logs: vec![],
                active_theme_id: None,
                client_timestamp: None,
            });

            // Update in-memory state
            if let Some(profile) = payload.student_profile {
                current.student_profile = Some(profile);
            }
            if !payload.classes.is_empty() {
                current.classes = payload.classes;
            }
            if !payload.session_logs.is_empty() {
                current.session_logs = payload.session_logs;
            }
            if let Some(theme) = payload.active_theme_id {
                current.active_theme_id = Some(theme);
            }
            current.client_timestamp = Some(Utc::now());

            let response = SyncResponse {
                success: true,
                server_timestamp: Utc::now(),
                student_profile: current.student_profile.clone(),
                classes: current.classes.clone(),
                session_logs: current.session_logs.clone(),
                active_theme_id: current.active_theme_id.clone(),
                message: "Synchronized locally in-memory via Native FFI".to_string(),
            };

            match serde_json::to_string(&response) {
                Ok(res_json) => string_to_c_char(res_json),
                Err(e) => error_json_ptr(&format!("Serialization error: {}", e)),
            }
        }
    }));

    match result {
        Ok(ptr) => ptr,
        Err(_) => error_json_ptr("Rust core panicked safely inside FFI boundary"),
    }
}

/// Frees a C-string allocated by Rust on the heap.
/// Prevents memory leaks across the C-ABI boundary.
#[no_mangle]
pub extern "C" fn daneshmate_free_string(ptr: *mut c_char) {
    if ptr.is_null() {
        return;
    }
    let _ = catch_unwind(AssertUnwindSafe(|| {
        unsafe {
            let _ = CString::from_raw(ptr);
        }
    }));
}
