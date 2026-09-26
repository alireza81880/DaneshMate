# 🎓 DaneshMate (دانش‌میت)

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue?style=for-the-badge&logo=react" alt="Platform" />
  <img src="https://img.shields.io/badge/Rust-2021%20Edition-orange?style=for-the-badge&logo=rust" alt="Rust" />
  <img src="https://img.shields.io/badge/Core-Embedded%20C--ABI%20FFI-red?style=for-the-badge" alt="FFI" />
  <img src="https://img.shields.io/badge/Design-Neumorphism%20%2B%20Glass-6366F1?style=for-the-badge" alt="Design" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

> **DaneshMate** is an ultra-fast, offline-first student management and academic companion platform. Built with a tactile **Neumorphic & Liquid Glass** interface in **React Native** and powered by an **embedded local native library (`libdaneshmate_core`) written in Rust**, DaneshMate eliminates network latency and socket overhead by performing sub-millisecond data synchronization directly in-memory across the C-ABI boundary.

---

## 🏛 Architecture Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│                   React Native UI Layer                          │
│   (Neumorphic Buttons, Bento Cards, Tactile Haptics, Expo)       │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Direct In-Memory Calls
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                Native FFI Bridge (C-ABI Layer)                   │
│   Android: JNI / System.loadLibrary("daneshmate_core")           │
│   iOS:     Objective-C / Swift TurboModule (DaneshMateBridge)    │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Raw Pointer Handshake
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│             Embedded Rust Core (libdaneshmate_core)              │
│   • parking_lot::RwLock Concurrent In-Memory Store               │
│   • Zero-overhead JSON Serialization / Deserialization           │
│   • Panic-safe FFI boundary (catch_unwind)                       │
│   • Automatic memory reclamation (daneshmate_free_string)        │
└──────────────────────────────────────────────────────────────────┘
```

### Key Architectural Pillars:
1. **Embedded Local Native Library**: No local HTTP servers or open sockets (`localhost:8080` eliminated). The Rust engine is compiled as a `cdylib` / `staticlib` packaged directly inside the mobile app binary.
2. **Memory Safety & Zero Leaks**: The C-ABI boundary enforces strict pointer lifecycle management (`daneshmate_init_core`, `daneshmate_sync_data`, and `daneshmate_free_string`) protected by Rust `catch_unwind`.
3. **Tactile Micro-Interactions**: Spring physics and multi-level haptic feedback (`light`, `medium`, `success`) across radial navigation, multimodal note recording, and class management.
4. **Resilient Network Decoupling**: If cloud synchronization is unavailable, all mutations are instantly saved in local persistent storage and queued without blocking the user interface.

---

## 📂 Monorepo Structure

```text
daneshmate/
├── .github/
│   └── workflows/
│       └── release.yml            # CI/CD pipeline for Android APK/AAB and iOS XCFramework
├── backend/                       # Embedded Native Rust Core
│   ├── Cargo.toml                 # [lib] cdylib & staticlib crate configuration
│   ├── Makefile                   # Build shortcuts
│   ├── scripts/
│   │   ├── build_rust_mobile.sh   # Bash cross-compiler (Android NDK & iOS XCFramework)
│   │   └── build_rust_mobile.ps1  # PowerShell cross-compiler for Windows
│   └── src/
│       ├── lib.rs                 # C-ABI export functions & in-memory state engine
│       └── models.rs              # Serde data structs (Classes, Profiles, SessionLogs)
├── frontend/                      # React Native Mobile Application
│   ├── android/                   # Android native wrapper & JNI bridge
│   │   └── app/src/main/
│   │       ├── java/com/daneshmate/app/DaneshMateModule.java
│   │       └── jni/daneshmate_jni.cpp
│   ├── ios/                       # iOS native bridging header & module
│   │   ├── DaneshMateBridge.h
│   │   └── DaneshMateBridge.m
│   ├── src/
│   │   ├── api/                   # nativeBridge.ts and syncBridge.ts
│   │   ├── components/            # NeumorphicButton, RadialMenu, BentoCards, Toast
│   │   ├── screens/               # HomeScreen, Notes, Profile, Settings
│   │   ├── tests/                 # ffiSmokeTest.ts end-to-end verification
│   │   └── utils/                 # haptics.ts tactile feedback engine
│   ├── App.tsx                    # React Native application root
│   ├── app.json                   # Expo / Android release configuration
│   └── package.json               # Mobile scripts & dependencies
└── scripts/
    └── run_smoke_test.ts          # Automated CI runner for FFI sanity check
```

---

## ⚡ Quick Start

### 1. Run the Web & Simulator Preview
```bash
# Install dependencies
npm install

# Start Vite preview server
npm run dev

# Run automated FFI sanity smoke test
npm run test:ffi
```

### 2. Run React Native Mobile Client
```bash
cd frontend
npm install

# Start Expo development server
npx expo start
```

---

## 🛠 Mobile Cross-Compilation & Release Pipeline

### Android (`.so` jniLibs) & iOS (`.xcframework`)
Run the automated build script:
```bash
chmod +x backend/scripts/build_rust_mobile.sh
./backend/scripts/build_rust_mobile.sh
```

This compiles `libdaneshmate_core` for all standard target triples:
- **Android targets:** `aarch64-linux-android`, `armv7-linux-androideabi`, `x86_64-linux-android`
  - Output: `frontend/android/app/src/main/jniLibs/{arm64-v8a, armeabi-v7a, x86_64}/libdaneshmate_core.so`
- **iOS targets:** `aarch64-apple-ios` (Device), `aarch64-apple-ios-sim` (Apple Silicon Simulator)
  - Output: `frontend/ios/Frameworks/DaneshMateCore.xcframework`

### Continuous Delivery (GitHub Actions)
Triggered automatically on version tags (`git tag v1.0.0 && git push origin v1.0.0`):
1. Sets up Rust, NDK r26b, Java 17, and Node.js.
2. Cross-compiles native Rust binaries for all architectures.
3. Executes end-to-end FFI TypeScript smoke tests.
4. Packages Android APK/AAB and iOS Framework artifacts.
5. Publishes a GitHub Release with all production assets attached.

---

## 🧪 FFI Smoke Test Verification

Run the automated verification suite anytime:
```bash
npm run test:ffi
```
Verifies:
* `daneshmate_init_core()` memory allocation
* `daneshmate_sync_data()` JSON round-trip mutations
* UTF-8 character integrity for Persian text and emojis
* High-speed non-blocking execution (< 2ms per sync)

---

## 📄 License
Released under the [MIT License](LICENSE).
