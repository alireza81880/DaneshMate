# DaneshMate Release & Versioning Specification

This document defines the release, versioning, and CI/CD pipeline rules for DaneshMate.

---

## 1. Canonical Version Source
* **Single Source of Truth:** `package.json` (`"version"` field).
* **Format:** Strictly semantic versioning `MAJOR.MINOR.PATCH` (e.g., `1.0.2`).
* All CI/CD jobs, Android packaging, Git tags, and release notes extract the version directly from `package.json`:
  ```bash
  APP_VERSION=$(node -p "require('./package.json').version")
  ```

---

## 2. Android `versionCode` & `versionName`
Android version attributes are computed deterministically from `MAJOR.MINOR.PATCH` without using non-deterministic build counters or `github.run_number`.

### Formula
$$\text{versionCode} = (\text{MAJOR} \times 1{,}000{,}000) + (\text{MINOR} \times 1{,}000) + \text{PATCH}$$

### Examples
| Semver (`versionName`) | Major | Minor | Patch | Calculated `versionCode` |
|---|---|---|---|---|
| `1.0.1` | 1 | 0 | 1 | `1000001` |
| `1.0.2` | 1 | 0 | 2 | `1000002` |
| `1.1.0` | 1 | 1 | 0 | `1001000` |
| `2.0.0` | 2 | 0 | 0 | `2000000` |

### Gradle Injection
In `android/app/build.gradle`:
```groovy
defaultConfig {
    applicationId "com.daneshmate.app"
    versionCode project.hasProperty('versionCode') ? Integer.parseInt(project.property('versionCode').toString()) : 1
    versionName project.hasProperty('versionName') ? project.property('versionName').toString() : "1.0.2"
}
```
In CI/CD (`release.yml`), Gradle is invoked with:
```bash
./gradlew assembleRelease -PversionName="$APP_VERSION" -PversionCode="$APP_VERSION_CODE"
```

---

## 3. Git Tagging & Release Trigger
* **Trigger:** Pushing a commit to the `main` branch with a bumped version in `package.json`, or manually triggering `workflow_dispatch`.
* **Tag Format:** `vX.Y.Z` (e.g., `v1.0.2`).
* **Automated Tagging:** When CI confirms the version does not yet exist, it builds and signs the artifacts, tags the commit, and publishes the GitHub Release.

---

## 4. Tag Safety & Immutability Rules
* **Historical Tag Protection:** The existing tag `v1.0.1` is historical and permanent. It must **never** be deleted, moved, or overwritten.
* **No Tag Reuse:** Existing release tags can never be overwritten or retargeted. If `vX.Y.Z` already exists on the remote repository, the release pipeline immediately terminates with an error:
  ```bash
  [-] ERROR: Tag vX.Y.Z already exists in repository!
  [-] Tag Safety Policy: Existing release tags must NEVER be modified or overwritten.
  ```
* To issue changes, always bump `package.json` to a new patch or minor version.

---

## 5. Production Signing Credentials
Release APKs must be signed using the production keystore. The following 4 GitHub Secrets are required:
* `RELEASE_KEYSTORE_BASE64`: Base64-encoded Java keystore (`.keystore` / `.jks`).
* `RELEASE_KEYSTORE_PASSWORD`: Keystore passphrase.
* `RELEASE_KEY_ALIAS`: Key alias.
* `RELEASE_KEY_PASSWORD`: Key alias passphrase.

The temporary keystore is decoded outside the repository tree (`${{ runner.temp }}`) and securely deleted immediately after the build step completes.

---

## 6. Release Artifacts & Verification
* **Android Release APK:** `DaneshMate-Android-v${APP_VERSION}.apk` (e.g., `DaneshMate-Android-v1.0.2.apk`).
  - Architecture: Embedded 64-bit `arm64-v8a` native Rust library + Capacitor WebView container.
  - Validated metadata: `applicationId = com.daneshmate.app`, `versionName = APP_VERSION`, `versionCode = APP_VERSION_CODE`.
  - Signature: Verified via `apksigner verify --print-certs`.
  - Embedded assets: Verified presence of `assets/public/index.html`.
* **PWA Archive:** `DaneshMate-v${APP_VERSION}-PWA.zip`.
* **Integrity Manifest:** `SHA256SUMS.txt` generated and published with each release.
