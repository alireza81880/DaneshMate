# DaneshMate Mobile Rust Core - Cross-Compilation Script (PowerShell)
Param(
    [string]$NdkPath = $env:ANDROID_NDK_HOME
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Resolve-Path "$ScriptDir\.."
$AndroidJniLibs = "$BackendDir\..\frontend\android\app\src\main\jniLibs"

Write-Host "=== DaneshMate Rust Core Android Cross-Compilation ===" -ForegroundColor Cyan
Set-Location $BackendDir

# Check cargo
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Error "cargo command not found. Install Rust from https://rustup.rs"
}

# Install targets
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android

# Ensure output directories exist
New-Item -ItemType Directory -Force -Path "$AndroidJniLibs\arm64-v8a" | Out-Null
New-Item -ItemType Directory -Force -Path "$AndroidJniLibs\armeabi-v7a" | Out-Null
New-Item -ItemType Directory -Force -Path "$AndroidJniLibs\x86_64" | Out-Null

if (Get-Command cargo-ndk -ErrorAction SilentlyContinue) {
    Write-Host "[+] Building Android targets using cargo-ndk..." -ForegroundColor Green
    cargo ndk -t arm64-v8a -o "$AndroidJniLibs" build --release
    cargo ndk -t armeabi-v7a -o "$AndroidJniLibs" build --release
    cargo ndk -t x86_64 -o "$AndroidJniLibs" build --release
} else {
    Write-Host "[!] cargo-ndk not found, using standard cargo targets..." -ForegroundColor Yellow
    cargo build --target aarch64-linux-android --release
    cargo build --target armv7-linux-androideabi --release
    cargo build --target x86_64-linux-android --release
}

Write-Host "[✓] Cross-compilation completed successfully!" -ForegroundColor Green
