import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Tienda única de la app. Cualquier pantalla o modal la abre con
 *   const { openShop } = useShop();
 *   openShop("varos");            // "varos" | "diamantes" | "trajes" | "racha" | "plus"
 * Si se abre desde otro Modal, cierra ese modal primero y usa { afterModal: true }
 * para esperar a que termine su animación (iOS no presenta dos modales a la vez).
 */
const ShopContext = createContext({ openShop: () => {}, closeShop: () => {} });

const MODAL_DISMISS_MS = 350;

export function ShopProvider({ children }) {
  const [shop, setShop] = useState({ open: false, section: null, request: 0 });

  const openShop = useCallback((section = null, { afterModal = false } = {}) => {
    const show = () => setShop((prev) => ({ open: true, section, request: prev.request + 1 }));
    if (afterModal) setTimeout(show, MODAL_DISMISS_MS);
    else show();
  }, []);
  const closeShop = useCallback(() => setShop((prev) => ({ ...prev, open: false })), []);
  const value = useMemo(() => ({ openShop, closeShop }), [openShop, closeShop]);

  // Carga diferida: rompe el ciclo ShopScreen → TopBar → ShopContext
  const ShopScreen = shop.open ? require("../screens/ShopScreen").default : null;

  return (
    <ShopContext.Provider value={value}>
      {children}
      {shop.open && (
        <ShopScreen visible onClose={closeShop} initialSection={shop.section} sectionRequest={shop.request} />
      )}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);
