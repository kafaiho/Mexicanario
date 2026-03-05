/**
 * Expo Config Plugin — withAndroidProductionFixes
 *
 * Aplica automáticamente los siguientes fixes de producción en cada `expo prebuild`:
 *   1. app_name en strings.xml → "Mexicanario"
 *   2. Elimina permisos peligrosos/innecesarios del AndroidManifest
 *   3. allowBackup → false
 *   4. ProGuard habilitado en release builds
 *   5. shrinkResources habilitado en release builds
 */

const { withAndroidManifest, withStringsXml, withAppBuildGradle } = require('@expo/config-plugins');

// ─────────────────────────────────────────────
// 1. Fix: app_name correcto en strings.xml
// ─────────────────────────────────────────────
const withCorrectAppName = (config) =>
  withStringsXml(config, (mod) => {
    const strings = mod.modResults.resources.string || [];
    const appNameEntry = strings.find((s) => s.$?.name === 'app_name');
    if (appNameEntry) {
      appNameEntry._ = 'Mexicanario';
    } else {
      strings.push({ $: { name: 'app_name' }, _: 'Mexicanario' });
    }
    mod.modResults.resources.string = strings;
    return mod;
  });

// ─────────────────────────────────────────────
// 2 & 3. Fix: permisos y allowBackup en AndroidManifest
// ─────────────────────────────────────────────
const DANGEROUS_PERMISSIONS = [
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.SYSTEM_ALERT_WINDOW',
];

const withSecureAndroidManifest = (config) =>
  withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;

    // Eliminar permisos peligrosos/innecesarios
    if (manifest['uses-permission']) {
      manifest['uses-permission'] = manifest['uses-permission'].filter((perm) => {
        const name = perm.$?.['android:name'];
        return !DANGEROUS_PERMISSIONS.includes(name);
      });
    }

    // allowBackup → false (evita explotación de recursos del juego)
    if (manifest.application?.[0]?.$) {
      manifest.application[0].$['android:allowBackup'] = 'false';
    }

    return mod;
  });

// ─────────────────────────────────────────────
// 4 & 5. Fix: ProGuard + shrinkResources en build.gradle
// ─────────────────────────────────────────────
const withProductionBuildOptimizations = (config) =>
  withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    // Activar ProGuard
    contents = contents.replace(
      /def enableProguardInReleaseBuilds = \(findProperty\('android\.enableProguardInReleaseBuilds'\) \?: false\)\.toBoolean\(\)/,
      "def enableProguardInReleaseBuilds = (findProperty('android.enableProguardInReleaseBuilds') ?: true).toBoolean()"
    );

    // Activar shrinkResources
    contents = contents.replace(
      /shrinkResources \(findProperty\('android\.enableShrinkResourcesInReleaseBuilds'\)\?\.toBoolean\(\) \?: false\)/,
      "shrinkResources (findProperty('android.enableShrinkResourcesInReleaseBuilds')?.toBoolean() ?: true)"
    );

    mod.modResults.contents = contents;
    return mod;
  });

// ─────────────────────────────────────────────
// Plugin principal — combina todos los fixes
// ─────────────────────────────────────────────
const withAndroidProductionFixes = (config) => {
  config = withCorrectAppName(config);
  config = withSecureAndroidManifest(config);
  config = withProductionBuildOptimizations(config);
  return config;
};

module.exports = withAndroidProductionFixes;
