import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";

/**
 * Estado ligero de la tienda para toda la app:
 *   mexPlusActive        → ocultar anuncios (beneficio de Mexicanario Plus)
 *   plusRewardAvailable  → regalo mensual de Plus sin reclamar
 *   freeCoinsReady       → monedas gratis listas
 *   hasSomethingToClaim  → globo de la pestaña Tienda
 * Devuelve null mientras carga o sin sesión.
 */
export default function useShopSignals() {
  const { userId } = useAuth();
  return useQuery(api.shop.getShopSignals, userId ? { userId } : "skip") ?? null;
}
