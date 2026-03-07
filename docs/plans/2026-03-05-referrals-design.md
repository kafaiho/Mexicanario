# Sistema "Invita y Gana" — Diseño Aprobado
**Fecha:** 2026-03-05
**Estado:** Aprobado, listo para implementar

---

## Resumen

Sistema de referidos con recompensas asimétricas: el referidor gana más que el referido. Usa deep links `mexicanario://ref=<username>` capturados con `expo-linking`. La UI sigue la estética del Mexicanómetro (barra vertical + tarjetas con emojis mexicanos).

---

## Mecanismo

1. Usuario A tiene `username = "kafai"` → comparte `mexicanario://ref=kafai`
2. Usuario B instala y abre el link → `AsyncStorage.setItem("pendingRef", "kafai")`
3. Usuario B juega anónimo y en algún momento crea cuenta (`registerAccount`)
4. La mutación `registerAccount` consume `pendingRef`, resuelve el referido, reparte monedas, registra en tabla `referrals`, y borra el código pendiente del cliente
5. Si el referidor alcanza milestone (5/10/25/50 cuates), se aplica el bonus extra

---

## Schema (Convex)

### Tabla nueva: `referrals`
```ts
referrals: defineTable({
  referrerId:     v.id("users"),
  referredId:     v.id("users"),
  createdAt:      v.number(),
  coinsReferrer:  v.number(),   // monedas ganadas por el referidor
  coinsReferred:  v.number(),   // monedas ganadas por el referido
  milestoneBonus: v.optional(v.boolean()), // true si este referido activó milestone
})
  .index("by_referrer", ["referrerId"])
  .index("by_referred",  ["referredId"])
```

### Campos nuevos en `users`
```ts
referredBy:    v.optional(v.id("users")), // quién me invitó (solo 1 vez)
referralCount: v.optional(v.number()),    // caché del total de cuates invitados
```
> `referralCode` no se agrega — se usa directamente el `username` existente.

---

## Recompensas

### Base por referido (asimétrica)
| Rol | Recompensa |
|-----|-----------|
| Referido (nuevo usuario) | +200 monedas |
| Referidor (quien invitó) | +300 monedas |

### Milestones del referidor
| # Cuates | Emoji | Título | Bonus extra |
|----------|-------|--------|-------------|
| 5        | 🌮    | Corredor de Voz | +500 monedas + 2 diamantes |
| 10       | 🎺    | Embajador del Barrio | +1,000 monedas + 5 diamantes |
| 25       | 🦅    | El Mero Influencer | +2,000 monedas + 15 diamantes |
| 50       | 🏆    | Leyenda del Barrio | +3,000 monedas + 30 diamantes |

---

## Anti-abuso
- Un usuario solo puede ser referido una vez (campo `referredBy`)
- No puedes referirte a ti mismo
- `pendingRef` en AsyncStorage se consume una sola vez al registrarse
- Solo usuarios con `username` pueden generar links (previene anónimos)

---

## Mutación principal: `claimReferral`

```
args: { referredUserId, referrerUsername }
handler:
  1. Buscar referrer por username
  2. Validar: referrer existe, ≠ referred, referred no tiene referredBy
  3. Calcular cuantos referidos tiene ya el referrer (referralCount)
  4. Determinar si este referido activa milestone
  5. Patch usuario referido: coins += 200, referredBy = referrerId
  6. Patch usuario referidor: coins += 300 (+bonus milestone), diamonds += (si aplica), referralCount += 1
  7. Insert en referrals
  8. Retornar { coinsReferrer, coinsReferred, milestoneReached? }
```

La mutación se llama desde `registerAccount` (si `pendingRef` está presente en el payload).

---

## UI

### Pantalla "Cuates Invitados" (en ProfileScreen)
- Se abre desde el botón "Invitar" existente en ProfileScreen
- Reemplaza el `InviteModal` stub actual
- Estética: igual que Mexicanómetro — fondo `#FFE4B5`, bordes `#8B4513`, tarjetas amber/gold

**Secciones del modal:**
1. **Header:** "Invita y Gana 📣" + botón cerrar naranja
2. **Banner cuates actuales:** Emoji grande + contador `X cuates invitados` + próximo milestone
3. **Botón "Compartir mi link"** (verde) → `Share.share({ message, url })`
4. **Barra vertical de milestones** (idéntica a Mexicanómetro) con dots en 5/10/25/50
5. **Tarjetas desbloqueadas/bloqueadas** por milestone alcanzado

### Integración en ProfileScreen
- Botón "Invitar" existente ya abre `InviteModal`
- Reemplazar el stub por el nuevo modal con toda la lógica real

---

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `convex/schema.ts` | + tabla `referrals`, + campos `referredBy` / `referralCount` en users |
| `convex/referrals.ts` | NUEVO — mutación `claimReferral`, query `getReferralStats` |
| `convex/friends.ts` | Modificar `registerAccount` para aceptar y consumir `referrerUsername` |
| `src/components/InviteModal.jsx` | Reemplazar stub por modal completo estilo Mexicanómetro |
| `src/screens/ProfileScreen.jsx` | Pasar `userId` al InviteModal para queries |
| `App.jsx` | Capturar deep link `mexicanario://ref=*` al inicio, guardar en AsyncStorage |

---

## Casos de borde

- Usuario abre link pero ya tiene cuenta → ignorar (ya no puede ser referido)
- Usuario abre link sin internet → `pendingRef` queda en AsyncStorage para cuando se registre
- Referidor sin username → no puede generar link (UI muestra "Configura tu usuario primero")
- Doble clic en mismo link → `referredBy` ya seteado, mutación retorna sin hacer nada
