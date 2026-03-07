import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULTS = {
  minAndroidVersionCode: 1,
  minIosVersion: "1.0.0",
  forceUpdate: false,
  updateMessage: "Hay una nueva versión disponible con mejoras y correcciones. ¡Actualiza para seguir jugando!",
};

/** Lee la config de la app (singleton). Siempre devuelve algo aunque la tabla esté vacía. */
export const getAppConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("appConfig").first();
    if (!config) return DEFAULTS;
    return config;
  },
});

/**
 * Actualiza la config remota desde el dashboard de Convex.
 * Ejemplo de uso para forzar actualización a versionCode 9:
 *   setAppConfig({ minAndroidVersionCode: 9, forceUpdate: true })
 */
export const setAppConfig = mutation({
  args: {
    minAndroidVersionCode: v.optional(v.number()),
    minIosVersion:         v.optional(v.string()),
    forceUpdate:           v.optional(v.boolean()),
    updateMessage:         v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("appConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("appConfig", {
        minAndroidVersionCode: args.minAndroidVersionCode ?? DEFAULTS.minAndroidVersionCode,
        minIosVersion:         args.minIosVersion         ?? DEFAULTS.minIosVersion,
        forceUpdate:           args.forceUpdate           ?? DEFAULTS.forceUpdate,
        updateMessage:         args.updateMessage         ?? DEFAULTS.updateMessage,
      });
    }
    return { success: true };
  },
});
