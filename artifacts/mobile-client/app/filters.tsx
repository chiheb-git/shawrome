import { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from "react-native-reanimated";
import { colors, radius, shadow } from "../lib/theme";

const fuels = ["essence", "diesel", "hybride", "electrique", "gpl"];
const transmissions = ["manuelle", "automatique"];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    scale.value = withSpring(0.9, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  }

  return (
    <Animated.View style={style}>
      <Pressable onPress={handlePress} style={[styles.chip, active && styles.chipActive]}>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function Filters() {
  const [fuel, setFuel] = useState<string | null>(null);
  const [transmission, setTransmission] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [mileageMax, setMileageMax] = useState("");

  function applyFilters() {
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (fuel) params.set("fuel", fuel);
    if (transmission) params.set("transmission", transmission);
    if (yearMin) params.set("yearMin", yearMin);
    if (yearMax) params.set("yearMax", yearMax);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (mileageMax) params.set("mileageMax", mileageMax);
    router.replace(`/home?${params.toString()}`);
  }

  function resetFilters() {
    setBrand(""); setFuel(null); setTransmission(null);
    setYearMin(""); setYearMax(""); setPriceMin(""); setPriceMax(""); setMileageMax("");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filtres</Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <X size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(40).duration(350)}>
          <Text style={styles.label}>Marque</Text>
          <TextInput
            value={brand}
            onChangeText={setBrand}
            placeholder="ex: Toyota"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(350)}>
          <Text style={styles.label}>Carburant</Text>
          <View style={styles.chipRow}>
            {fuels.map((f) => (
              <Chip key={f} label={f} active={fuel === f} onPress={() => setFuel(fuel === f ? null : f)} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(350)}>
          <Text style={styles.label}>Transmission</Text>
          <View style={styles.chipRow}>
            {transmissions.map((t) => (
              <Chip key={t} label={t} active={transmission === t} onPress={() => setTransmission(transmission === t ? null : t)} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(350)}>
          <Text style={styles.label}>Annee</Text>
          <View style={styles.row}>
            <TextInput value={yearMin} onChangeText={setYearMin} placeholder="Min" placeholderTextColor={colors.textFaint} keyboardType="numeric" style={[styles.input, styles.halfInput]} />
            <TextInput value={yearMax} onChangeText={setYearMax} placeholder="Max" placeholderTextColor={colors.textFaint} keyboardType="numeric" style={[styles.input, styles.halfInput]} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).duration(350)}>
          <Text style={styles.label}>Prix (DA)</Text>
          <View style={styles.row}>
            <TextInput value={priceMin} onChangeText={setPriceMin} placeholder="Min" placeholderTextColor={colors.textFaint} keyboardType="numeric" style={[styles.input, styles.halfInput]} />
            <TextInput value={priceMax} onChangeText={setPriceMax} placeholder="Max" placeholderTextColor={colors.textFaint} keyboardType="numeric" style={[styles.input, styles.halfInput]} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(340).duration(350)}>
          <Text style={styles.label}>Kilometrage max</Text>
          <TextInput value={mileageMax} onChangeText={setMileageMax} placeholder="ex: 100000" placeholderTextColor={colors.textFaint} keyboardType="numeric" style={styles.input} />
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.resetButton} onPress={resetFilters}>
          <Text style={styles.resetText}>Reinitialiser</Text>
        </Pressable>
        <Pressable style={[styles.applyButton, shadow.floating]} onPress={applyFilters}>
          <Text style={styles.applyText}>Appliquer les filtres</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  closeButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  label: { fontSize: 13, color: colors.textMuted, marginTop: 20, marginBottom: 10, fontWeight: "700" },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13,
    color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border,
  },
  row: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 13, textTransform: "capitalize", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  footer: {
    flexDirection: "row", gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: colors.border,
  },
  resetButton: {
    flex: 1, paddingVertical: 15, borderRadius: radius.md, backgroundColor: colors.surfaceElevated, alignItems: "center",
  },
  resetText: { color: colors.text, fontWeight: "700" },
  applyButton: {
    flex: 2, paddingVertical: 15, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: "center",
  },
  applyText: { color: "#fff", fontWeight: "700" },
});
