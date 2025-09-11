import AsyncStorage from "@react-native-async-storage/async-storage";
import MaskedView from "@react-native-masked-view/masked-view";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height: screenHeight } = Dimensions.get("window");

export default function Index() {
  const [checking, setChecking] = useState(true);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay: require("../assets/fonts/PlayfairDisplay-Bold.ttf"),
  });

  useEffect(() => {
    (async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        if (user) {
          // ✅ Already logged in → go directly to choose-login
          router.replace("/screens/choose-login");
          return;
        }
      } catch (e) {
        console.log("Error checking login status:", e);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  // ⏳ Show loader while checking AsyncStorage or fonts
  if (checking || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  // 👇 Show WelcomeScreen only if user is new
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.root}>
        <View style={styles.topSection}>
          <ImageBackground
            source={require("../assets/images/testimonial_01.png")}
            style={styles.topImage}
            imageStyle={styles.topImageStyle}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.65)", "rgba(0, 0, 0, 0.8)"]}
              style={styles.gradientOverlay}
              locations={[0, 0.5, 1]}
            />
            <View style={styles.topContent}>
              <View style={styles.omContainer}>
                <Text style={styles.om}>ॐ</Text>
              </View>

              <View style={styles.brandContainer}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={[styles.agamandira, styles.agaText]}>Aga</Text>
                  <MaskedView maskElement={<Text style={styles.agamandira}>mandira</Text>}>
                    <LinearGradient
                      colors={["#FFD700", "#FFA500", "#FF8C00"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={[styles.agamandira, { opacity: 0 }]}>mandira</Text>
                    </LinearGradient>
                  </MaskedView>
                </View>
                <Text style={styles.tagline}>Spiritual Guidance & Wisdom</Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.decorativeBorder} />
          <View style={styles.bottomContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Namaste 🙏</Text>
              <Text style={styles.welcomeSubtitle}>
                Begin Your Spiritual Journey With Us
              </Text>
            </View>

            <View style={styles.actions}>
              {/* Login Button */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push("/login")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#eacc0cff", "#dc6326ff"]}
                  style={styles.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.primaryText}>Login</Text>
                </LinearGradient>
              </TouchableOpacity>

              <LinearGradient
                colors={["#eacc0cff", "#dc6326ff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.outlineGradient}
              >
                <TouchableOpacity
                  style={styles.outlineBtnInner}
                  onPress={() => router.push("/register")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlineText}>Create Account</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFBFC'
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFC'
  },

  // Top Section
  topSection: {
    height: screenHeight * 0.58,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: -50,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  topImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  topImageStyle: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  topContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  omContainer: {
    marginBottom: 0,
  },
  om: {
    fontSize: 72,
    color: '#FFD700',
    fontWeight: '900',
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // Brand Text
  brandContainer: {
    alignItems: 'center',
  },
  agamandira: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 52,
    fontWeight: '950',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0,
  },
  agaText: {
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 10,
  },

  // Bottom Section
  bottomSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'flex-start',
  },
  decorativeBorder: {
    height: 4,
    backgroundColor: '#FFD700',
    marginHorizontal: 120,
    marginTop: -2,
    borderRadius: 2,
    opacity: 0.8,
  },
  bottomContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    color: '#f59e0b',
    textAlign: 'center',
    fontWeight: '1000',
    marginBottom: 12,
    fontFamily: 'PlayfairDisplay',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 24,
    paddingHorizontal: 8,
  },

  // Buttons
  actions: {
    gap: 16,
    width: '100%',
  },
  primaryBtn: {
    borderRadius: 16,
    height: 56,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#121417',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Gradient Border Button
  outlineGradient: {
    borderRadius: 16,
    padding: 2,
  },
  outlineBtnInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    color: '#121417',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
