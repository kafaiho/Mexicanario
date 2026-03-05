import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Animated, AppState, Image, LogBox, Platform, Pressable, Text, View } from "react-native";
import mobileAds, { AdsConsent, AdsConsentStatus } from "react-native-google-mobile-ads";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./convex/_generated/api";
import config from "./convex/config";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { setupNotificationHandler } from "./src/services/notificationService";
import { addCustomerInfoListener, initRevenueCat } from "./src/services/RevenueCatService";
import * as Linking from "expo-linking";

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go",
]);

const MAX_APP_WIDTH = 430;

// Import screens
import Apoyar from "./src/components/Apoyar";
import Calificar from "./src/components/Calificar";
import DailyRewardModal, { useDailyReward } from "./src/components/DailyRewardModal";
import DisconnectModal from "./src/components/DisconnectModal";
import Heriokio from "./src/components/Heriokio";
import Invitar from "./src/components/Invitar";
import Perfil from "./src/components/Perfil";
import PoliticadePrivacidad from "./src/components/PoliticadePrivacidad";
import PrivacyModal from "./src/components/PrivacyModal";
import SettingsModal from "./src/components/SettingsModal";
import SupportModal from "./src/components/SupportModal";
import Terminosdeservio from "./src/components/Terminosdeservio";
import AchievementsScreen from "./src/screens/AchievementsScreen";
import ColeccionScreen from "./src/screens/ColeccionScreen";
import CorreNahualScreen from "./src/screens/CorreNahualScreen";
import DueloAlburesScreen from "./src/screens/DueloAlburesScreen";
import GameplayScreen from "./src/screens/GameplayScreen";
import JuegosScreen from "./src/screens/JuegosScreen";
import LeaderboardScreen from "./src/screens/LeaderboardScreen";
import LoadingScreen from "./src/screens/LoadingScreen";
import LoteriaExpressScreen from "./src/screens/LoteriaExpressScreen";
import MainMenuScreen from "./src/screens/MainMenuScreen";
import MapScreen from "./src/screens/MapScreen";
import MascotaScreen from "./src/screens/MascotaScreen";
import ShopScreen from "./src/screens/ShopScreen";
import TaqueroRushScreen from "./src/screens/TaqueroRushScreen";
import { tapLight } from "./src/services/haptics";
import { playBGM, playSound, preloadSounds, unloadSounds } from "./src/utils/soundManager";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const EmptyComponent = () => null;

