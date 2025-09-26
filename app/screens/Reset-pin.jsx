import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useState } from "react";
import {
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Button from "../../components/Button";
import ToastMsg from "../../components/ToastMsg";
import { customerSetPin } from "../../services/productService";

export default function ResetPin() {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSetPin = async () => {
   const userData = await AsyncStorage.getItem("customer_id");
    // Validate inputs
    if (!oldPin || !newPin || !confirmPin) {
      setError("Please fill all fields");
      return;
    }
    if (newPin !== confirmPin) {
      setError("New PIN and Confirm PIN do not match");
      return;
    }
    if (newPin == oldPin) {
      setError("Old PIN and New PIN cannot be same");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await customerSetPin(parseInt(userData,10), oldPin, newPin);
      if (res?.status === 200) {
        ToastMsg('PIN updated successfully', 'success');
        await AsyncStorage.setItem("userPin", newPin);
        router.back();
      } else {
        setError(res?.message || "Could not update PIN");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
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
              <Text style={styles.title}>Set / Update PIN</Text>
              <Text style={styles.subtitle}>
                Secure your account with a new PIN
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Enter Old PIN"
                  placeholderTextColor="#6b7280"
                  secureTextEntry
                  style={styles.input}
                  value={oldPin}
                  onChangeText={(text) => {
                    setOldPin(text);
                    if (error) setError("");
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Enter New PIN"
                  placeholderTextColor="#6b7280"
                  secureTextEntry
                  style={styles.input}
                  value={newPin}
                  onChangeText={(text) => {
                    setNewPin(text);
                    if (error) setError("");
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              {/* ✅ Confirm PIN */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Confirm New PIN"
                  placeholderTextColor="#6b7280"
                  secureTextEntry
                  style={styles.input}
                  value={confirmPin}
                  onChangeText={(text) => {
                    setConfirmPin(text);
                    if (error) setError("");
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              {/* Error message */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                title="Update PIN"
                onPress={handleSetPin}
                size="large"
                width="100%"
              />

              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Text style={styles.backText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  body: {
    width: "100%",
  },
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
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#eacc0cff",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  primaryBtn: {
    marginTop: 18,
    borderRadius: 16,
    height: 56,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#121417",
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  backButton: {
    marginTop: 15,
    padding: 12,
    alignItems: "center",
  },
  backText: {
    color: "#D8A34E",
    fontSize: 16,
    fontWeight: "600",
  },
});