import { useCallback } from "react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import usePetStore from "../store/usePetStore";
import { useUserMutation } from "./useUserMutation";

/**
 * Ponerle o quitarle (null) un traje a la mascota. Cambia al instante en el
 * teléfono y se guarda en la cuenta, así se ve igual en cualquier dispositivo.
 */
export default function useEquipSkin() {
  const { userId } = useAuth();
  const equipPetSkin = useUserMutation(api.shop.equipPetSkin);
  return useCallback((skinId) => {
    const previous = usePetStore.getState().activeSkin;
    usePetStore.getState().setActiveSkin(skinId);
    if (!userId) return;
    equipPetSkin({ userId, skinId }).catch(() => usePetStore.getState().setActiveSkin(previous));
  }, [userId, equipPetSkin]);
}
