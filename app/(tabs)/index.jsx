import { Ionicons } from "@expo/vector-icons"; // 🔹 for fingerprint & close icons
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";

export default function Home() {
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  useEffect(() => {
    const checkFingerprintStatus = async () => {
      const hardwareSupported = await LocalAuthentication.hasHardwareAsync();

      const fingerprintPrompted = await AsyncStorage.getItem("fingerprintPrompted");
      const biometric = await AsyncStorage.getItem("biometric");

      if (hardwareSupported && !fingerprintPrompted && biometric !== "true") {
        setIsPopupVisible(true);
      }
    };

    checkFingerprintStatus();
  }, []);

  const handleYes = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm your fingerprint",
    });

    if (result.success) {
      await AsyncStorage.setItem("biometric", "true");
    } else {
      await AsyncStorage.setItem("biometric", "false");
    }
    await AsyncStorage.setItem("fingerprintPrompted", "true");
    setIsPopupVisible(false);
  };

  const handleNo = async () => {
    await AsyncStorage.setItem("biometric", "false");
    await AsyncStorage.setItem("fingerprintPrompted", "true");
    setIsPopupVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home (Tabs)</Text>

      {/* Fingerprint Popup */}
      <Modal isVisible={isPopupVisible} animationIn="zoomIn" animationOut="zoomOut">
        <View style={styles.popupContainer}>
          {/* Close Icon */}
          <TouchableOpacity style={styles.closeButton} onPress={handleNo}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          {/* Fingerprint Icon */}
          <Ionicons name="finger-print" size={60} color="#E88F14" style={{ marginBottom: 20 }} />

          {/* Message */}
          <Text style={styles.message}>
            Would you like to enable{"\n"}Fingerprint Login?
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.yesButton]} onPress={handleYes}>
              <Text style={styles.buttonText}>YES</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.noButton]} onPress={handleNo}>
              <Text style={styles.buttonText}>NO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 18 },

  popupContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  closeButton: { position: "absolute", top: 12, right: 12, padding: 6 },
  message: {
    fontSize: 17,
    textAlign: "center",
    marginBottom: 25,
    fontWeight: "600",
    color: "#333",
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  button: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  yesButton: { backgroundColor: "#E88F14" },
  noButton: { backgroundColor: "#6B7280" },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
