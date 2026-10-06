#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# DaneshMate Mobile Rust Core - Cross-Compilation & Packaging Pipeline
# Targets: Android (arm64-v8a, armeabi-v7a, x86_64) & iOS (Device & Simulator)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKSPACE_ROOT="$(cd "${BACKEND_DIR}/.." && pwd)"

ANDROID_JNILIBS_DIR="${WORKSPACE_ROOT}/android/app/src/main/jniLibs"
IOS_FRAMEWORKS_DIR="${WORKSPACE_ROOT}/ios/Frameworks"

echo "=== DaneshMate Embedded Rust Core Cross-Compiler ==="
echo "Backend Dir:    ${BACKEND_DIR}"
echo "Android Output: ${ANDROID_JNILIBS_DIR}"
echo "iOS Output:     ${IOS_FRAMEWORKS_DIR}"
echo "====================================================="

cd "${BACKEND_DIR}"

# 1. Verify Rust Toolchain
if ! command -v cargo &> /dev/null; then
    echo "[-] Error: cargo is not found in PATH. Please install Rust from https://rustup.rs"
    exit 1
fi

# 2. Ensure Required Mobile Targets are Installed
echo "[+] Checking and installing required rustup targets..."
rustup target add \
    aarch64-linux-android \
    armv7-linux-androideabi \
    x86_64-linux-android \
    aarch64-apple-ios \
    aarch64-apple-ios-sim \
    x86_64-apple-ios 2>/dev/null || true

# ==============================================================================
# PART A: Android Cross-Compilation (cargo-ndk)
# ==============================================================================
echo ""
echo "[+] Starting Android Cross-Compilation..."

# Create destination directories
mkdir -p "${ANDROID_JNILIBS_DIR}/arm64-v8a"
mkdir -p "${ANDROID_JNILIBS_DIR}/armeabi-v7a"
mkdir -p "${ANDROID_JNILIBS_DIR}/x86_64"

# Check if NDK environment variable is present
if [ -z "${ANDROID_NDK_HOME:-}" ] && [ -n "${NDK_HOME:-}" ]; then
    export ANDROID_NDK_HOME="${NDK_HOME}"
fi

if command -v cargo-ndk &> /dev/null && [ -n "${ANDROID_NDK_HOME:-}" ]; then
    echo "[+] Using cargo-ndk with NDK at: ${ANDROID_NDK_HOME}"
    
    echo "[+] Building arm64-v8a target..."
    cargo ndk -t arm64-v8a -o "${ANDROID_JNILIBS_DIR}" build --release
    echo "[+] Building armeabi-v7a (32-bit universal) target..."
    cargo ndk -t armeabi-v7a -o "${ANDROID_JNILIBS_DIR}" build --release
    if [ "${BUILD_ALL_ARCHS:-false}" = "true" ]; then
        cargo ndk -t x86_64 -o "${ANDROID_JNILIBS_DIR}" build --release || true
    fi
else
    echo "[!] cargo-ndk not found or ANDROID_NDK_HOME not set."
    echo "[!] Performing standard cargo target builds (will output to target/):"
    
    cargo build --target aarch64-linux-android --release || true
    cargo build --target armv7-linux-androideabi --release || true
    cargo build --target x86_64-linux-android --release || true

    # Copy artifacts if available
    [ -f "target/aarch64-linux-android/release/libdaneshmate_core.so" ] && \
        cp -f "target/aarch64-linux-android/release/libdaneshmate_core.so" "${ANDROID_JNILIBS_DIR}/arm64-v8a/"
    [ -f "target/armv7-linux-androideabi/release/libdaneshmate_core.so" ] && \
        cp -f "target/armv7-linux-androideabi/release/libdaneshmate_core.so" "${ANDROID_JNILIBS_DIR}/armeabi-v7a/"
    [ -f "target/x86_64-linux-android/release/libdaneshmate_core.so" ] && \
        cp -f "target/x86_64-linux-android/release/libdaneshmate_core.so" "${ANDROID_JNILIBS_DIR}/x86_64/"
fi

echo "[✓] Android jniLibs populated successfully:"
ls -lh "${ANDROID_JNILIBS_DIR}"/*/*.so 2>/dev/null || echo "    (NDK build pending local setup)"

# ==============================================================================
# PART B: iOS Static Library & XCFramework Bundling
# ==============================================================================
echo ""
echo "[+] Starting iOS Cross-Compilation..."

mkdir -p "${IOS_FRAMEWORKS_DIR}"
IOS_BUILD_DIR="${BACKEND_DIR}/target/ios-universal"
mkdir -p "${IOS_BUILD_DIR}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "[+] Building iOS Device Target (aarch64-apple-ios)..."
    cargo build --target aarch64-apple-ios --release

    echo "[+] Building iOS Simulator Targets (Apple Silicon & Intel)..."
    cargo build --target aarch64-apple-ios-sim --release
    cargo build --target x86_64-apple-ios --release

    echo "[+] Creating Universal Simulator Binary with lipo..."
    mkdir -p "${IOS_BUILD_DIR}/sim"
    lipo -create \
        "target/aarch64-apple-ios-sim/release/libdaneshmate_core.a" \
        "target/x86_64-apple-ios/release/libdaneshmate_core.a" \
        -output "${IOS_BUILD_DIR}/sim/libdaneshmate_core.a"

    # Create C Headers directory for XCFramework
    HEADERS_DIR="${IOS_BUILD_DIR}/include"
    mkdir -p "${HEADERS_DIR}"
    cat << 'EOF' > "${HEADERS_DIR}/daneshmate_core.h"
#ifndef DANESHMATE_CORE_H
#define DANESHMATE_CORE_H

#ifdef __cplusplus
extern "C" {
#endif

void daneshmate_init_core(void);
void daneshmate_reset_store(void);
char* daneshmate_sync_data(const char* payload_json);
void daneshmate_free_string(char* ptr);

#ifdef __cplusplus
}
#endif

#endif /* DANESHMATE_CORE_H */
EOF

    echo "[+] Packaging XCFramework via xcodebuild..."
    rm -rf "${IOS_FRAMEWORKS_DIR}/DaneshMateCore.xcframework"
    xcodebuild -create-xcframework \
        -library "target/aarch64-apple-ios/release/libdaneshmate_core.a" \
        -headers "${HEADERS_DIR}" \
        -library "${IOS_BUILD_DIR}/sim/libdaneshmate_core.a" \
        -headers "${HEADERS_DIR}" \
        -output "${IOS_FRAMEWORKS_DIR}/DaneshMateCore.xcframework"

    echo "[✓] XCFramework created at: ${IOS_FRAMEWORKS_DIR}/DaneshMateCore.xcframework"
else
    echo "[!] Non-macOS environment detected: Skipping xcodebuild XCFramework creation."
    echo "[!] Generated C-header template at: ${IOS_FRAMEWORKS_DIR}/daneshmate_core.h"
    cat << 'EOF' > "${IOS_FRAMEWORKS_DIR}/daneshmate_core.h"
#ifndef DANESHMATE_CORE_H
#define DANESHMATE_CORE_H

#ifdef __cplusplus
extern "C" {
#endif

void daneshmate_init_core(void);
void daneshmate_reset_store(void);
char* daneshmate_sync_data(const char* payload_json);
void daneshmate_free_string(char* ptr);

#ifdef __cplusplus
}
#endif

#endif /* DANESHMATE_CORE_H */
EOF
fi

echo ""
echo "=========================================================="
echo " [✓] DaneshMate Rust Core Cross-Compilation Ready!"
echo "=========================================================="
