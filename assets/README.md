# 🎨 DaneshMate Visual Assets Specification

This directory holds the production visual branding assets, application icons, and splash screens for DaneshMate across iOS, Android, and Web platforms.

---

## 📐 Asset Resolution & Design Guidelines

| File Name | Target Platform | Canvas Size | Format | Safe Zone & Padding Rules |
| :--- | :--- | :--- | :--- | :--- |
| **`icon.png`** | iOS & Default App Store | **1024 × 1024 px** | PNG (No alpha) | Full bleed, square with sharp corners (iOS rounds corners automatically). |
| **`adaptive-icon.png`** | Android (8.0+ Adaptive Icon) | **1024 × 1024 px** | PNG (Transparent) | **Foreground artwork only**. Keep core emblem within the central **66% safe zone** (inner `660 × 660 px`). Background color `#090D16` is rendered by Android system. |
| **`splash.png`** | Mobile Splash Screen | **1242 × 2436 px** (or 1024×1024) | PNG (Transparent/Flat) | Centered branding emblem with `#090D16` background matching `app.json`. |
| **`favicon.png`** | Web Browser Tab Icon | **48 × 48 px** (up to 192×192) | PNG (Transparent) | High-contrast geometric silhouette visible at 16×16 px scale. |

---

## 🎨 Android Adaptive Icon Safe Zone Specification

Android dynamically applies masks (circle, squircle, rounded rectangle) to adaptive icons:
```text
┌────────────────────────────────────────────────────────┐  ◄── 1024 x 1024 Canvas
│                                                        │
│             Transparent Bleed Margin                   │
│                                                        │
│         ┌────────────────────────────────────┐         │
│         │                                    │         │
│         │        Inner Safe Zone (66%)       │         │
│         │            660 x 660 px            │         │
│         │      (Keep emblem inside here)     │         │
│         │                                    │         │
│         └────────────────────────────────────┘         │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🔄 How to Replace with Custom Assets
1. Export your custom vector logo as 32-bit transparent PNGs matching the canvas dimensions above.
2. Overwrite the files in this directory with the exact same filenames:
   - `assets/icon.png`
   - `assets/adaptive-icon.png`
   - `assets/splash.png`
   - `assets/favicon.png`
3. Run `npm run test:ffi` or re-export the application bundles to propagate the new assets.
