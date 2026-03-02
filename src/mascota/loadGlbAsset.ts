// ─── GLB Asset Loader for React Native ──────────────────────────────────────
// Bridges Metro's bundled asset system to a raw ArrayBuffer
// that GLTFLoader.parse() can consume.
//
// Usage:
//   const moduleId = require("../../assets/models/xolo.glb");
//   const buffer = await loadGlbAsset(moduleId);
//   controller.init(scene, buffer);

import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

export async function loadGlbAsset(
  moduleId: number,
): Promise<ArrayBuffer | null> {
  try {
    const [asset] = await Asset.loadAsync(moduleId);
    if (!asset?.localUri) return null;

    const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Decode base64 to ArrayBuffer
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch {
    return null;
  }
}
