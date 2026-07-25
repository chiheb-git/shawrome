import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft, Phone, MessageCircle, Gauge, Calendar, Fuel, Settings2, ImageOff, Heart,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";
import ImageViewing from "react-native-image-viewing";
import { apiFetch } from "../../lib/api";
import { getFavoriteIds, addFavorite, removeFavorite, getClientToken } from "../../lib/favorites";
import ClientLoginModal from "../../components/ClientLoginModal";
import { colors, radius, shadow } from "../../lib/theme";

const { width } = Dimensions.get("window");
const GALLERY_HEIGHT = 340;
const CONTACT_PHONE = "213656247391";

interface CarDetail {
  id: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  description: string;
  sellingPrice: number;
  fuel: string;
  transmission: string;
  color: string;
  condition: string;
  photos: string[];
  sellerName: string;
}

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);

  const scrollY = useSharedValue(0);
  const heartScale = useSharedValue(1);

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const galleryStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [-150, 0], [1.4, 1], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [0, GALLERY_HEIGHT], [0, -GALLERY_HEIGHT / 2.5], Extrapolation.CLAMP);
    return { transform: [{ scale }, { translateY }] };
  });

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  useEffect(() => {
    apiFetch<CarDetail>(`/api/cars/${id}`).then(setCar).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    getFavoriteIds().then((ids) => setIsFavorite(ids.includes(Number(id)))).catch(() => {});
  }, [id]);

  async function toggleFavorite() {
    heartScale.value = withSpring(1.4, { damping: 4 }, () => {
      heartScale.value = withSpring(1);
    });
    const token = await getClientToken();
    if (!token) {
      setLoginModalVisible(true);
      return;
    }
    if (isFavorite) {
      await removeFavorite(Number(id));
      setIsFavorite(false);
    } else {
      await addFavorite(Number(id));
      setIsFavorite(true);
    }
  }

  async function onLoginSuccess() {
    setLoginModalVisible(false);
    await addFavorite(Number(id));
    setIsFavorite(true);
  }

  function openWhatsApp() {
    if (!car) return;
    const message = `Bonjour, je suis interesse par la ${car.brand} ${car.model} (${car.year}) a ${car.sellingPrice.toLocaleString("fr-DZ")} DA.`;
    Linking.openURL(`https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent(message)}`);
  }

  function callSeller() {
    Linking.openURL(`tel:+${CONTACT_PHONE}`);
  }

  if (loading || !car) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ClientLoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSuccess={onLoginSuccess}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.gallery, galleryStyle]}>
          {car.photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                setActivePhoto(idx);
              }}
            >
              {car.photos.map((photo, index) => (
                <Pressable key={index} onPress={() => { setActivePhoto(index); setViewerVisible(true); }}>
                  <Image source={{ uri: photo }} style={styles.galleryImage} resizeMode="cover" />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.galleryImage, styles.noPhoto]}>
              <ImageOff size={40} color="#3f3f46" />
              <Text style={styles.noPhotoText}>Aucune photo disponible</Text>
            </View>
          )}
          <LinearGradient colors={["rgba(0,0,0,0.3)", "transparent", "rgba(10,10,15,1)"]} locations={[0, 0.3, 1]} style={StyleSheet.absoluteFill} />
          {car.photos.length > 1 && (
            <View style={styles.photoCount}>
              <Text style={styles.photoCountText}>{activePhoto + 1}/{car.photos.length}</Text>
            </View>
          )}
        </Animated.View>

        {car.photos.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRow}
          >
            {car.photos.map((photo, index) => (
              <Pressable
                key={index}
                onPress={() => { setActivePhoto(index); setViewerVisible(true); }}
                style={[styles.thumb, activePhoto === index && styles.thumbActive]}
              >
                <Image source={{ uri: photo }} style={styles.thumbImage} resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>
        )}

        <ImageViewing
          images={car.photos.map((uri) => ({ uri }))}
          imageIndex={activePhoto}
          visible={viewerVisible}
          onRequestClose={() => setViewerVisible(false)}
          onImageIndexChange={setActivePhoto}
          swipeToCloseEnabled
          doubleTapToZoomEnabled
        />

        <SafeAreaView style={styles.topRow} edges={["top"]} pointerEvents="box-none">
          <Pressable style={[styles.iconButton, shadow.floating]} onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <Animated.View style={heartStyle}>
            <Pressable style={[styles.iconButton, shadow.floating]} onPress={toggleFavorite} hitSlop={8}>
              <Heart size={20} color={isFavorite ? colors.danger : colors.text} fill={isFavorite ? colors.danger : "transparent"} />
            </Pressable>
          </Animated.View>
        </SafeAreaView>

        <View style={styles.body}>
          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{car.brand} {car.model}</Text>
              <Text style={styles.subtitle}>{car.year} - {car.color}</Text>
            </View>
            <Text style={styles.price}>{car.sellingPrice.toLocaleString("fr-DZ")} DA</Text>
          </Animated.View>

          <View style={styles.specsGrid}>
            {[
              { icon: Gauge, label: "Kilometrage", value: `${car.mileage.toLocaleString("fr-DZ")} km` },
              { icon: Calendar, label: "Annee", value: String(car.year) },
              { icon: Fuel, label: "Carburant", value: car.fuel },
              { icon: Settings2, label: "Transmission", value: car.transmission },
            ].map((spec, i) => (
              <Animated.View
                key={spec.label}
                entering={FadeInDown.delay(120 + i * 60).duration(400)}
                style={styles.specCard}
              >
                <spec.icon size={18} color={colors.accent} />
                <Text style={styles.specLabel}>{spec.label}</Text>
                <Text style={styles.specValue}>{spec.value}</Text>
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={FadeInDown.delay(380).duration(400)}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{car.description}</Text>
          </Animated.View>

          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      <View style={styles.contactBar}>
        <Pressable style={styles.callButton} onPress={callSeller}>
          <Phone size={20} color={colors.text} />
        </Pressable>
        <Pressable style={[styles.whatsappButton, shadow.floating]} onPress={openWhatsApp}>
          <MessageCircle size={18} color="#fff" />
          <Text style={styles.whatsappText}>Contacter sur WhatsApp</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  gallery: { height: GALLERY_HEIGHT, backgroundColor: "#1a1a22", position: "relative" },
  galleryImage: { width, height: GALLERY_HEIGHT },
  topRow: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12,
  },
  iconButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  noPhoto: { alignItems: "center", justifyContent: "center", gap: 8 },
  noPhotoText: { color: colors.textFaint, fontSize: 13 },
  photoCount: {
    position: "absolute", bottom: 14, right: 14, backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
  },
  photoCountText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  thumbRow: { paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  thumb: {
    width: 64, height: 48, borderRadius: 10, overflow: "hidden", marginRight: 8,
    borderWidth: 2, borderColor: "transparent",
  },
  thumbActive: { borderColor: colors.accent },
  thumbImage: { width: "100%", height: "100%" },
  body: { padding: 20, backgroundColor: colors.bg, marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 22, paddingTop: 6 },
  title: { fontSize: 23, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: 20, fontWeight: "800", color: colors.accent },
  specsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 26 },
  specCard: {
    width: "47%", backgroundColor: colors.surface, borderRadius: radius.md, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  specLabel: { fontSize: 12, color: colors.textFaint, marginTop: 8 },
  specValue: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 8 },
  description: { fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  contactBar: {
    position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10,
    padding: 16, paddingBottom: 32, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border,
  },
  callButton: {
    width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  whatsappButton: {
    flex: 1, flexDirection: "row", gap: 8, backgroundColor: colors.whatsapp, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
  },
  whatsappText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
