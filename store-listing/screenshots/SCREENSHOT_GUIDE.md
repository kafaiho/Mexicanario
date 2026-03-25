# Screenshot Guide — Mexicanario v1.4.0

## Required Sizes

### Google Play
- Phone: 1080x1920 (16:9) or 1080x2340 (19.5:9) — min 2, max 8
- Tablet 7": 1200x1920 — min 1
- Tablet 10": 1600x2560 — min 1

### App Store
- iPhone 6.7" (iPhone 15 Pro Max): 1290x2796 — required
- iPhone 6.5" (iPhone 14 Plus): 1284x2778 — required
- iPhone 5.5" (iPhone 8 Plus): 1242x2208 — required
- iPad Pro 12.9": 2048x2732 — required if iPad supported

## 8 Screenshots to Take (in order)

### 1. GAMEPLAY — "Adivina la Palabra"
- Screen: GameplayScreen with a word partially filled
- Show: tiles, keyboard, combo counter, pet companion
- Caption: "Adivina modismos mexicanos letra por letra"

### 2. COLECCIONES — "19 Categorias"
- Screen: ColeccionScreen showing the grid of 19 categories
- Show: unlocked + locked categories with progress bars
- Caption: "+1,250 palabras en 19 categorias culturales"

### 3. MAPA — "Tu Viaje por Mexico"
- Screen: MapScreen showing level groups with progress
- Show: completed, active, and locked groups
- Caption: "Avanza por niveles y desbloquea zonas"

### 4. PVP — "Duelos en Vivo"
- Screen: PvPScreen mid-match or matchmaking
- Show: ELO badge, opponent progress, timer
- Caption: "Compite contra jugadores reales en tiempo real"

### 5. MINIJUEGOS — "5 Modos de Juego"
- Screen: JuegosScreen showing the 4 game cards
- Show: Albures, Loteria, Taquero, Nahual cards
- Caption: "Loteria, Albures, Taquero Rush y mas"

### 6. MASCOTA — "Cria tu Compañero"
- Screen: MascotaScreen with pet at stage 3-4
- Show: pet evolution stages, name, bond meter
- Caption: "Ajolote, Xolo o Alebrije — 6 etapas de evolucion"

### 7. LIGA — "Compite Cada Semana"
- Screen: LeaderboardScreen showing league table
- Show: tier badge, ranking, promotion/demotion zones
- Caption: "Liga semanal con 7 divisiones competitivas"

### 8. VICTORIA — "Celebra tus Logros"
- Screen: VictoryModal after completing a level
- Show: confetti, word reveal, coin rewards, progress ring
- Caption: "Gana monedas, diamantes y sube de rango"

## How to Take Screenshots

### Option A: Emulator (fastest)
```bash
# Android
adb exec-out screencap -p > screenshot_1.png

# iOS Simulator
xcrun simctl io booted screenshot screenshot_1.png
```

### Option B: EAS (device screenshots)
Take screenshots on physical device, transfer via AirDrop/USB.

### Option C: Expo Go
Open each screen, take screenshot with device buttons.

## Tips
- Use a fresh account (level 1-5) for gameplay screenshot
- Use your main account for collection/league screenshots
- Take at LEAST 2x resolution (will be downscaled)
- Light mode, full battery, no notifications visible
- Hide the status bar clock if possible
- For Google Play: add colored background frames with captions using Canva/Figma
