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

const BROWN = "#8B4513";
const AMBER = "#D2691E";
const GOLD = "#F8BE17";
const WHEAT = "#FFE4B5";
const WHEAT2 = "#F5DEB3";
const GREEN = "#27AE60";
const RED = "#C0392B";

export default function FriendsModal({ visible, onClose, onOpenProfile }) {
  const { userId, user } = useAuth();
  const [tab, setTab] = useState("list");  // "list" | "add" | "rank"

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Perfil Seleccionado
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  // Username setup (para usuarios de Google/Apple sin username)
  const [usernameInput, setUsernameInput] = useState("");
  const [busyUsername, setBusyUsername] = useState(false);

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 420);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Queries
  const myFriends = useQuery(
    api.friends.getMyFriends,
    userId ? { userId } : "skip"
  );
  const searchResults = useQuery(
    api.friends.searchUsers,
    debouncedSearch.length >= 2
      ? { query: debouncedSearch, excludeUserId: userId ?? undefined }
      : "skip"
  );
  const checkUsername = useQuery(
    api.friends.checkUsername,
    usernameInput.length >= 3 ? { username: usernameInput } : "skip"
  );

  // Leaderboard de cuates
  const friendsLeaderboard = useQuery(
    api.friends.getFriendsLeaderboard,
    userId ? { userId } : "skip"
  );

  // Perfil de un usuario específico
  const selectedProfile = useQuery(
    api.friends.getUserProfile,
    selectedProfileId ? { targetId: selectedProfileId } : "skip"
  );

  // Mutations
  const addFriend = useMutation(api.friends.addFriend);
  const removeFriend = useMutation(api.friends.removeFriend);
  const setUsernameMutation = useMutation(api.friends.setUsername);

  // IDs de cuates actuales para comparar rápido
  const friendIds = new Set((myFriends ?? []).map((f) => String(f.friendId)));

  // ¿Tiene cuenta vinculada (Google, Apple o email)?
  const isLinked = !!(user?.email || user?.googleId || user?.appleId);
  // ¿Necesita elegir username?
  const needsUsername = isLinked && !user?.username;

  async function handleSetUsername() {
    if (!usernameInput.trim() || !checkUsername?.available) return;
    setBusyUsername(true);
    try {
      await setUsernameMutation({ userId, username: usernameInput.trim() });
      setUsernameInput("");
    } catch (e) {
      Alert.alert("¡Aguas!", e.message ?? "Error al guardar el nombre.");
    } finally {
      setBusyUsername(false);
    }
  }

  const usernameHintColor =
    usernameInput.length >= 3 && checkUsername !== undefined
      ? checkUsername.available ? GREEN : RED
      : AMBER;
  const usernameHintText =
    usernameInput.length >= 3 && checkUsername !== undefined
      ? checkUsername.available ? "✓ ¡Ese nombre está libre!" : "✗ Ya lo tiene otro cuate"
      : "";

  async function handleAdd(friendId) {
    setBusyId(String(friendId));
    try {
      await addFriend({ userId, friendId });
    } catch (e) {
      Alert.alert("¡Aguas!", e.message ?? "No se pudo agregar");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(friendId, name) {
    Alert.alert(
      "¿Quitar cuate?",
      `¿Seguro que quieres quitar a ${name} de tus cuates?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, quitar",
          style: "destructive",
          onPress: async () => {
            setBusyId(String(friendId));
            try {
              await removeFriend({ userId, friendId });
            } catch { }
            finally { setBusyId(null); }
          },
        },
      ]
    );
  }

  function handleClose() {
    setSelectedProfileId(null);
    setSearchInput("");
    setDebouncedSearch("");
    setTab("list");
    onClose();
  }

  function handleBackFromProfile() {
    setSelectedProfileId(null);
  }

  async function handleShareInvite() {
    try {
      await Share.share({
        message:
          "¡Ey cuate! Te invito a jugar Mexicanario, el juego para aprender el español de México. " +
          "¡Está de pelos, descárgalo ya! 🌮🇲🇽",
      });
    } catch (error) {
      if (__DEV__) console.log(error);
    }
  }

  const avatarOf = (a) => (!a || a === "default" ? "🌮" : a);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerEmoji}>🤝</Text>
            <Text style={s.headerTitle}>Mis cuates</Text>
            <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Perfil de Competidor ── */}
          {selectedProfileId ? (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <TouchableOpacity style={s.backBtnRow} onPress={handleBackFromProfile}>
                <Text style={s.backBtnEmoji}>⬅️</Text>
                <Text style={s.backBtnText}>Volver</Text>
              </TouchableOpacity>

              {selectedProfile === undefined ? (
                <ActivityIndicator color={AMBER} style={{ marginTop: 40 }} size="large" />
              ) : selectedProfile === null ? (
                <Text style={s.emptyTitle}>Usuario no encontrado.</Text>
              ) : (
                <View style={s.profileContainer}>
                  <View style={s.profileAvatarWrap}>
                    <Text style={s.profileAvatarText}>{avatarOf(selectedProfile.avatar)}</Text>
                  </View>
                  <Text style={s.profileUsername}>@{selectedProfile.username || "cuate"}</Text>
                  <Text style={s.profileName}>{selectedProfile.name}</Text>

                  {/* Dinámicamente calcular Títulos/Medallas */}
                  <View style={s.badgesWrap}>
                    {selectedProfile.tacos >= 1000 && <Text style={s.badge}>🌮 Leyenda</Text>}
                    {selectedProfile.miniGames?.taquero >= 150 && <Text style={s.badge}>🔪 Taco Master</Text>}
                    {selectedProfile.miniGames?.nahual >= 2000 && <Text style={s.badge}>🐺 Nahual Volador</Text>}
                    {selectedProfile.leagueTrophies >= 1 && <Text style={s.badge}>🏆 Campeón</Text>}
                    {selectedProfile.playStreakMax >= 30 && <Text style={s.badge}>🔥 Racha Imparable</Text>}
                  </View>

                  <View style={s.statsGrid}>
                    <View style={s.statBox}>
                      <Text style={s.statValue}>{selectedProfile.tacos}</Text>
                      <Text style={s.statLabel}>Tacos</Text>
                    </View>
                    <View style={s.statBox}>
                      <Text style={s.statValue}>{selectedProfile.xp}</Text>
                      <Text style={s.statLabel}>Exp</Text>
                    </View>
                    <View style={s.statBox}>
                      <Text style={s.statValue}>{selectedProfile.playStreakMax}</Text>
                      <Text style={s.statLabel}>Racha Max</Text>
                    </View>
                    <View style={s.statBox}>
                      <Text style={s.statValue}>{selectedProfile.leagueTrophies}</Text>
                      <Text style={s.statLabel}>Trofeos</Text>
                    </View>
                  </View>

                  <Text style={s.metricsTitle}>Récords Mini-Juegos</Text>
                  <View style={s.miniGamesGrid}>
                    <View style={s.miniBox}>
                      <Text style={s.miniBoxEmoji}>🔪</Text>
                      <Text style={s.miniBoxScore}>{selectedProfile.miniGames?.taquero || 0}</Text>
                      <Text style={s.miniBoxLabel}>Taquero</Text>
                    </View>
                    <View style={s.miniBox}>
                      <Text style={s.miniBoxEmoji}>🐺</Text>
                      <Text style={s.miniBoxScore}>{selectedProfile.miniGames?.nahual || 0}</Text>
                      <Text style={s.miniBoxLabel}>Nahual</Text>
                    </View>
                    <View style={s.miniBox}>
                      <Text style={s.miniBoxEmoji}>🤬</Text>
                      <Text style={s.miniBoxScore}>{selectedProfile.miniGames?.albures || 0}</Text>
                      <Text style={s.miniBoxLabel}>Albures</Text>
                    </View>
                    <View style={s.miniBox}>
                      <Text style={s.miniBoxEmoji}>🎴</Text>
                      <Text style={s.miniBoxScore}>{selectedProfile.miniGames?.loteria || 0}</Text>
                      <Text style={s.miniBoxLabel}>Lotería</Text>
                    </View>
                  </View>

                  {/* Acciones */}
                  {selectedProfileId !== userId && (
                    <View style={s.profileActions}>
                      {friendIds.has(selectedProfileId) ? (
                        <TouchableOpacity
                          style={[s.actionBtnProfile, s.btnRemoveProfile]}
                          onPress={() => handleRemove(selectedProfileId, selectedProfile.name)}
                          disabled={busyId === selectedProfileId}
                        >
                          {busyId === selectedProfileId ? <ActivityIndicator color={RED} /> : <Text style={s.btnRemoveProfileText}>✕ Quitar de Cuates</Text>}
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[s.actionBtnProfile, s.btnAddProfile]}
                          onPress={() => handleAdd(selectedProfileId)}
                          disabled={busyId === selectedProfileId}
                        >
                          {busyId === selectedProfileId ? <ActivityIndicator color={BROWN} /> : <Text style={s.actionBtnText}>+ Agregar Cuate</Text>}
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          ) : needsUsername ? (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.setupEmoji}>🏷️</Text>
              <Text style={s.setupTitle}>¡Elige tu nombre de cuate!</Text>
              <Text style={s.setupHint}>
                Entraste con {user?.googleId ? "Google" : "Apple"}.{"\n"}
                Elige un nombre único para que tus amigos te encuentren.
              </Text>
              <TextInput
                style={s.input}
                placeholder="ej: xochitl_mx"
                placeholderTextColor="#A0714F"
                autoCapitalize="none"
                autoCorrect={false}
                value={usernameInput}
                onChangeText={setUsernameInput}
                maxLength={20}
              />
              {usernameHintText ? (
                <Text style={[s.usernameHint, { color: usernameHintColor }]}>
                  {usernameHintText}
                </Text>
              ) : null}
              <Text style={s.setupRules}>Solo letras, números y _ · 3 a 20 caracteres</Text>
              <TouchableOpacity
                style={[s.actionBtn, (!checkUsername?.available || busyUsername) && { opacity: 0.5 }]}
                onPress={handleSetUsername}
                disabled={busyUsername || !checkUsername?.available}
              >
                {busyUsername
                  ? <ActivityIndicator color={BROWN} />
                  : <Text style={s.actionBtnText}>¡Ese soy yo! 🎉</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <>
              {/* Nombre propio — tap abre ProfileScreen */}
              {user?.username && (
                <TouchableOpacity style={s.myPill} onPress={() => onOpenProfile?.()}>
                  <Text style={s.myPillLabel}>Tú:</Text>
                  <Text style={s.myPillValue}>@{user.username}</Text>
                </TouchableOpacity>
              )}

              {/* Tabs */}
              <View style={s.tabRow}>
                <TouchableOpacity
                  style={[s.tabBtn, tab === "list" && s.tabActive]}
                  onPress={() => setTab("list")}
                >
                  <Text style={[s.tabText, tab === "list" && s.tabTextActive]}>
                    👥 Cuates
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tabBtn, tab === "rank" && s.tabActive]}
                  onPress={() => setTab("rank")}
                >
                  <Text style={[s.tabText, tab === "rank" && s.tabTextActive]}>
                    🏆 Ranking
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tabBtn, tab === "add" && s.tabActive]}
                  onPress={() => setTab("add")}
                >
                  <Text style={[s.tabText, tab === "add" && s.tabTextActive]}>
                    ➕ Agregar
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Tab: lista de cuates ── */}
              {tab === "list" && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  {myFriends === undefined && (
                    <ActivityIndicator color={AMBER} style={{ marginTop: 24 }} />
                  )}
                  {myFriends?.length === 0 && (
                    <View style={s.emptyWrap}>
                      <Text style={s.emptyEmoji}>🌵</Text>
                      <Text style={s.emptyTitle}>Todavía no tienes cuates</Text>
                      <Text style={s.emptyHint}>
                        ¡Ve a "Agregar" y busca a tus amigos por su nombre!
                      </Text>
                      <TouchableOpacity
                        style={s.addFirstBtn}
                        onPress={() => setTab("add")}
                      >
                        <Text style={s.addFirstBtnText}>Buscar cuates ➕</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {myFriends?.map((f) => (
                    <View key={String(f.friendId)} style={s.friendRow}>
                      <View style={s.avatar}>
                        <Text style={s.avatarText}>{avatarOf(f.avatar)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        {f.username
                          ? <Text style={s.username}>@{f.username}</Text>
                          : null}
                        <Text style={s.name}>{f.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={s.removeBtn}
                        onPress={() => handleRemove(f.friendId, f.name)}
                        disabled={busyId === String(f.friendId)}
                      >
                        {busyId === String(f.friendId)
                          ? <ActivityIndicator color={RED} size="small" />
                          : <Text style={s.removeBtnText}>✕</Text>
                        }
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* ── Tab: ranking entre cuates ── */}
              {tab === "rank" && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  {friendsLeaderboard === undefined && (
                    <ActivityIndicator color={AMBER} style={{ marginTop: 24 }} />
                  )}
                  {friendsLeaderboard?.length === 0 && (
                    <View style={s.emptyWrap}>
                      <Text style={s.emptyEmoji}>🏆</Text>
                      <Text style={s.emptyTitle}>Sin cuates aún</Text>
                      <Text style={s.emptyHint}>Agrega amigos para ver el ranking.</Text>
                    </View>
                  )}
                  {(friendsLeaderboard ?? []).map((entry, i) => {
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
                    const fmtTacos = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
                    return (
                      <View
                        key={String(entry.userId)}
                        style={[
                          s.rankRow,
                          entry.isSelf && s.rankRowSelf,
                        ]}
                      >
                        <Text style={s.rankMedal}>{medal}</Text>
                        <Text style={s.rankAvatar}>{avatarOf(entry.avatar)}</Text>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedProfileId(entry.userId)}>
                          <Text style={s.rankName} numberOfLines={1}>
                            {entry.isSelf ? "Tú" : (entry.username ? `@${entry.username}` : (entry.name ?? "Jugador"))}
                          </Text>
                        </TouchableOpacity>
                        <View style={s.rankTacos}>
                          <Text style={s.rankTacosText}>🌮 {fmtTacos(entry.tacos)}</Text>
                        </View>
                      </View>
                    );
                  })}
                  <View style={{ height: 20 }} />
                </ScrollView>
              )}

              {/* ── Tab: buscar y agregar ── */}
              {tab === "add" && (
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={s.input}
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
                    {debouncedSearch.length < 2 && (
                      <View style={s.emptyWrap}>
                        <Text style={s.emptyEmoji}>🔍</Text>
                        <Text style={s.emptyTitle}>Escribe al menos 2 letras</Text>
                      </View>
                    )}
                    {searchResults === undefined && debouncedSearch.length >= 2 && (
                      <ActivityIndicator color={AMBER} style={{ marginTop: 20 }} />
                    )}
                    {searchResults?.length === 0 && debouncedSearch.length >= 2 && (
                      <View style={s.emptyWrap}>
                        <Text style={s.emptyEmoji}>🤷</Text>
                        <Text style={s.emptyTitle}>No encontramos a ese cuate</Text>
                        <Text style={s.emptyHint}>Verifica el nombre o invítalo a unirse.</Text>
                        <TouchableOpacity style={s.addFirstBtn} onPress={handleShareInvite}>
                          <Text style={s.addFirstBtnText}>Invitar a un amigo 📲</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {searchResults?.map((u) => {
                      const already = friendIds.has(String(u.userId));
                      const loading = busyId === String(u.userId);
                      return (
                        <View key={String(u.userId)} style={s.friendRow}>
                          <View style={s.avatar}>
                            <Text style={s.avatarText}>{avatarOf(u.avatar)}</Text>
                          </View>
                          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedProfileId(String(u.userId))}>
                            <Text style={s.username}>@{u.username}</Text>
                            <Text style={s.name}>{u.name}</Text>
                          </TouchableOpacity>
                          {already ? (
                            <View style={s.alreadyBadge}>
                              <Text style={s.alreadyText}>✓ Cuate</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={[s.addBtn, loading && { opacity: 0.6 }]}
                              onPress={() => handleAdd(u.userId)}
                              disabled={loading}
                            >
                              {loading
                                ? <ActivityIndicator color={BROWN} size="small" />
                                : <Text style={s.addBtnText}>+ Agregar</Text>
                              }
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

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
    height: height * 0.72,
    backgroundColor: WHEAT,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: BROWN,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  headerEmoji: { fontSize: width * 0.065 },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.display,
    fontSize: width * 0.052,
    color: BROWN,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e64a33",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#fff",
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    lineHeight: 19,
  },

  // Mi username
  myPill: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: WHEAT2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.3)",
    gap: 4,
  },
  myPillLabel: { fontFamily: FONTS.body, color: "#A0714F", fontSize: width * 0.03 },
  myPillValue: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: width * 0.033 },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: WHEAT2,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  tabText: { fontFamily: FONTS.bodyBold, fontSize: width * 0.031, color: "#A0714F" },
  tabTextActive: { color: BROWN },

  // Input
  input: {
    backgroundColor: WHEAT2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.35)",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: FONTS.body,
    fontSize: width * 0.036,
    color: BROWN,
    marginBottom: 10,
  },

  // Fila de amigo
  friendRow: {
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
  avatar: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    backgroundColor: WHEAT,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: width * 0.055 },
  username: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: width * 0.034 },
  name: { fontFamily: FONTS.body, color: "#A0714F", fontSize: width * 0.027, marginTop: 1 },

  // Botones acción
  addBtn: {
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: "#C8950A",
  },
  addBtnText: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: width * 0.028 },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: RED + "22",
    borderWidth: 1,
    borderColor: RED + "55",
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtnText: { color: RED, fontWeight: "900", fontSize: 14 },
  alreadyBadge: {
    backgroundColor: GREEN + "22",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: GREEN + "55",
  },
  alreadyText: { fontFamily: FONTS.bodyBold, color: GREEN, fontSize: width * 0.026 },

  // Ranking rows
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHEAT,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#C4A47A",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },
  rankRowSelf: {
    backgroundColor: "#FFF8E1",
    borderColor: AMBER,
    borderWidth: 2,
  },
  rankMedal: { fontSize: width * 0.045, minWidth: 30, textAlign: "center" },
  rankAvatar: { fontSize: width * 0.05 },
  rankName: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: width * 0.033 },
  rankTacos: {
    backgroundColor: "#A63C06",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rankTacosText: { color: "#fff", fontSize: width * 0.028, fontWeight: "700" },

  // Estado vacío
  emptyWrap: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 16 },
  emptyEmoji: { fontSize: width * 0.1, marginBottom: 8 },
  emptyTitle: {
    fontFamily: FONTS.bodyBold, color: BROWN,
    fontSize: width * 0.036, textAlign: "center", marginBottom: 4,
  },
  emptyHint: {
    fontFamily: FONTS.body, color: "#A0714F",
    fontSize: width * 0.03, textAlign: "center", lineHeight: width * 0.042,
  },
  addFirstBtn: {
    backgroundColor: GOLD,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 14,
    borderWidth: 2,
    borderColor: "#C8950A",
  },
  addFirstBtnText: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: width * 0.036 },

  // ── Username setup (Google/Apple) ─────────────────────────────────────────
  setupEmoji: { fontSize: width * 0.13, textAlign: "center", marginBottom: 6, marginTop: 4 },
  setupTitle: {
    fontFamily: FONTS.display,
    fontSize: width * 0.056,
    color: BROWN,
    textAlign: "center",
    marginBottom: 6,
  },
  setupHint: {
    fontFamily: FONTS.body,
    color: AMBER,
    fontSize: width * 0.034,
    textAlign: "center",
    lineHeight: width * 0.048,
    marginBottom: 14,
  },
  setupRules: {
    fontFamily: FONTS.body,
    color: "#A0714F",
    fontSize: width * 0.028,
    textAlign: "center",
    marginBottom: 6,
  },
  usernameHint: {
    fontFamily: FONTS.bodyBold,
    fontSize: width * 0.032,
    textAlign: "center",
    marginBottom: 4,
  },
  input: {
    backgroundColor: WHEAT2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.35)",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: FONTS.body,
    fontSize: width * 0.036,
    color: BROWN,
    marginBottom: 8,
  },
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

  // ── Competitor Profile Styles ──
  backBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(139,69,19,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  backBtnEmoji: { fontSize: 16, marginRight: 4 },
  backBtnText: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: 14 },

  profileContainer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  profileAvatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: WHEAT2,
    borderWidth: 3,
    borderColor: GOLD,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  profileAvatarText: { fontSize: 44 },
  profileUsername: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: 20 },
  profileName: { fontFamily: FONTS.body, color: "#A0714F", fontSize: 14, marginBottom: 12 },

  badgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: GOLD,
    color: BROWN,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#C8950A",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: WHEAT2,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.2)",
    marginBottom: 16,
    gap: 8,
  },
  statBox: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  statValue: { fontFamily: FONTS.number, color: "#A63C06", fontSize: 22 },
  statLabel: { fontFamily: FONTS.bodyBold, color: BROWN, fontSize: 12, marginTop: 2 },

  metricsTitle: {
    fontFamily: FONTS.display,
    color: BROWN,
    fontSize: 16,
    alignSelf: "flex-start",
    marginBottom: 8,
    marginLeft: 4,
  },
  miniGamesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  miniBox: {
    flex: 1,
    backgroundColor: WHEAT2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(139,69,19,0.2)",
    alignItems: "center",
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  miniBoxEmoji: { fontSize: 20, marginBottom: 4 },
  miniBoxScore: { fontFamily: FONTS.number, color: BROWN, fontSize: 16 },
  miniBoxLabel: { fontFamily: FONTS.body, color: "#A0714F", fontSize: 10, marginTop: 2 },

  profileActions: { width: "100%", marginTop: 8 },
  actionBtnProfile: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
  },
  btnAddProfile: { backgroundColor: GOLD, borderColor: "#C8950A" },
  btnRemoveProfile: { backgroundColor: "#FFEBEE", borderColor: RED },
  btnRemoveProfileText: { fontFamily: FONTS.bodyBold, color: RED, fontSize: 16 },
});
