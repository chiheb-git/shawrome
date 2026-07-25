import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const VIDEO_DURATION_MS = 10000;

export default function Splash() {
  const [videoEnded, setVideoEnded] = useState(false);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  const player = useVideoPlayer(
    require("../assets/videos/intro.mp4"),
    (p) => {
      p.loop = false;
      p.muted = true;
      p.play();
    },
  );

  useEffect(() => {
    const subscription = player.addListener("playToEnd", () => {
      setVideoEnded(true);
    });
    return () => subscription.remove();
  }, [player]);

  useEffect(() => {
    logoOpacity.value = withDelay(
      VIDEO_DURATION_MS - 2200,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
    logoScale.value = withDelay(
      VIDEO_DURATION_MS - 2200,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.2)) }),
    );
    buttonOpacity.value = withDelay(
      VIDEO_DURATION_MS - 1200,
      withTiming(1, { duration: 700 }),
    );
    buttonTranslateY.value = withDelay(
      VIDEO_DURATION_MS - 1200,
      withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  function enterApp() {
    router.replace("/home");
  }

  return (
    <Pressable style={styles.container} onPress={videoEnded ? enterApp : undefined}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      <LinearGradient
        colors={["transparent", "rgba(10,10,15,0.4)", "rgba(10,10,15,0.95)"]}
        locations={[0, 0.6, 1]}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <Animated.View style={logoStyle}>
          <Text style={styles.logoText}>SHAWROME</Text>
          <Text style={styles.tagline}>L'excellence automobile</Text>
        </Animated.View>

        <Animated.View style={buttonStyle}>
          <Pressable style={styles.button} onPress={enterApp}>
            <Text style={styles.buttonText}>Découvrir le showroom</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  video: {
    width,
    height,
    position: "absolute",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 6,
    textAlign: "center",
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 1,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
