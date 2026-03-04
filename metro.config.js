const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Three.js usa archivos .cjs que Metro no reconoce por defecto
config.resolver.sourceExts.push("cjs");

// Registrar .glb como asset para que Metro pueda empaquetar modelos 3D
config.resolver.assetExts.push("glb");

// Necesario para que Three.js resuelva sus módulos internos
config.resolver.unstable_enablePackageExports = true;

// react-native-svg "react-native" field apunta a src/index.ts que
// falla con package exports habilitado. Redirigir al build compilado.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-svg") {
    return {
      type: "sourceFile",
      filePath: path.resolve(
        __dirname,
        "node_modules/react-native-svg/lib/commonjs/index.js"
      ),
    };
  }

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
