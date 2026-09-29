const {
  withMainApplication,
  withDangerousMod,
  withAppBuildGradle,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const pkg = {
  name: 'daneshmate-native-core',
  version: '1.0.0',
};

/**
 * Copies native Java bridge source files from the persistent repository
 * location (frontend/native/android) into the scaffolded Android native project.
 */
function withDaneshMateNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      const sourceNativeDir = path.join(projectRoot, 'native', 'android');
      const targetJavaDir = path.join(platformRoot, 'app', 'src', 'main', 'java', 'com', 'daneshmate', 'app');

      if (!fs.existsSync(sourceNativeDir)) {
        console.warn(`[withDaneshMate] Source native directory not found: ${sourceNativeDir}`);
        return config;
      }

      // Ensure target Java directory exists
      fs.mkdirSync(targetJavaDir, { recursive: true });

      // Copy Java native module and package
      const javaFiles = ['DaneshMateModule.java', 'DaneshMatePackage.java'];
      for (const file of javaFiles) {
        const srcFile = path.join(sourceNativeDir, file);
        const dstFile = path.join(targetJavaDir, file);
        if (fs.existsSync(srcFile)) {
          fs.copyFileSync(srcFile, dstFile);
          console.log(`[withDaneshMate] Copied ${file} -> app/src/main/java/com/daneshmate/app/`);
        }
      }

      // Ensure bundled fonts are copied to Android assets
      const sourceFontsDir = path.join(projectRoot, 'assets', 'fonts');
      const targetFontsDir = path.join(platformRoot, 'app', 'src', 'main', 'assets', 'fonts');
      if (fs.existsSync(sourceFontsDir)) {
        fs.mkdirSync(targetFontsDir, { recursive: true });
        const fontFiles = fs.readdirSync(sourceFontsDir);
        for (const font of fontFiles) {
          if (font.endsWith('.ttf') || font.endsWith('.otf')) {
            fs.copyFileSync(path.join(sourceFontsDir, font), path.join(targetFontsDir, font));
          }
        }
        console.log(`[withDaneshMate] Copied ${fontFiles.length} fonts -> app/src/main/assets/fonts/`);
      }

      return config;
    },
  ]);
}

/**
 * Registers DaneshMatePackage in MainApplication (Kotlin or Java) idempotently.
 */
function withDaneshMatePackageRegistration(config) {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    // Idempotency check: do not inject if already registered
    if (contents.includes('DaneshMatePackage')) {
      return config;
    }

    // 1. Kotlin template (Expo SDK 51 default)
    if (contents.includes('PackageList(this).packages.apply {')) {
      contents = contents.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n              add(DaneshMatePackage())'
      );
      console.log('[withDaneshMate] Registered DaneshMatePackage() in MainApplication.kt');
    }
    // 2. Java template fallback
    else if (contents.includes('new PackageList(this).getPackages();')) {
      contents = contents.replace(
        'new PackageList(this).getPackages();',
        'List<ReactPackage> packages = new PackageList(this).getPackages();\n          packages.add(new DaneshMatePackage());\n          return packages;'
      );
      console.log('[withDaneshMate] Registered DaneshMatePackage() in MainApplication.java');
    }

    config.modResults.contents = contents;
    return config;
  });
}

/**
 * Configures signingConfigs.release and binds it strictly to the release build type in app/build.gradle
 */
function withDaneshMateSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    // Idempotency check: do not inject if marker comment already present
    if (buildGradle.includes('// daneshmate-signing')) {
      return config;
    }

    const releaseSigningBlock = `
        // daneshmate-signing
        release {
            def keystorePath = System.getenv("RELEASE_KEYSTORE_PATH") ?: "release.keystore"
            if (file(keystorePath).exists()) {
                storeFile file(keystorePath)
                storePassword System.getenv("RELEASE_KEYSTORE_PASSWORD") ?: ""
                keyAlias System.getenv("RELEASE_KEY_ALIAS") ?: ""
                keyPassword System.getenv("RELEASE_KEY_PASSWORD") ?: ""
            }
        }`;

    buildGradle = buildGradle.replace(
      /signingConfigs\s*\{/,
      `signingConfigs {${releaseSigningBlock}`
    );

    // Strictly enforce signingConfigs.release for release build type (never debug fallback for release)
    buildGradle = buildGradle.replace(
      /release\s*\{(\s*)signingConfig\s+signingConfigs\.debug/,
      'release {$1signingConfig signingConfigs.release'
    );

    config.modResults.contents = buildGradle;
    return config;
  });
}

/**
 * DaneshMate Expo Config Plugin
 */
function withDaneshMate(config) {
  config = withDaneshMateNativeFiles(config);
  config = withDaneshMatePackageRegistration(config);
  config = withDaneshMateSigning(config);
  return config;
}

module.exports = createRunOncePlugin(withDaneshMate, pkg.name, pkg.version);
