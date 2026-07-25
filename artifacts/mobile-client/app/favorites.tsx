import { useCallback, useState } from "react";
import { View, Text, FlatList, Image, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, ImageOff, Heart } from "lucide-react-native";
import Animated, { FadeInDown, FadeOutLeft, Layout } from "react-native-reanimated";
import { getFavoriteCars, removeFavorite, getClientToken } from "../lib/favorites";
import { colors, radius, shadow } from "../lib/theme";

interface FavCar {
  id: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  sellingPrice: number;
  fuel: string;
  photos: string[];
}

export default function Favorites() {
  const [cars, setCars] = useState<FavCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const token = await getClientToken();
    if (!token) {
      setHasAccount(false);
      setLoading(false);
      return;
    }
    setHasAccount(true);
    const data = await getFavoriteCars();
    setCars(data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleRemove(carId: number) {
    setCars((prev) => prev.filter((c) => c.id !== carId));
    await removeFavorite(carId);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Mes favoris</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : !hasAccount ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconWrapper}>
            <Heart size={36} color={colors.accent} />
          </View>
          <Text style={styles.emptyText}>
            Ajoutez une voiture en favori pour creer votre espace personnel
          </Text>
        </View>
      ) : cars.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconWrapper}>
            <Heart size={36} color={colors.accent} />
          </View>
          <Text style={styles.emptyText}>Aucun favori pour le moment</Text>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 60).duration(350)}
              exiting={FadeOutLeft.duration(250)}
              layout={Layout.springify()}
            >
              <Pressable style={[styles.card, shadow.card]} onPress={() => router.push(`/car/${item.id}`)}>
                {item.photos[0] ? (
                  <Image source={{ uri: item.photos[0] }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={[styles.image, styles.noPhoto]}>
                    <ImageOff size={20} color="#3f3f46" />
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={styles.name}>{item.brand} {item.model}</Text>
                  <Text style={styles.specs}>{item.year} - {item.mileage.toLocaleString("fr-DZ")} km</Text>
                  <Text style={styles.price}>{item.sellingPrice.toLocaleString("fr-DZ")} DA</Text>
                </View>
                <Pressable
                  style={styles.removeButton}
                  onPress={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                  hitSlop={10}
                >
                  <Heart size={20} color={colors.danger} fill={colors.danger} />
                </Pressable>
              </Pressable>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
  },
  iconButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.text },
  list: { padding: 20 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: colors.border,
  },
  image: { width: 84, height: 64, borderRadius: radius.sm, backgroundColor: "#1a1a22" },
  noPhoto: { alignItems: "center", justifyContent: "center" },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  specs: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: 14, fontWeight: "800", color: colors.accent, marginTop: 4 },
  removeButton: { padding: 10 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 },
  emptyIconWrapper: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accentDim,
    alignItems: "center", justifyContent: "center",
  },
  emptyText: { color: colors.textFaint, fontSize: 14, textAlign: "center" },
});
