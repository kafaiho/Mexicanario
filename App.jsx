import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, LogBox, Platform, Pressable, Text, View } from "react-native";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SystemBars } from "react-native-edge-to-edge";
import mobileAds, { AdsConsent, AdsConsentStatus } from "react-native-google-mobile-ads";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "./convex/_generated/api";
import config from "./convex/config";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { setupNotificationHandler } from "./src/services/notificationService";
import { addCustomerInfoListener, identifyRevenueCatUser, initRevenueCat } from "./src/services/RevenueCatService";
import { useUserAction } from "./src/hooks/useUserMutation";

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go",
]);

const MAX_APP_WIDTH = 430;

// Import screens
import Apoyar from "./src/components/Apoyar";
import Calificar from "./src/components/Calificar";
import DailyRewardModal, { useDailyReward } from "./src/components/DailyRewardModal";
import DisconnectModal from "./src/components/DisconnectModal";
import ForceUpdateModal from "./src/components/ForceUpdateModal";
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
import EsquivaChanclaScreen from "./src/screens/EsquivaChanclaScreen";
import GameplayScreen from "./src/screens/GameplayScreen";
import JuegosScreen from "./src/screens/JuegosScreen";
import LeaderboardScreen from "./src/screens/LeaderboardScreen";
import LoadingScreen from "./src/screens/LoadingScreen";
import LoteriaExpressScreen from "./src/screens/LoteriaExpressScreen";
import MainMenuScreen from "./src/screens/MainMenuScreen";
import MapScreen from "./src/screens/MapScreen";
import MascotaScreen from "./src/screens/MascotaScreen";
import { ShopProvider, useShop } from "./src/context/ShopContext";
import useShopSignals from "./src/hooks/useShopSignals";
import useEquipSkin from "./src/hooks/useEquipSkin";
import usePetStore from "./src/store/usePetStore";
import TaqueroRushScreen from "./src/screens/TaqueroRushScreen";
import PvPScreen from "./src/screens/PvPScreen";
import { HAPTICS_PREF_KEY, setHapticsEnabled, tapLight } from "./src/services/haptics";
import TabBarIcon, { TAB_ICONS } from "./src/components/TabBarIcon";
import { playBGM, playSound, preloadSounds, setMusicEnabled, setSoundEnabled, unloadSounds } from "./src/utils/soundManager";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const EmptyComponent = () => null;

/** Tab button with 60 FPS Reanimated spring bounce + haptic + click sound */
const JuicyTabButton = React.memo(function JuicyTabButton({ children, onPress, accessibilityState, style, ...rest }) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.85, { duration: 60 });
    tapLight();
    playSound("click");
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 4, stiffness: 280 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityState={accessibilityState}
      style={[{ flex: 1, alignItems: "center", justifyContent: "center" }, style]}
      {...rest}
    >
      <Reanimated.View style={[{ alignItems: "center", justifyContent: "center" }, animStyle]}>
        {children}
      </Reanimated.View>
    </Pressable>
  );
});

function MainTabs({ navigation }) {
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState(false);
  const [showHvhu, setShowHvhu] = useState(false);
  const { openShop } = useShop();
  const shopSignals = useShopSignals();
  const equipSkin = useEquipSkin();
  useEffect(() => {
    if (!shopSignals) return;
    const local = usePetStore.getState().activeSkin;
    const remote = shopSignals.activePetSkin;
    if (remote) { if (remote !== local) usePetStore.getState().setActiveSkin(remote); }
    else if (local) equipSkin(local); // cuentas de antes: guardar en la cuenta el traje que ya traía
  }, [shopSignals?.activePetSkin]); // eslint-disable-line react-hooks/exhaustive-deps
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

  // ── Premio diario unificado (vista previa; lo paga la racha al jugar) ──────
  const { shouldShow: showDailyReward, status: dailyRewardStatus, dismiss: dismissDailyReward } = useDailyReward();

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarShowLabel: false, // el nombre lo dibuja TabBarIcon
          tabBarAccessibilityLabel: TAB_ICONS[route.name]?.label,
          tabBarButton: (props) => <JuicyTabButton {...props} />,
          tabBarStyle: {
            height: Platform.OS === "ios" ? 90 : 68 + insets.bottom,
            paddingBottom: Platform.OS === "ios" ? 26 : 8 + insets.bottom,
            paddingTop: 8,
            backgroundColor: "#F1DDBE",
            borderTopWidth: 0,
            elevation: 12,
            shadowColor: "#5C2800",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.14,
            shadowRadius: 8,
          },
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              routeName={route.name}
              focused={focused}
              // Globo de la tienda: solo si hay monedas gratis o el regalo Plus del mes
              badge={route.name === "Shop" && !!shopSignals?.hasSomethingToClaim}
            />
          ),
          headerShown: false,
          // Pestañas ocultas no re-renderizan (p. ej. updates de Convex en Liga)
          freezeOnBlur: true,
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
              openShop();
            },
          }}
        />

        {/* Minigames - Hidden from TabBar but inside the Tab Navigator for bottom bar visibility */}
        <Tab.Screen
          name="EsquivaChancla"
          component={EsquivaChanclaScreen}
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
        />
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

      {/* Premio de hoy — vista previa al abrir la app si aún no has jugado hoy.
          Se cobra al acertar la primera palabra (recordDailyPlay). */}
      <DailyRewardModal
        visible={showDailyReward}
        status={dailyRewardStatus}
        onPlay={() => { dismissDailyReward(); navigation.navigate("Gameplay"); }}
        onDismiss={dismissDailyReward}
      />
    </>
  );
}