/** Tab button with spring bounce + haptic + click sound */
function JuicyTabButton({ children, onPress, accessibilityState, style, ...rest }) {
  const scaleRef = React.useRef(new Animated.Value(1)).current;
  const focused = accessibilityState?.selected;

  const handlePressIn = () => {
    Animated.spring(scaleRef, {
      toValue: 0.85,
      speed: 50,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
    tapLight();
    playSound("click");
  };

  const handlePressOut = () => {
    Animated.spring(scaleRef, {
      toValue: 1,
      speed: 28,
      bounciness: 12,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ flex: 1, alignItems: "center", justifyContent: "center" }, style]}
      {...rest}
    >
      <Animated.View style={{ transform: [{ scale: scaleRef }], alignItems: "center", justifyContent: "center" }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function MainTabs() {
  const [showSettings, setShowSettings] = useState(false);
  const [showHvhu, setShowHvhu] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [showInvitar, setShowInvitar] = useState(false);
  const [showApoyar, setShowApoyar] = useState(false);
  const [showCalificar, setShowCalificar] = useState(false);
  const [showPoliticadePrivacidad, setShowPoliticadePrivacidad] =
    useState(false);
  const [showTerminosdeservio, setShowTerminosdeservio] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);

  // ── Daily reward (7-day login bonus) ────────────────────────────────────────
  const { shouldShow: showDailyReward, currentDay, rewardCoins, claimed, check: checkDailyReward, claim: claimDailyReward, dismiss: dismissDailyReward } = useDailyReward();
  useEffect(() => {
    // Slight delay so the app finishes loading visually before showing the modal
    const t = setTimeout(() => checkDailyReward(), 1200);
    return () => clearTimeout(t);
  }, [checkDailyReward]);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarShowLabel: false,
          tabBarButton: (props) => <JuicyTabButton {...props} />,
          tabBarStyle: {
            height: Platform.OS === "ios" ? 88 : 64,
            paddingBottom: Platform.OS === "ios" ? 24 : 8,
            paddingTop: 8,
            backgroundColor: "#E8C99A",
            borderTopWidth: 0,
            elevation: 12,
            shadowColor: "#5C2800",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.14,
            shadowRadius: 8,
          },
          tabBarIcon: ({ focused, size }) => {
            const ICON_SIZE = size * 1.05;
            const EMOJI_SIZE = size * 1.0;
            const activeColor = "#D36B1E";
            const inactiveColor = "#B38E6A";
            const badgeSize = size * 0.55;

            // Emoji-based tabs
            const emojiTabs = {
              Mascota: "🦎",
              Logros: "🏅",
              Juegos: "🎮",
            };

            // Image-based tabs
            const imageTabs = {
              Home: require("./assets/icons/home.png"),
              "Colección": require("./assets/icons/dictionary.png"),
              Liga: require("./assets/icons/trophy.png"),
              Shop: require("./assets/icons/shop.png"),
              Settings: require("./assets/icons/settings.png"),
            };

            const emoji = emojiTabs[route.name];
            const iconSource = imageTabs[route.name];

            return (
              <View style={{ width: ICON_SIZE + 12, height: ICON_SIZE + 12, alignItems: "center", justifyContent: "center" }}>

                {/* Indicador de estado activo — nodo Mexicanómetro */}
                {focused && (
                  <View style={{
                    position: "absolute",
                    top: 0,
                    width: 28,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: activeColor,
                  }} />
                )}

                {emoji ? (
                  <Text style={{ fontSize: EMOJI_SIZE, opacity: focused ? 1 : 0.65 }}>
                    {emoji}
                  </Text>
                ) : (
                  <Image
                    source={iconSource}
                    style={{
                      width: ICON_SIZE,
                      height: ICON_SIZE,
                      tintColor: focused ? activeColor : inactiveColor,
                      opacity: focused ? 1 : 0.7,
                    }}
                  />
                )}

                {/* Shop badge */}
                {route.name === "Shop" && (
                  <View style={{
                    position: "absolute", top: -2, right: -2,
                    backgroundColor: "#E74C3C", borderRadius: badgeSize / 2,
                    width: badgeSize, height: badgeSize,
                    justifyContent: "center", alignItems: "center",
                    borderWidth: 1.5, borderColor: "#D4A574",
                  }}>
                    <Text style={{ color: "white", fontSize: badgeSize * 0.6, fontWeight: "bold" }}>1</Text>
                  </View>
                )}
              </View>
            );
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={MainMenuScreen} />
        <Tab.Screen name="Colección" component={ColeccionScreen} />
        <Tab.Screen name="Mascota" component={MascotaScreen} />
        <Tab.Screen name="Logros" component={AchievementsScreen} />
        <Tab.Screen name="Liga" component={LeaderboardScreen} />
        <Tab.Screen name="Juegos" component={JuegosScreen} />
        <Tab.Screen
          name="Shop"
          component={EmptyComponent}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setShowShop(true);
            },
          }}
        />

        {/* Minigames - Hidden from TabBar but inside the Tab Navigator for bottom bar visibility */}
        <Tab.Screen
          name="DueloAlbures"
          component={DueloAlburesScreen}
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
        />
        <Tab.Screen
          name="CorreNahual"
          component={CorreNahualScreen}
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
        />
        <Tab.Screen
          name="TaqueroRush"
          component={TaqueroRushScreen}
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
        />
        <Tab.Screen
          name="LoteriaExpress"
          component={LoteriaExpressScreen}
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
        />
      </Tab.Navigator>

      {/* Modals */}
      <SettingsModal
        visible={showSettings}
        onClose={() => {
          setShowSettings(false);
        }}
        onDisconnect={() => {
          setShowSettings(false);
          setShowDisconnect(true);
        }}
        onInvitar={() => {
          setShowSettings(false);
          setShowInvitar(true);
        }}
        onPoliticadePrivacidad={() => {
          setShowSettings(false);
          setShowPoliticadePrivacidad(true);
        }}
        onTerminosdeservio={() => {
          setShowSettings(false);
          setShowTerminosdeservio(true);
        }}
        onPrivacy={() => {
          setShowSettings(false);
          setShowPrivacy(true);
        }}
        onCalificar={() => {
          setShowSettings(false);
          setShowCalificar(true);
        }}
        onSupport={() => {
          setShowSettings(false);
          setShowSupport(true);
        }}
        onPerfill={() => {
          setShowSettings(false);
          setShowPerfil(true);
        }}
        onApoyar={() => {
          setShowSettings(false);
          setShowApoyar(true);
        }}
      />

      <Heriokio visible={showHvhu} onClose={() => setShowHvhu(false)} />
      <ShopScreen visible={showShop} onClose={() => setShowShop(false)} />
      <DisconnectModal
        visible={showDisconnect}
        onClose={() => setShowDisconnect(false)}
      />
      <Perfil visible={showPerfil} onClose={() => setShowPerfil(false)} />
      <Apoyar visible={showApoyar} onClose={() => setShowApoyar(false)} />
      <Invitar visible={showInvitar} onClose={() => setShowInvitar(false)} />
      <Calificar
        visible={showCalificar}
        onClose={() => setShowCalificar(false)}
      />
      <PoliticadePrivacidad
        visible={showPoliticadePrivacidad}
        onClose={() => setShowPoliticadePrivacidad(false)}
      />
      <Terminosdeservio
        visible={showTerminosdeservio}
        onClose={() => setShowTerminosdeservio(false)}
      />
      <PrivacyModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
      <SupportModal
        visible={showSupport}
        onClose={() => setShowSupport(false)}
      />

      {/* Recompensa diaria — aparece al abrir la app si aún no se ha reclamado */}
      <DailyRewardModal
        visible={showDailyReward}
        currentDay={currentDay}
        rewardCoins={rewardCoins}
        claimed={claimed}
        onClaim={claimDailyReward}
        onDismiss={dismissDailyReward}
      />
    </>
  );
}

