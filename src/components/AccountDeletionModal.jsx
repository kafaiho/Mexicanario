import { useMutation } from "convex/react";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { useUserMutation } from "../hooks/useUserMutation";

/**
 * AccountDeletionModal
 *
 * Shows a confirmation dialog before permanently deleting the user's account.
 * Required by Apple App Store guidelines (Account Deletion policy).
 *
 * Usage:
 *   <AccountDeletionModal visible={show} onClose={() => setShow(false)} />
 */
export default function AccountDeletionModal({ visible, onClose }) {
    const { userId, logout } = useAuth();
    const deleteAccount = useUserMutation(api.users.deleteAccount);
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        if (!userId || deleting) return;

        Alert.alert(
            "⚠️ Eliminar Cuenta",
            "Esta acción es permanente e irreversible.\n\n" +
            "Se borrarán tus palabras, progreso, mascota, monedas y todos tus datos.\n\n" +
            "¿Estás seguro?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sí, eliminar",
                    style: "destructive",
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await deleteAccount({ userId });
                            await logout();
                        } catch (e) {
                            Alert.alert("Error", e.message ?? "No se pudo eliminar la cuenta.");
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    }

    if (!visible) return null;

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>🗑️ Eliminar Cuenta</Text>
                    <Text style={styles.body}>
                        Se eliminarán permanentemente:{"\n\n"}
                        {"• Progreso y niveles completados\n"}
                        {"• Mascota y su estado\n"}
                        {"• Monedas, diamantes e historial\n"}
                        {"• Logros y ligas\n"}
                        {"• Misiones diarias\n\n"}
                        Esta acción{" "}
                        <Text style={{ fontWeight: "900" }}>no se puede deshacer</Text>.
                    </Text>

                    <TouchableOpacity
                        style={[styles.btn, styles.destructiveBtn, deleting && { opacity: 0.6 }]}
                        onPress={handleDelete}
                        disabled={deleting}
                    >
                        <Text style={styles.destructiveBtnText}>
                            {deleting ? "Eliminando..." : "Eliminar mi cuenta"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btn} onPress={onClose}>
                        <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    card: {
        width: "100%",
        backgroundColor: "#FFF8ED",
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        borderColor: "#cc3300",
    },
    title: {
        fontSize: 20,
        fontWeight: "900",
        color: "#5C3A21",
        marginBottom: 14,
        textAlign: "center",
    },
    body: {
        fontSize: 14,
        color: "#5C3A21",
        lineHeight: 22,
        marginBottom: 24,
    },
    btn: {
        paddingVertical: 13,
        borderRadius: 50,
        alignItems: "center",
        marginBottom: 10,
    },
    destructiveBtn: {
        backgroundColor: "#cc3300",
        borderWidth: 2,
        borderColor: "#a02200",
    },
    destructiveBtnText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 15,
    },
    cancelText: {
        color: "#A0714F",
        fontWeight: "700",
        fontSize: 14,
    },
});
