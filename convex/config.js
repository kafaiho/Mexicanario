export default {
  // Convex deployment URL — reads EXPO_PUBLIC_CONVEX_URL from EAS env for production builds.
  // Local dev falls back to the dev deployment (vivid-dachshund-63).
  deploymentUrl:
    process.env.EXPO_PUBLIC_CONVEX_URL || "https://vivid-dachshund-63.convex.cloud",
};
