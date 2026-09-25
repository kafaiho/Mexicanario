const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Three.js usa archivos .cjs que Metro no reconoce por defecto
config.resolver.sourceExts.push("cjs");

// Registrar .glb como asset para que Metro pueda empaquetar modelos 3D
config.resolver.assetExts.push("glb");

// Necesario para que Three.js resuelva sus módulos internos
config.resolver.unstable_enablePackageExports = true;

// Nota: NO redirigir react-native-svg a lib/commonjs — Metro debe usar
// src/ para que el plugin de codegen genere los view configs (RNSVG*).
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // En Expo Go (desarrollo sin EAS Build) usamos un mock de AdMob para
  // evitar el crash de TurboModuleRegistry.getEnforcing al cargar el módulo.
  // En "eas build" la variable EAS_BUILD=true y se usa el módulo real.
  if (
    moduleName === "react-native-google-mobile-ads" &&
    !process.env.EAS_BUILD
  ) {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "src/mocks/google-mobile-ads.js"),
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
