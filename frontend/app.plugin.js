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
  version: '1.0.1',
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
        throw new Error(`[withDaneshMate] Source native directory not found: ${sourceNativeDir}`);
      }

      fs.mkdirSync(targetJavaDir, { recursive: true });

      const javaFiles = ['DaneshMateModule.java', 'DaneshMatePackage.java'];
      for (const file of javaFiles) {
        const srcFile = path.join(sourceNativeDir, file);
        const dstFile = path.join(targetJavaDir, file);
        if (!fs.existsSync(srcFile)) {
          throw new Error(`[withDaneshMate] Missing native source: ${srcFile}`);
        }
        fs.copyFileSync(srcFile, dstFile);
        console.log(`[withDaneshMate] Copied ${file} -> app/src/main/java/com/daneshmate/app/`);
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

    if (contents.includes('DaneshMatePackage')) {
      return config;
    }

    if (contents.includes('PackageList(this).packages.apply {')) {
      contents = contents.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n              add(DaneshMatePackage())'
      );
      console.log('[withDaneshMate] Registered DaneshMatePackage() in MainApplication.kt');
    } else if (contents.includes('new PackageList(this).getPackages();')) {
      contents = contents.replace(
        'new PackageList(this).getPackages();',
        'List<ReactPackage> packages = new PackageList(this).getPackages();\n          packages.add(new DaneshMatePackage());\n          return packages;'
      );
      console.log('[withDaneshMate] Registered DaneshMatePackage() in MainApplication.java');
    } else {
      throw new Error('[withDaneshMate] Could not find PackageList in MainApplication to register DaneshMatePackage');
    }

    config.modResults.contents = contents;
    return config;
  });
}

/**
 * Release signing.
 *
 * Appends a second `android {}` block at the END of app/build.gradle. It runs after the
 * template has defined signingConfigs.debug and buildTypes.release, so it can safely
 * override the release signing config ONLY when a real keystore file exists.
 * If no keystore is provided, the template default (debug keystore) stays in place,
 * so the build never breaks and the APK is always installable.
 *
 * NOTE: switching from debug-signed to release-signed APKs changes the signature.
 * Users must uninstall the old APK once before installing the first release-signed one.
 */
function withDaneshMateSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;
    const marker = '// [DaneshMate] release signing';

    if (!buildGradle.includes(marker)) {
      buildGradle += `

${marker}
android {
    def dmStorePath = System.getenv("RELEASE_KEYSTORE_PATH")
    if (dmStorePath != null && !dmStorePath.isEmpty() && file(dmStorePath).exists()) {
        signingConfigs {
            dmRelease {
                storeFile file(dmStorePath)
                storePassword System.getenv("RELEASE_KEYSTORE_PASSWORD")
                keyAlias System.getenv("RELEASE_KEY_ALIAS")
                keyPassword System.getenv("RELEASE_KEY_PASSWORD")
            }
        }
        buildTypes.release.signingConfig = signingConfigs.dmRelease
        println "[DaneshMate] Using release keystore: " + dmStorePath
    } else {
        println "[DaneshMate] No release keystore found, release APK stays debug-signed"
    }
}
`;
    }

    config.modResults.contents = buildGradle;
    return config;
  });
}

function withDaneshMate(config) {
  config = withDaneshMateNativeFiles(config);
  config = withDaneshMatePackageRegistration(config);
  config = withDaneshMateSigning(config);
  return config;
}

module.exports = createRunOncePlugin(withDaneshMate, pkg.name, pkg.version);
