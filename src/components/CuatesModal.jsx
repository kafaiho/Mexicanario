import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { FONTS } from "../theme/designTokens";

const { width, height } = Dimensions.get("window");

const BROWN  = "#8B4513";
const AMBER  = "#D2691E";
const GOLD   = "#F8BE17";
const WHEAT  = "#FFE4B5";
const WHEAT2 = "#F5DEB3";
const RED    = "#C0392B";
const GREEN  = "#27AE60";

// Pantallas del flujo
const S_LOADING  = "loading";
const S_AUTH     = "auth";      // no tiene email → registro / login
const S_REWARD   = "reward";    // pantalla de recompensa post-registro
const S_USERNAME = "username";  // tiene email pero no username
const S_HOME     = "home";      // listo

const INVITE_MSG =
  "¡Ey cuate! Te invito a jugar Mexicanario, el juego para aprender el español de México. " +
  "¡Está de pelos, descárgalo ya! 🌮🇲🇽";

export default function CuatesModal({ visible, onClose }) {
  const { userId, user, restoreAccount } = useAuth();

  // Tabs de autenticación
  const [authTab,  setAuthTab]  = useState("login");  // "login" | "register"

  // Campos de formulario
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [username,  setUsername]  = useState("");

  // Búsqueda
  const [searchInput,     setSearchInput]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Tab del home
  const [homeTab, setHomeTab] = useState("invite"); // "invite" | "search"

  // Recompensa de registro
  const [reward, setReward] = useState(null); // { coins, diamonds }

  const [busy, setBusy] = useState(false);

  // ── Mutaciones Convex ───────────────────────────────────────────────────────
  const registerAccount = useMutation(api.friends.registerAccount);
  const loginWithEmail  = useMutation(api.friends.loginWithEmail);
  const setUsernameM    = useMutation(api.friends.setUsername);

  // ── Queries reactivas ───────────────────────────────────────────────────────
  const checkUsername = useQuery(
    api.friends.checkUsername,
    username.length >= 3 ? { username } : "skip"
  );

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  const searchResults = useQuery(
    api.friends.searchUsers,
    debouncedSearch.length >= 2
      ? { query: debouncedSearch, excludeUserId: userId ?? undefined }
      : "skip"
  );

  // ── Limpiar formularios al cerrar ──────────────────────────────────────────
  function handleClose() {
    setEmail("");
    setPassword("");
    setUsername("");
    setSearchInput("");
    setDebouncedSearch("");
    setAuthTab("login");
    setHomeTab("invite");
    setReward(null);
    onClose();
  }

  // ── Determinar pantalla activa ─────────────────────────────────────────────
  let screen = S_LOADING;
  if (reward) {
    screen = S_REWARD;
  } else if (user !== undefined) {
    if (!user?.email) {
      screen = S_AUTH;
    } else if (!user?.username) {
      screen = S_USERNAME;
    } else {
      screen = S_HOME;
    }
  }

  // ── Acciones ───────────────────────────────────────────────────────────────
  async function handleRegister() {
    const trimEmail    = email.trim();
    const trimUsername = username.trim();
    if (!trimEmail || !password || !trimUsername) {
      Alert.alert("¡Falta algo!", "Llena todos los campos, cuate. 🌮");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Contraseña muy corta", "Mínimo 6 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const res = await registerAccount({ userId, email: trimEmail, password, username: trimUsername });
      if (res?.coinsAdded > 0 || res?.diamondsAdded > 0) {
        setReward({ coins: res.coinsAdded, diamonds: res.diamondsAdded });
      }
    } catch (e) {
      Alert.alert("¡Aguas!", e.message ?? "No se pudo crear la cuenta.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin() {
    const trimEmail = email.trim();
    if (!trimEmail || !password) {
      Alert.alert("¡Falta algo!", "Escribe tu correo y contraseña.");
      return;
    }
    setBusy(true);
    try {
      const res = await loginWithEmail({ email: trimEmail, password });
      await restoreAccount(res.userId);
      setEmail("");
      setPassword("");
    } catch (e) {
      Alert.alert("¡Aguas!", e.message ?? "No se pudo entrar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetUsername() {
    if (!username.trim()) return;
    if (!checkUsername?.available) return;
    setBusy(true);
    try {
      await setUsernameM({ userId, username: username.trim() });
      setUsername("");
    } catch (e) {
      Alert.alert("¡Aguas!", e.message ?? "Error al guardar el nombre.");
    } finally {
      setBusy(false);
    }
  }

  async function handleInvite() {
    try {
      await Share.share({ message: INVITE_MSG, title: "¡Juega Mexicanario!" });
    } catch {
      // usuario canceló
    }
  }

  // ── Helpers UI ─────────────────────────────────────────────────────────────
  const usernameHintColor =
    username.length >= 3 && checkUsername !== undefined
      ? checkUsername.available ? GREEN : RED
      : AMBER;

  const usernameHintText =
    username.length >= 3 && checkUsername !== undefined
      ? checkUsername.available ? "✓ ¡Ese nombre está libre!" : "✗ Ya lo tiene otro cuate"
      : username.length >= 3 ? "Verificando..." : "";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={s.overlay}>
        <View style={s.card}>
          {/* ── Header ── */}
          <View style={s.header}>
            <Text style={s.headerEmoji}>🤝</Text>
            <Text style={s.headerTitle}>Cuates</Text>
            <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Loading ── */}
          {screen === S_LOADING && (
            <View style={s.centered}>
              <ActivityIndicator color={AMBER} size="large" />
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PANTALLA: RECOMPENSA  (primera vez que se registra)
          ════════════════════════════════════════════════════════════════════ */}
          {screen === S_REWARD && reward && (
            <View style={s.rewardWrap}>
              <Text style={s.rewardFirework}>🎉</Text>
              <Text style={s.rewardTitle}>¡Bienvenido, cuate!</Text>
              <Text style={s.rewardSub}>Por registrarte te ganaste:</Text>
              <View style={s.rewardRow}>
                <View style={s.rewardItem}>
                  <Text style={s.rewardEmoji}>🪙</Text>
                  <Text style={s.rewardAmount}>+{reward.coins}</Text>
                  <Text style={s.rewardLabel}>Varos</Text>
                </View>
                <View style={s.rewardDivider} />
                <View style={s.rewardItem}>
                  <Text style={s.rewardEmoji}>💎</Text>
                  <Text style={s.rewardAmount}>+{reward.diamonds}</Text>
                  <Text style={s.rewardLabel}>Diamantes</Text>
                </View>
              </View>
              <Text style={s.rewardMsg}>
                ¡Están en tu cuenta, ve a jugar y gana más! 🌶️
              </Text>
              <TouchableOpacity
                style={s.rewardBtn}
                onPress={() => setReward(null)}
              >
                <Text style={s.rewardBtnText}>¡A jugar, órale! 🌮</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PANTALLA: AUTH  (no tiene correo registrado)
          ════════════════════════════════════════════════════════════════════ */}
          {screen === S_AUTH && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.subtitle}>
                Para buscar y agregar cuates necesitas una cuenta.
              </Text>

              {/* Tabs login / registro */}
              <View style={s.tabRow}>
                <TouchableOpacity
                  style={[s.tabBtn, authTab === "login" && s.tabActive]}
                  onPress={() => { setAuthTab("login"); setEmail(""); setPassword(""); setUsername(""); }}
                >
                  <Text style={[s.tabText, authTab === "login" && s.tabTextActive]}>Entrar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tabBtn, authTab === "register" && s.tabActive]}
                  onPress={() => { setAuthTab("register"); setEmail(""); setPassword(""); setUsername(""); }}
                >
                  <Text style={[s.tabText, authTab === "register" && s.tabTextActive]}>Crear cuenta</Text>
                </TouchableOpacity>
              </View>

              {authTab === "login" ? (
                <>
                  <TextInput
                    style={s.input}
                    placeholder="Correo electrónico"
                    placeholderTextColor="#A0714F"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                  <TextInput
                    style={s.input}
                    placeholder="Contraseña"
                    placeholderTextColor="#A0714F"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity style={s.actionBtn} onPress={handleLogin} disabled={busy}>
                    {busy
                      ? <ActivityIndicator color={BROWN} />
                      : <Text style={s.actionBtnText}>Entrar 🌮</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAuthTab("register")} style={s.switchLink}>
                    <Text style={s.switchLinkText}>¿No tienes cuenta? Créala aquí</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput
                    style={s.input}
                    placeholder="Correo electrónico"
                    placeholderTextColor="#A0714F"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                  <TextInput
                    style={s.input}
                    placeholder="Contraseña (mín. 6 caracteres)"
                    placeholderTextColor="#A0714F"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TextInput
                    style={s.input}
                    placeholder="Nombre de cuate (ej: chalupa_mx)"
                    placeholderTextColor="#A0714F"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={setUsername}
                    maxLength={20}
                  />
                  {usernameHintText ? (
                    <Text style={[s.hint, { color: usernameHintColor }]}>{usernameHintText}</Text>
                  ) : null}
                  <Text style={s.rulesText}>Solo letras, números y _ · 3 a 20 caracteres</Text>
                  <TouchableOpacity
                    style={[s.actionBtn, (busy || (username.length >= 3 && checkUsername !== undefined && !checkUsername.available)) && { opacity: 0.6 }]}
                    onPress={handleRegister}
                    disabled={busy}
                  >
                    {busy
                      ? <ActivityIndicator color={BROWN} />
                      : <Text style={s.actionBtnText}>Crear cuenta ✅</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAuthTab("login")} style={s.switchLink}>
                    <Text style={s.switchLinkText}>¿Ya tienes cuenta? Entra aquí</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PANTALLA: ELEGIR USERNAME
          ════════════════════════════════════════════════════════════════════ */}
          {screen === S_USERNAME && (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.bigEmoji}>🏷️</Text>
              <Text style={s.subtitle}>¡Elige tu nombre de cuate!</Text>
              <Text style={s.rulesText}>
                Este nombre es único — así te van a buscar tus amigos.{"\n"}
                Solo letras, números y _ · 3 a 20 caracteres.
              </Text>
              <TextInput
                style={s.input}
                placeholder="ej: xochitl_mx"
                placeholderTextColor="#A0714F"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
                maxLength={20}
              />
              {usernameHintText ? (
                <Text style={[s.hint, { color: usernameHintColor }]}>{usernameHintText}</Text>
              ) : null}
              <TouchableOpacity
                style={[s.actionBtn, (!checkUsername?.available || busy) && { opacity: 0.5 }]}
                onPress={handleSetUsername}
                disabled={busy || !checkUsername?.available}
              >
                {busy
                  ? <ActivityIndicator color={BROWN} />
                  : <Text style={s.actionBtnText}>¡Ese soy yo! 🎉</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PANTALLA: HOME — Invitar / Buscar
          ════════════════════════════════════════════════════════════════════ */}
          {screen === S_HOME && (
            <View style={{ flex: 1 }}>
              {/* Mi nombre */}
              <View style={s.myPill}>
                <Text style={s.myPillLabel}>Tu nombre:</Text>
                <Text style={s.myPillValue}>@{user?.username}</Text>
              </View>

              {/* Tabs Invitar / Buscar */}
              <View style={s.tabRow}>
                <TouchableOpacity
                  style={[s.tabBtn, homeTab === "invite" && s.tabActive]}
                  onPress={() => setHomeTab("invite")}
                >
                  <Text style={[s.tabText, homeTab === "invite" && s.tabTextActive]}>📤 Invitar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tabBtn, homeTab === "search" && s.tabActive]}
                  onPress={() => setHomeTab("search")}
                >
                  <Text style={[s.tabText, homeTab === "search" && s.tabTextActive]}>🔍 Buscar</Text>
                </TouchableOpacity>
              </View>

              {/* ── Tab: Invitar ── */}
              {homeTab === "invite" && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={s.inviteBox}>
                    <Text style={s.inviteQuote}>"{INVITE_MSG}"</Text>
                  </View>
                  <TouchableOpacity style={s.actionBtn} onPress={handleInvite}>
                    <Text style={s.actionBtnText}>Compartir con cuates 🌮</Text>
                  </TouchableOpacity>
                  <View style={s.appsRow}>
                    <Text style={s.appIcon}>💬</Text>
                    <Text style={s.appIcon}>📸</Text>
                    <Text style={s.appIcon}>🎵</Text>
                    <Text style={s.appIcon}>✉️</Text>
                    <Text style={s.appIcon}>📱</Text>
                  </View>
                  <Text style={s.appsHint}>
                    WhatsApp · Instagram · TikTok · Correo · Mensajes y más
                  </Text>
                </ScrollView>
              )}

              {/* ── Tab: Buscar ── */}
              {homeTab === "search" && (
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[s.input, { marginTop: 8 }]}
                    placeholder="Busca por nombre de usuario..."
                    placeholderTextColor="#A0714F"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={searchInput}
                    onChangeText={setSearchInput}
                  />
                  <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Loading */}
                    {searchResults === undefined && debouncedSearch.length >= 2 && (
                      <ActivityIndicator color={AMBER} style={{ marginTop: 20 }} />
                    )}
                    {/* Sin resultados */}
                    {searchResults !== undefined && searchResults.length === 0 && debouncedSearch.length >= 2 && (
                      <View style={s.emptyWrap}>
                        <Text style={s.emptyEmoji}>🤷</Text>
                        <Text style={s.emptyText}>No encontramos a ese cuate.</Text>
                        <Text style={s.emptyHint}>Verifica el nombre o invítalo a que se una.</Text>
                      </View>
                    )}
                    {/* Pista inicial */}
                    {debouncedSearch.length < 2 && (
                      <View style={s.emptyWrap}>
                        <Text style={s.emptyEmoji}>🕵️</Text>
                        <Text style={s.emptyText}>Escribe al menos 2 letras</Text>
                      </View>
                    )}
                    {/* Resultados */}
                    {searchResults?.map((u) => (
                      <View key={String(u.userId)} style={s.resultRow}>
                        <View style={s.resultAvatar}>
                          <Text style={s.resultAvatarText}>
                            {u.avatar === "default" || !u.avatar ? "🌮" : u.avatar}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.resultUsername}>@{u.username}</Text>
                          <Text style={s.resultName}>{u.name}</Text>
                        </View>
                        <View style={s.foundBadge}>
                          <Text style={s.foundBadgeText}>🎉 Encontrado</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const CARD_W = Math.min(width * 0.92, 440);

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.04,
  },
  card: {
    width: CARD_W,
    maxHeight: height * 0.82,
    backgroundColor: WHEAT,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: BROWN,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 14,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  headerEmoji: { fontSize: width * 0.07 },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.display,
    fontSize: width * 0.055,
    color: BROWN,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e64a33",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#fff",
    fontFamily: FONTS.bodyBold,
    fontSize: 17,
    lineHeight: 20,
  },

  centered: {
    paddingVertical: 40,
    alignItems: "center",
  },

  // Texto general
  subtitle: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: width * 0.038,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: width * 0.054,
  },
  rulesText: {
    fontFamily: FONTS.body,
    color: "#A0714F",
    fontSize: width * 0.029,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: width * 0.042,
  },
  hint: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.032,
    textAlign: "center",
    marginBottom: 6,
  },
  bigEmoji: {
    fontSize: width * 0.13,
    textAlign: "center",
    marginBottom: 8,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: WHEAT2,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.25)",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: GOLD,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.033,
    color: "#A0714F",
  },
  tabTextActive: {
    color: BROWN,
  },

  // Inputs
  input: {
    backgroundColor: WHEAT2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.35)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FONTS.body,
    fontSize: width * 0.037,
    color: BROWN,
    marginBottom: 10,
  },

  // Botón principal
  actionBtn: {
    backgroundColor: GOLD,
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C8950A",
    marginBottom: 8,
    marginTop: 4,
  },
  actionBtnText: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: width * 0.042,
  },

  // Link para cambiar entre login/registro
  switchLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLinkText: {
    fontFamily: FONTS.body,
    color: AMBER,
    fontSize: width * 0.033,
    textDecorationLine: "underline",
  },

  // ── Recompensa de registro ────────────────────────────────────────────────
  rewardWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  rewardFirework: {
    fontSize: width * 0.22,
    textAlign: "center",
    marginBottom: 4,
  },
  rewardTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.065,
    color: BROWN,
    textAlign: "center",
    marginBottom: 4,
  },
  rewardSub: {
    fontFamily: FONTS.body,
    color: AMBER,
    fontSize: width * 0.038,
    textAlign: "center",
    marginBottom: 16,
  },
  rewardRow: {
    flexDirection: "row",
    backgroundColor: WHEAT2,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: AMBER,
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 24,
    marginBottom: 14,
    alignItems: "center",
  },
  rewardItem:   { alignItems: "center", gap: 4 },
  rewardEmoji:  { fontSize: width * 0.11 },
  rewardAmount: {
    fontFamily: FONTS.display,
    fontSize: width * 0.08,
    color: BROWN,
    lineHeight: width * 0.09,
  },
  rewardLabel: {
    fontFamily: FONTS.body,
    color: "#A0714F",
    fontSize: width * 0.03,
  },
  rewardDivider: {
    width: 1.5,
    height: 60,
    backgroundColor: "rgba(139,69,19,0.2)",
  },
  rewardMsg: {
    fontFamily: FONTS.bodyBold,
    color: AMBER,
    fontSize: width * 0.036,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: width * 0.05,
  },
  rewardBtn: {
    backgroundColor: GOLD,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: "#C8950A",
    width: "100%",
    alignItems: "center",
  },
  rewardBtnText: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: width * 0.046,
  },

  // Mi nombre pill
  myPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHEAT2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "center",
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.3)",
    gap: 4,
  },
  myPillLabel: {
    fontFamily: FONTS.body,
    color: "#A0714F",
    fontSize: width * 0.033,
  },
  myPillValue: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: width * 0.036,
  },

  // Sección Invitar
  inviteBox: {
    backgroundColor: WHEAT2,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.25)",
    padding: 14,
    marginBottom: 14,
  },
  inviteQuote: {
    fontFamily: FONTS.body,
    color: BROWN,
    fontSize: width * 0.032,
    lineHeight: width * 0.046,
    fontStyle: "italic",
    textAlign: "center",
  },
  appsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  appIcon: { fontSize: width * 0.07 },
  appsHint: {
    fontFamily: FONTS.body,
    color: "#A0714F",
    fontSize: width * 0.029,
    textAlign: "center",
    marginBottom: 8,
  },

  // Búsqueda — sin resultados
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyEmoji: { fontSize: width * 0.09, marginBottom: 6 },
  emptyText: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: width * 0.035,
    textAlign: "center",
  },
  emptyHint: {
    fontFamily: FONTS.body,
    color: "#A0714F",
    fontSize: width * 0.03,
    textAlign: "center",
    marginTop: 4,
  },

  // Búsqueda — fila de resultado
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHEAT2,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.2)",
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  resultAvatar: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    backgroundColor: WHEAT,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultAvatarText: { fontSize: width * 0.055 },
  resultUsername: {
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: width * 0.036,
  },
  resultName: {
    fontFamily: FONTS.body,
    color: "#A0714F",
    fontSize: width * 0.028,
    marginTop: 1,
  },
  foundBadge: {
    backgroundColor: GREEN + "22",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GREEN + "55",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  foundBadgeText: {
    fontFamily: FONTS.bodyBold,
    color: GREEN,
    fontSize: width * 0.026,
  },
});
