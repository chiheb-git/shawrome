import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Modal } from "react-native";
import { X } from "lucide-react-native";
import { clientLogin } from "../lib/favorites";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClientLoginModal({ visible, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !email.includes("@")) {
      setError("Nom et email valide requis");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await clientLogin(name.trim(), email.trim());
      onSuccess();
      setName("");
      setEmail("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Ajouter aux favoris</Text>
            <Pressable onPress={onClose}>
              <X size={22} color="#9ca3af" />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Entrez vos coordonnees pour sauvegarder vos voitures preferees
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Votre nom"
            placeholderTextColor="#6b7280"
            style={styles.input}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Votre email"
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? "Connexion..." : "Continuer"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#13131a",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#ffffff" },
  subtitle: { fontSize: 13, color: "#9ca3af", marginBottom: 16 },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 10,
  },
  error: { color: "#f87171", fontSize: 13, marginBottom: 10 },
  button: {
    backgroundColor: "#3b82f6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
});
