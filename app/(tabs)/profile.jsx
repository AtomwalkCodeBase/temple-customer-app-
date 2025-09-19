import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const user_ref=AsyncStorage.getItem("ref_code");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const storedUser = await AsyncStorage.getItem("user");
        const storedBio = await AsyncStorage.getItem("biometric");

        if (storedUser) setUser(storedUser);
        setBiometricEnabled(storedBio === "true");
      })();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("biometric");
    await AsyncStorage.removeItem("userPin");
    await AsyncStorage.clear();
    router.replace("/screens/Login");
  };

  const toggleBiometric = async () => {
    if (!biometricEnabled) {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        alert("Your device does not support biometrics.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm fingerprint to enable biometric login",
      });

      if (result.success) {
        await AsyncStorage.setItem("biometric", "true");
        setBiometricEnabled(true);
      } else {
        alert("Could not enable fingerprint login.");
      }
    } else {
      await AsyncStorage.setItem("biometric", "false");
      setBiometricEnabled(false);
    }
  };

    const handlePanchang = async () => {
    router.push("/PanchangScreen");
  };

  const handleMybookings = async () => {
    router.push("/screens/MyBookings");
  };

  const handleSetPin = async () => {
    router.push("../screens/Reset-pin");
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={styles.headerLine} />
      </View>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: "https://i.pravatar.cc/150?img=12" }}
          style={styles.avatar}
        />
        <Text style={styles.name}>Vishnuvardhan</Text>
        <Text style={styles.subtext}>{user_ref}</Text>
      </View>

      {/* Details Section */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Profile Settings</Text>
        </View>
        <TouchableOpacity
          style={styles.row}
          onPress={handleMybookings}
        >
          <Text style={styles.label}>My Bookings</Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <Text style={styles.label}>Account Settings</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Help & Support</Text>
        </View>
        <TouchableOpacity style={styles.row} onPress={handlePanchang}>
          <Text style={styles.label}>Panchang</Text>
        </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f6f9",
    alignItems: "center",
  },

  // Top Header
  topHeader: {
    width: "100%",
    backgroundColor: "#E88F14",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerLine: {
    height: 2,
    width: "80%",
    backgroundColor: "#fff",
    marginTop: 5,
    borderRadius: 1,
  },

  profileHeader: {
    backgroundColor: "#E88F14",
    width: "100%",
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
    marginTop: 10,
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
