import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Load user & biometric setting whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const storedUser = await AsyncStorage.getItem("user");
        const storedBio = await AsyncStorage.getItem("biometric");

        if (storedUser) setUser(JSON.parse(storedUser));
        setBiometricEnabled(storedBio === "true");
      })();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("biometric");
    await AsyncStorage.removeItem("userPin");
    await AsyncStorage.clear();
    router.replace("/login");
  };

  const toggleBiometric = async () => {
    if (!biometricEnabled) {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        Alert.alert(
          "Biometric not available",
          "Your device does not support biometrics."
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm fingerprint to enable biometric login",
      });

      if (result.success) {
        await AsyncStorage.setItem("biometric", "true");
        setBiometricEnabled(true);
      } else {
        Alert.alert(
          "Authentication failed",
          "Could not enable fingerprint login."
        );
      }
    } else {
      await AsyncStorage.setItem("biometric", "false");
      setBiometricEnabled(false);
    }
  };

  const handleSetPin = async () => {
    router.push("../screens/reset-pin");
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: "https://i.pravatar.cc/150?img=12" }}
          style={styles.avatar}
        />
        <Text style={styles.name}>Vishnuvardhan</Text>
        <Text style={styles.subtext}>{user.cust_ref_code}</Text>
      </View>

      {/* Details Section */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Profile Settings</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Account Settings</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Help & Support</Text>
        </View>
      </View>

      {/* Fingerprint Toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleText}>Fingerprint Login</Text>
        <Switch
          value={biometricEnabled}
          onValueChange={toggleBiometric}
          trackColor={{ false: "#ccc", true: "#e8901496" }}
          thumbColor={biometricEnabled ? "#E88F14" : "#f4f3f4"}
        />
      </View>

      {/* Set/Update Pin */}
      <TouchableOpacity style={styles.pinBtn} onPress={handleSetPin}>
        <Text style={styles.pinText}>Update PIN</Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f6f9", alignItems: "center" },
  header: {
    backgroundColor: "#E88F14",
    width: "100%",
    paddingTop: 40, // safe area top padding
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: { fontSize: 20, fontWeight: "700", color: "#fff", marginTop: 10 },
  subtext: { color: "#cce7ea", fontSize: 14 },
  card: {
    backgroundColor: "#fff",
    marginTop: 20,
    width: "90%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  label: { fontSize: 16, color: "#555" },
  toggleRow: {
    marginTop: 20,
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleText: { fontSize: 16, color: "#333", fontWeight: "600" },
  pinBtn: {
    marginTop: 20,
    backgroundColor: "#4d88ff",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  pinText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  logoutBtn: {
    marginTop: "auto",
    marginBottom: 30,
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 25,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