const convex = new ConvexReactClient(config.deploymentUrl);

function AppContent() {
  const { isAuthenticated, loading, error, retry, userId } = useAuth();
  const autoFixDatabase    = useMutation(api.patchCategories.autoFixDatabase);
  const syncMexPlus        = useMutation(api.shop.syncMexPlusEntitlement);
  const appState = useRef(AppState.currentState);
  const soundsLoaded = useRef(false);

  useEffect(() => {
    // ── Capture referral deep link at app open ────────────────────────────────
    (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const parsed = Linking.parse(initialUrl);
          const refCode = parsed.queryParams?.ref ?? parsed.path?.replace(/^ref\/?/, "") ?? null;
          if (refCode && typeof refCode === "string" && refCode.trim()) {
            await AsyncStorage.setItem("@mexicanario:pendingRef", refCode.trim().toLowerCase());
          }
        }
      } catch (e) {
        if (__DEV__) console.log("[referral] getInitialURL error:", e);
      }
    })();

    // ── Also listen for links while app is already open ───────────────────────
    const linkingSub = Linking.addEventListener("url", ({ url }) => {
      try {
        const parsed = Linking.parse(url);
        const refCode = parsed.queryParams?.ref ?? parsed.path?.replace(/^ref\/?/, "") ?? null;
        if (refCode && typeof refCode === "string" && refCode.trim()) {
          AsyncStorage.setItem("@mexicanario:pendingRef", refCode.trim().toLowerCase()).catch(() => {});
        }
      } catch {}
    });

    // Initialize RevenueCat SDK (no-op in Expo Go or if API key not set)
    initRevenueCat().catch((e) => { if (__DEV__) console.log("[RevenueCat] init error:", e); });

    // Initialize AdMob with UMP consent flow (required by Google Play policy)
    (async () => {
      try {
        // 1. Request consent status from Google UMP SDK
        const consentInfo = await AdsConsent.requestInfoUpdate();

        // 2. Show consent form if required (GDPR, LGPD, etc.)
        if (
          consentInfo.isConsentFormAvailable &&
          (consentInfo.status === AdsConsentStatus.REQUIRED ||
            consentInfo.status === AdsConsentStatus.UNKNOWN)
        ) {
          await AdsConsent.showForm();
        }

        // 3. Initialize AdMob after consent is resolved
        await mobileAds().initialize();
      } catch {
        // Native module not registered (Expo Go) or consent error — initialize anyway
        try { await mobileAds().initialize(); } catch {}
      }
    })();

    // Run the database fix silently in the background
    autoFixDatabase().catch((e) => { if (__DEV__) console.log("Auto-fix skipped or failed:", e); });

    // Configure how notifications are displayed while the app is open
    setupNotificationHandler();

    // ── Preload ALL sounds immediately on app start ────────────────────────────
    preloadSounds().then(() => {
      soundsLoaded.current = true;
      playBGM("menu");
    }).catch(() => { });

    // ── AppState listener — unload/reload sounds on background/foreground ──────
    // ExoPlayer (used by expo-av on Android) MUST be released from the main thread.
    // If the Activity is destroyed before we clean up, AVManager.onHostDestroy()
    // is called from a pool thread causing a crash. Proactively releasing from JS
    // (which coordinates with the correct thread) prevents this.
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current === "active" &&
        (nextState === "background" || nextState === "inactive")
      ) {
        // App going to background — release ExoPlayer resources from the JS side
        // so the native module finds nothing to release on its background thread.
        unloadSounds().catch(() => {});
        soundsLoaded.current = false;
      } else if (
        (appState.current === "background" || appState.current === "inactive") &&
        nextState === "active"
      ) {
        // App coming back to foreground — reload sounds
        preloadSounds().then(() => {
          soundsLoaded.current = true;
          playBGM("menu");
        }).catch(() => {});
      }
      appState.current = nextState;
    });

    return () => {
      linkingSub.remove();
      subscription.remove();
      unloadSounds().catch(() => {});
    };
  }, []);

  // ── RevenueCat customerInfo listener ─────────────────────────────────────────
  // Fires on subscription renewals, lapses, and restoration — keeps Convex in sync
  // without requiring the user to re-open the app.
  useEffect(() => {
    if (!userId) return;
    const unsub = addCustomerInfoListener(({ active, expiresAt }) => {
      // Sync Plus status to Convex backend
      syncMexPlus({ userId, expiresAt: active ? (expiresAt ?? undefined) : 0 })
        .catch(() => {});
      // Cache Plus status locally so AdBanner can hide ads without a network call
      AsyncStorage.setItem("@mexicanario:mexPlusActive", active ? "1" : "0").catch(() => {});
    });
    return unsub;
  }, [userId]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <Text style={{ fontSize: 20, marginBottom: 20, color: "#333", fontWeight: "bold" }}>
          Error de conexión
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 30, color: "#666", textAlign: "center", paddingHorizontal: 20 }}>
          No pudimos conectar con los servidores. Por favor verifica tu internet.
        </Text>
        <View style={{ backgroundColor: "#F59B40", paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 }}>
          <Text
            style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
            onPress={retry}
          >
            Reintentar
          </Text>
        </View>
      </View>
    );
  }

  const linking = {
    prefixes: ["mexicanario://"],
    config: {
      screens: {
        Main: "main",
        Gameplay: {
          path: "challenge",
          parse: { reviewLevel: (v) => parseInt(v, 10) },
          stringify: { reviewLevel: (v) => String(v) },
        },
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Gameplay"
            component={GameplayScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="Map" component={MapScreen} options={{ gestureEnabled: false }} />
        </>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ConvexProvider>
  );
}
