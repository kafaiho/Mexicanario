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
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
