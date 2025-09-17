// app/screens/pin-login.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function PinLogin() {
  const [pin, setPin] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [error, setError] = useState(""); // 🔹 Error state

  useEffect(() => {
    (async () => {
      const bio = await AsyncStorage.getItem("biometric");
      if (bio === "true") setBiometricEnabled(true);
    })();
  }, []);

  const handlePinLogin = async () => {
    if (!pin) { // 🔹 Check for empty PIN
      setError("Enter PIN");
      return;
    }

    try {
      const savedPin = await AsyncStorage.getItem("userPin");

      if (!savedPin) {
        setError("No PIN found. Please log in again.");
        router.replace("/screens/choose-login");
        return;
      }

      if (pin === savedPin) {
        setError(""); // clear error
        router.replace("/(tabs)");
      } else {
        setError("Invalid PIN. Please try again."); // show inline error
        setPin("");
      }
    } catch (e) {
      console.error("PIN login error:", e);
      setError("Something went wrong. Please try again.");
    }
  };

  const handleBiometricLogin = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login with Fingerprint",
    });
    if (result.success) {
      setError("");
      router.replace("/(tabs)");
    } else {
      setError("Authentication failed. Try again or use PIN login.");
    }
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
              <Text style={styles.title}>Enter Your PIN</Text>

              <TextInput
                style={[styles.input, error ? styles.inputError : null]} // red border on error
                placeholder="Enter PIN"
                secureTextEntry
                keyboardType="numeric"
                value={pin}
                onChangeText={(text) => {
                  setPin(text);
                  if (error) setError(""); // clear error while typing
                }}
                maxLength={6}
              />

              {/* 🔹 Error message */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* 🔹 Login Button */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handlePinLogin}
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

              {/* 🔹 Back to Login Options */}
              <Text style={styles.registerLine}>
                <Text
                  style={styles.registerLink}
                  onPress={() => router.replace("/screens/choose-login")}
                >
                  ← Back to Login Options
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
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "PlayfairDisplay",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 16,
    padding: 14,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#f44336", // red border on error
  },
  errorText: {
    color: "#f44336",
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "500",
    textAlign: "center",
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
  registerLink: { color: "#12a4a6", fontWeight: "700" },
});
