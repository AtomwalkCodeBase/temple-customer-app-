import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");

export default function Profile() {
  const [user, setUser] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [userRef, setUserRef] = useState("");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const storedUser = await AsyncStorage.getItem("user");
        const storedBio = await AsyncStorage.getItem("biometric");
        const storedRef = await AsyncStorage.getItem("ref_code");

        if (storedUser) setUser(storedUser);
        if (storedRef) setUserRef(storedRef);
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

  const handleSetting = async () => {
    router.push("/ProfileSetting");
  };

  const handleMybookings = async () => {
    router.push("/screens/MyBookings");
  };

  const handleSetPin = async () => {
    router.push("../screens/Reset-pin");
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const menuItems = [
    {
      icon: "person-outline",
      label: "Profile Settings",
      onPress: handleSetting,
      color: "#E88F14",
    },
    {
      icon: "calendar-outline",
      label: "My Bookings",
      onPress: handleMybookings,
      color: "#4d88ff",
    },
    {
      icon: "settings-outline",
      label: "Account Settings",
      onPress: () => {},
      color: "#10b981",
    },
    {
      icon: "help-circle-outline",
      label: "Help & Support",
      onPress: () => {},
      color: "#ef4444",
    },
  ];

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section with Gradient */}
      <LinearGradient
        colors={["#E88F14", "#f5a742"]}
        style={styles.headerGradient}
      >
        <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>User Profile</Text>
          <View style={styles.headerLine} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=12" }}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          </View>
          <Text style={styles.name}>Vishnuvardhan</Text>
          <Text style={styles.subtext}>Reference: {userRef}</Text>
        </View>
      </LinearGradient>
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuCard}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Security Section */}
      <View style={styles.securityCard}>
        <Text style={styles.sectionTitle}>Security</Text>
        
        {/* Biometric Toggle */}
        <View style={styles.securityItem}>
          <View style={styles.securityLeft}>
            <View style={[styles.iconContainer, { backgroundColor: "#E88F1420" }]}>
              <Ionicons name="finger-print" size={24} color="#E88F14" />
            </View>
            <View>
              <Text style={styles.securityLabel}>Fingerprint Login</Text>
              <Text style={styles.securityDescription}>Use biometrics for faster access</Text>
            </View>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={toggleBiometric}
            trackColor={{ false: "#d1d5db", true: "#E88F14" }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Update PIN Button */}
        <TouchableOpacity 
          style={styles.pinButton}
          onPress={handleSetPin}
          activeOpacity={0.8}
        >
          <View style={styles.pinButtonLeft}>
            <View style={[styles.iconContainer, { backgroundColor: "#4d88ff20" }]}>
              <Feather name="lock" size={20} color="#4d88ff" />
            </View>
            <Text style={styles.pinButtonText}>Update PIN</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  topHeader: {
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerLine: {
    height: 3,
    width: "20%",
    backgroundColor: "#fff",
    marginTop: 8,
    borderRadius: 2,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  subtext: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 10,
  },
  menuContainer: {
    padding: 20,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  securityCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  securityLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  securityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  securityDescription: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  pinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    marginTop: 8,
  },
  pinButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pinButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    margin: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 10,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
    marginLeft: 8,
  },
});