const convex = new ConvexReactClient(config.deploymentUrl);

// Versión actual del build (debe coincidir con app.json versionCode)
const CURRENT_ANDROID_VERSION_CODE = Constants.expoConfig?.android?.versionCode ?? 11;
const CURRENT_IOS_VERSION = Constants.expoConfig?.version ?? "1.2.3";

// ── RemoteConfig fetcher — aislado en Error Boundary para no crashear la app ─
function RemoteConfigFetcher({ onConfig }) {
  const cfg = useQuery(api.appConfig.getAppConfig);
  useEffect(() => { if (cfg !== undefined) onConfig(cfg); }, [cfg]);
  return null;
}

class RemoteConfigBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return null; // falla silenciosa — app funciona sin chequeo
    return this.props.children;
  }
}

function AppContent() {
  const { isAuthenticated, loading, error, retry, userId } = useAuth();
  const verifyMexPlus = useUserAction(api.shop.verifyMexPlusEntitlement);
  const appState = useRef(AppState.currentState);
  const soundsLoaded = useRef(false);

  // ── Verificación de versión remota ────────────────────────────────────────
  const [remoteConfig, setRemoteConfig] = useState(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  const needsUpdate = remoteConfig && (() => {
    if (Platform.OS === "android") {
      return CURRENT_ANDROID_VERSION_CODE < remoteConfig.minAndroidVersionCode;
    }
    // iOS: comparación simple de versión semántica
    const toNum = (v) => v.split(".").map(Number).reduce((acc, n, i) => acc + n * Math.pow(1000, 2 - i), 0);
    return toNum(CURRENT_IOS_VERSION) < toNum(remoteConfig.minIosVersion);
  })();

  const showUpdateModal = needsUpdate && !updateDismissed;
  const forceUpdate = needsUpdate && !!remoteConfig?.forceUpdate;

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
          AsyncStorage.setItem("@mexicanario:pendingRef", refCode.trim().toLowerCase()).catch(() => { });
        }
      } catch { }
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
        try { await mobileAds().initialize(); } catch { }
      }
    })();

    // Configure how notifications are displayed while the app is open
    setupNotificationHandler();

    // ── Preload ALL sounds immediately on app start ────────────────────────────
    preloadSounds().then(() => {
      soundsLoaded.current = true;
      // Load saved sound preferences before deciding to play music
      AsyncStorage.multiGet(["pref_music", "pref_sound", HAPTICS_PREF_KEY]).then((pairs) => {
        let savedMusicOn = true;
        pairs.forEach(([key, val]) => {
          if (val === null) return;
          const bool = val === "true";
          if (key === "pref_music") {
            savedMusicOn = bool;
            setMusicEnabled(bool); // sets the internal var in soundManager
          }
          if (key === "pref_sound") setSoundEnabled(bool);
          if (key === HAPTICS_PREF_KEY) setHapticsEnabled(bool);
        });

        // Only explicitly call playBGM if user had music enabled
        if (savedMusicOn) {
          playBGM("menu");
        }
      });
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
        unloadSounds().catch(() => { });
        soundsLoaded.current = false;
      } else if (
        (appState.current === "background" || appState.current === "inactive") &&
        nextState === "active"
      ) {
        // App coming back to foreground — reload sounds
        preloadSounds().then(() => {
          soundsLoaded.current = true;
          // Re-check preference just in case
          AsyncStorage.getItem("pref_music").then((val) => {
            if (val === null || val === "true") {
              playBGM("menu");
            }
          });
        }).catch(() => { });
      }
      appState.current = nextState;
    });

    return () => {
      linkingSub.remove();
      subscription.remove();
      unloadSounds().catch(() => { });
    };
  }, []);

  // ── RevenueCat customerInfo listener ─────────────────────────────────────────
  // Fires on subscription renewals, lapses, and restoration — keeps Convex in sync
  // without requiring the user to re-open the app.
  useEffect(() => {
    if (!userId) return;
    // RevenueCat app user id = Convex userId, so the backend can verify purchases.
    identifyRevenueCatUser(userId);
    const unsub = addCustomerInfoListener(({ active }) => {
      // The backend re-reads the entitlement from RevenueCat (never trusts the client)
      verifyMexPlus({ userId }).catch(() => { });
      // Cache Plus status locally so AdBanner can hide ads without a network call
      AsyncStorage.setItem("@mexicanario:mexPlusActive", active ? "1" : "0").catch(() => { });
    });
    return unsub;
  }, [userId, verifyMexPlus]);

  if (loading) {
    return <LoadingScreen authReady={false} />;
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
      <SystemBars hidden={true} style={{ statusBar: "light", navigationBar: "dark" }} />
      <RemoteConfigBoundary>
        <RemoteConfigFetcher onConfig={setRemoteConfig} />
      </RemoteConfigBoundary>
      <ForceUpdateModal
        visible={!!showUpdateModal}
        forceUpdate={forceUpdate}
        message={remoteConfig?.updateMessage}
        onDismiss={() => setUpdateDismissed(true)}
      />
      <ShopProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false, freezeOnBlur: true }}>
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Gameplay" component={GameplayScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="PvP" component={PvPScreen} />
        </>
      </Stack.Navigator>
      </ShopProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ConvexProvider client={convex}>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ConvexProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
