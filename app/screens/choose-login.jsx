import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChooseLogin() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const bio = await AsyncStorage.getItem("biometric");
      if (bio === "true") setBiometricEnabled(true);
    })();
  }, []);

  const handlePinLogin = () => {
    router.replace("/screens/Pin-login");
  };

  const handleBiometricLogin = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login with Fingerprint",
    });
    if (result.success) {
      router.replace("/(tabs)");
    } else {
      Alert.alert("Authentication Failed", "Try again or use PIN login.");
    }
  };

  const handleNewUserLogin = async () => {
    router.replace("/screens/Login?force=true");
    await AsyncStorage.clear();
  };

  return (
    <ImageBackground
      source={require("../../assets/images/omBG.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>

        <View style={styles.centerContent}>
          <BlurView intensity={50} tint="light" style={styles.glassBox}>
            <View style={styles.body}>
              <Text style={styles.title}>Welcome back!</Text>
              <Text style={styles.subtitle}>Continue your spiritual journey</Text>

              {/* PIN Login */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handlePinLogin}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#eacc0cff', '#dc6326ff']}
                  style={styles.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.primaryText}>Login with PIN</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Fingerprint Login (only if enabled) */}
              {biometricEnabled && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleBiometricLogin}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#eacc0cff', '#dc6326ff']}
                    style={styles.primaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.primaryText}>Login with Fingerprint</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* New User */}
              <Text style={styles.registerLine}>
                <Text
                  style={styles.registerLink}
                  onPress={handleNewUserLogin}
                >
                  Change Active User
                </Text>
              </Text>
            </View>
          </BlurView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  container: { flex: 1 },

  glassBox: {
    width: "88%",
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "#eacc0cb3",
    overflow: "hidden",
  },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  body: { width: "100%" },
  title: {
    fontSize: 30,
    fontWeight: "1000",
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "PlayfairDisplay",
    color: "#6B1E1E",
  },
  subtitle: {
    fontSize: 16,
    color: "#C25B3C",
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 24,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  primaryBtn: {
    marginTop: 18,
    borderRadius: 16,
    height: 56,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#121417",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    paddingLeft: 10,
    paddingRight: 10,
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  registerLine: { marginTop: 20, textAlign: "center", color: "#6B7280" },
  registerLink: { color: "#d48817ff", fontWeight: "700" },
});
