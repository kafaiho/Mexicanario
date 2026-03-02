import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Animated, Image, Platform, Pressable, Text, View } from "react-native";
import config from "./convex/config";
import { api } from "./convex/_generated/api";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { initRevenueCat } from "./src/services/RevenueCatService";
import { setupNotificationHandler } from "./src/services/notificationService";

// Import screens
import Apoyar from "./src/components/Apoyar";
import Calificar from "./src/components/Calificar";
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
import LeaderboardScreen from "./src/screens/LeaderboardScreen";
import MascotaScreen from "./src/screens/MascotaScreen";
import GameplayScreen from "./src/screens/GameplayScreen";
import JuegosScreen from "./src/screens/JuegosScreen";
import LoadingScreen from "./src/screens/LoadingScreen";
import MainMenuScreen from "./src/screens/MainMenuScreen";
import ShopScreen from "./src/screens/ShopScreen";
import DueloAlburesScreen from "./src/screens/DueloAlburesScreen";
import CorreNahualScreen from "./src/screens/CorreNahualScreen";
import TaqueroRushScreen from "./src/screens/TaqueroRushScreen";
import LoteriaExpressScreen from "./src/screens/LoteriaExpressScreen";
import MapScreen from "./src/screens/MapScreen";
import JuicyButton from "./src/components/JuicyButton";
import { tapLight } from "./src/services/haptics";
import { playSound } from "./src/utils/soundManager";

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
          console.log("close");
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
    </>
  );
}

const convex = new ConvexReactClient(config.deploymentUrl);

function AppContent() {
  const { isAuthenticated, loading, error, retry } = useAuth();
  const autoFixDatabase = useMutation(api.patchCategories.autoFixDatabase);

  useEffect(() => {
    // Initialize RevenueCat SDK (no-op in Expo Go or if API key not set)
    initRevenueCat().catch((e) => console.log("[RevenueCat] init error:", e));

    // Run the database fix silently in the background
    autoFixDatabase().catch((e) => console.log("Auto-fix skipped or failed:", e));

    // Configure how notifications are displayed while the app is open
    setupNotificationHandler();
  }, []);

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

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Gameplay" component={GameplayScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
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
