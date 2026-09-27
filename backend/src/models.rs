use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// System status response for health checks and API heartbeat
#[derive(Debug, Serialize, Deserialize)]
pub struct StatusResponse {
    pub status: String,
    pub service: String,
    pub version: String,
    pub timestamp: DateTime<Utc>,
    pub memory_safe: bool,
    pub engine: String,
}

/// Student profile model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudentProfile {
    pub first_name: String,
    pub last_name: String,
    #[serde(default)]
    pub passed_units: Option<String>,
}

/// Class item model for academic scheduling
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassItem {
    pub id: String,
    pub name: String,
    pub day: String,
    pub time_slot: String,
    pub recurrence: String, // e.g. "every_week", "even_weeks", "odd_weeks"
    #[serde(default)]
    pub recurrence_type: Option<String>, // 'even' | 'odd' | 'weekly' | 'bi_weekly'
    #[serde(default)]
    pub anchor_timestamp: Option<i64>, // exact UNIX timestamp of first session
    #[serde(default)]
    pub anchor_date: Option<String>, // e.g. "1405/07/05"
    #[serde(default)]
    pub scheduled_session_timestamps: Vec<i64>, // 8 bi-weekly term sessions
    #[serde(default)]
    pub professor: Option<String>,
    #[serde(default)]
    pub location: Option<String>,
}

/// Metadata for session attachments (PDFs, Audio, Slides, Notes)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachedFileMeta {
    pub id: String,
    pub name: String,
    pub file_type: String,
    pub size_text: String,
    #[serde(default)]
    pub uri: Option<String>,
    #[serde(default)]
    pub url: Option<String>,
}

/// Class session media log with attachments, voice memo, and reminder schedules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionLog {
    pub id: String,
    pub class_id: String,
    pub class_name: String,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub voice_memo_seconds: Option<u32>,
    #[serde(default)]
    pub attachments_meta: Vec<AttachedFileMeta>,
    #[serde(default)]
    pub reminder_schedule: Option<String>,
    #[serde(default)]
    pub has_reminder: bool,
    #[serde(default)]
    pub snoozed_until: Option<String>,
    pub created_at: String,
}

/// Client-to-Server Sync Payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncPayload {
    pub student_profile: Option<StudentProfile>,
    #[serde(default)]
    pub classes: Vec<ClassItem>,
    #[serde(default)]
    pub session_logs: Vec<SessionLog>,
    #[serde(default)]
    pub active_theme_id: Option<String>,
    #[serde(default)]
    pub client_timestamp: Option<DateTime<Utc>>,
}

/// Server-to-Client Sync Response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResponse {
    pub success: bool,
    pub server_timestamp: DateTime<Utc>,
    pub student_profile: Option<StudentProfile>,
    pub classes: Vec<ClassItem>,
    pub session_logs: Vec<SessionLog>,
    pub active_theme_id: Option<String>,
    pub message: String,
}
