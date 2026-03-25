/**
 * Expo Config Plugin — withAndroidProductionFixes
 *
 * Aplica automáticamente los siguientes fixes de producción en cada `expo prebuild`:
 *   1. app_name en strings.xml → "Mexicanario"
 *   2. Elimina permisos peligrosos/innecesarios del AndroidManifest
 *   3. allowBackup → false
 *   3b. windowSoftInputMode → adjustNothing (gameplay no se resize con teclado)
 *   4. ProGuard habilitado en release builds
 *   5. shrinkResources habilitado en release builds
 *   6. Fullscreen immersive mode in MainActivity.kt
 */

const { withAndroidManifest, withStringsXml, withAppBuildGradle, withMainActivity } = require('@expo/config-plugins');

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

    // windowSoftInputMode → adjustNothing (evita resize del layout durante gameplay)
    const activities = manifest.application?.[0]?.activity;
    if (activities) {
      for (const activity of activities) {
        if (activity.$?.['android:name'] === '.MainActivity') {
          activity.$['android:windowSoftInputMode'] = 'adjustNothing';
        }
      }
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
// 6. Fix: Immersive mode in MainActivity.kt
// ─────────────────────────────────────────────
const IMMERSIVE_METHOD = `
  override fun onWindowFocusChanged(hasFocus: Boolean) {
      super.onWindowFocusChanged(hasFocus)
      if (hasFocus) {
          enterImmersiveMode()
      }
  }

  private fun enterImmersiveMode() {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          window.insetsController?.let { controller ->
              controller.hide(
                  android.view.WindowInsets.Type.statusBars() or
                  android.view.WindowInsets.Type.navigationBars()
              )
              controller.systemBarsBehavior =
                  android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
          }
          window.attributes.layoutInDisplayCutoutMode =
              WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
      } else {
          @Suppress("DEPRECATION")
          window.decorView.systemUiVisibility = (
              View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
              or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
              or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
              or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
              or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
              or View.SYSTEM_UI_FLAG_FULLSCREEN
          )
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
              window.attributes.layoutInDisplayCutoutMode =
                  WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
          }
      }
  }`;

const withImmersiveMode = (config) =>
  withMainActivity(config, (mod) => {
    let contents = mod.modResults.contents;

    // Idempotency check
    if (contents.includes('enterImmersiveMode')) {
      return mod;
    }

    // Add imports (after existing android.os.Bundle import)
    if (!contents.includes('import android.view.View')) {
      contents = contents.replace(
        'import android.os.Bundle',
        `import android.os.Bundle\nimport android.view.View\nimport android.view.WindowManager`
      );
    }

    // Add enterImmersiveMode() call in onCreate
    contents = contents.replace(
      'super.onCreate(null)',
      'super.onCreate(null)\n    enterImmersiveMode()'
    );

    // Add onWindowFocusChanged + enterImmersiveMode before closing brace of class
    const lastBrace = contents.lastIndexOf('}');
    contents =
      contents.slice(0, lastBrace) +
      IMMERSIVE_METHOD +
      '\n}\n';

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
  config = withImmersiveMode(config);
  return config;
};

module.exports = withAndroidProductionFixes;
