import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Search, SlidersHorizontal, ImageOff, Heart } from "lucide-react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { apiFetch } from "../lib/api";
import { getFavoriteIds, addFavorite, removeFavorite, getClientToken } from "../lib/favorites";
import ClientLoginModal from "../components/ClientLoginModal";
import { colors, radius, shadow } from "../lib/theme";

interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  sellingPrice: number;
  fuel: string;
  transmission: string;
  photos: string[];
  status: string;
}

function CarCard({
  item,
  index,
  isFavorite,
  onToggleFavorite,
}: {
  item: Car;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  function onHeartPress() {
    console.log("HEART TAPPED", item.id);
    heartScale.value = withSpring(1.4, { damping: 4 }, () => {
      heartScale.value = withSpring(1);
    });
    onToggleFavorite();
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(450)} style={[styles.card, shadow.card]}>
      <Animated.View style={cardStyle}>
        <Pressable
          onPressIn={() => (scale.value = withSpring(0.97, { damping: 15 }))}
          onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
          onPress={() => router.push(`/car/${item.id}`)}
        >
          <View style={styles.imageWrapper}>
            {item.photos[0] ? (
              <Image source={{ uri: item.photos[0] }} style={styles.cardImage} resizeMode="cover" />
            ) : (
              <View style={[styles.cardImage, styles.noPhoto]}>
                <ImageOff size={28} color="#3f3f46" />
              </View>
            )}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={styles.imageGradient}
            />
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>
                {item.sellingPrice.toLocaleString("fr-DZ")} DA
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{item.brand} {item.model}</Text>
            <View style={styles.specRow}>
              <View style={styles.specPill}>
                <Text style={styles.specPillText}>{item.year}</Text>
              </View>
              <View style={styles.specPill}>
                <Text style={styles.specPillText}>
                  {item.mileage.toLocaleString("fr-DZ")} km
                </Text>
              </View>
              <View style={styles.specPill}>
                <Text style={styles.specPillText}>{item.fuel}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.heartButton, shadow.floating, heartStyle]}>
        <Pressable
          onPress={() => onHeartPress()}
          hitSlop={10}
          style={styles.heartTouchArea}
        >
          <Heart
            size={18}
            color={isFavorite ? colors.danger : colors.text}
            fill={isFavorite ? colors.danger : "transparent"}
          />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export default function Home() {
  const params = useLocalSearchParams<{
    brand?: string; fuel?: string; transmission?: string;
    yearMin?: string; yearMax?: string; priceMin?: string; priceMax?: string; mileageMax?: string;
  }>();
  const { brand, fuel, transmission, yearMin, yearMax, priceMin, priceMax, mileageMax } = params;

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [pendingCarId, setPendingCarId] = useState<number | null>(null);

  const activeFilterCount = [brand, fuel, transmission, yearMin, yearMax, priceMin, priceMax, mileageMax]
    .filter(Boolean).length;

  const loadCars = useCallback(async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("status", "available");
      qs.set("limit", "1000");
      if (query) qs.set("search", query);
      if (brand) qs.set("brand", brand);
      if (fuel) qs.set("fuel", fuel);
      if (transmission) qs.set("transmission", transmission);
      if (yearMin) qs.set("yearMin", yearMin);
      if (yearMax) qs.set("yearMax", yearMax);
      if (priceMin) qs.set("priceMin", priceMin);
      if (priceMax) qs.set("priceMax", priceMax);
      if (mileageMax) qs.set("mileageMax", mileageMax);
      const data = await apiFetch<{ cars: Car[] }>(`/api/cars?${qs.toString()}`);
      setCars(data.cars);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [brand, fuel, transmission, yearMin, yearMax, priceMin, priceMax, mileageMax]);

  useEffect(() => {
    const timeout = setTimeout(() => loadCars(search), search ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [search, loadCars]);

  useFocusEffect(
    useCallback(() => {
      getFavoriteIds().then(setFavoriteIds).catch(() => {});
    }, []),
  );

  async function toggleFavorite(carId: number) {
    const token = await getClientToken();
    if (!token) {
      setPendingCarId(carId);
      setLoginModalVisible(true);
      return;
    }
    if (favoriteIds.includes(carId)) {
      await removeFavorite(carId);
      setFavoriteIds((ids) => ids.filter((id) => id !== carId));
    } else {
      await addFavorite(carId);
      setFavoriteIds((ids) => [...ids, carId]);
    }
  }

  async function onLoginSuccess() {
    setLoginModalVisible(false);
    if (pendingCarId) {
      await addFavorite(pendingCarId);
      setFavoriteIds((ids) => [...ids, pendingCarId]);
      setPendingCarId(null);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ClientLoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSuccess={onLoginSuccess}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shawrome</Text>
          <Text style={styles.headerSubtitle}>{cars.length} voitures disponibles</Text>
        </View>
        <Pressable style={[styles.favoritesLink, shadow.floating]} onPress={() => router.push("/favorites")}>
          <Heart size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textFaint} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une marque, un modele..."
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
          />
        </View>
        <Pressable style={[styles.filterButton, shadow.floating]} onPress={() => router.push("/filters")}>
          <SlidersHorizontal size={18} color={colors.text} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : cars.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>Aucune voiture trouvee.</Text>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <CarCard
              item={item}
              index={index}
              isFavorite={favoriteIds.includes(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: colors.textFaint, marginTop: 2 },
  favoritesLink: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  searchRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginTop: 8, marginBottom: 18 },
  searchBar: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: colors.surface, borderRadius: radius.md,
    paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, gap: 8,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 13 },
  filterButton: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: colors.accent, alignItems: "center", justifyContent: "center",
  },
  filterBadge: {
    position: "absolute", top: -4, right: -4, backgroundColor: colors.danger,
    borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  filterBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden",
    marginBottom: 20, borderWidth: 1, borderColor: colors.border, position: "relative",
  },
  imageWrapper: { position: "relative" },
  cardImage: { width: "100%", height: 190, backgroundColor: "#1a1a22" },
  imageGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 70 },
  noPhoto: { alignItems: "center", justifyContent: "center" },
  priceBadge: {
    position: "absolute", bottom: 10, left: 12,
    backgroundColor: "rgba(59,130,246,0.9)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
  },
  priceBadgeText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  heartButton: {
    position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)", zIndex: 10,
  },
  heartTouchArea: {
    width: "100%", height: "100%", alignItems: "center", justifyContent: "center",
  },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 10 },
  specRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  specPill: {
    backgroundColor: colors.accentDim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full,
  },
  specPillText: { color: "#93c5fd", fontSize: 12, fontWeight: "600" },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#f87171", fontSize: 14 },
  emptyText: { color: colors.textFaint, fontSize: 14 },
});
