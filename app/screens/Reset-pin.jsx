import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../../components/Button";
import Header from "../../components/Header";
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

    if (!oldPin || !newPin || !confirmPin) {
      setError("Please fill all fields");
      return;
    }
    if (newPin !== confirmPin) {
      setError("New PIN and Confirm PIN do not match");
      return;
    }
    if (newPin === oldPin) {
      setError("Old PIN and New PIN cannot be same");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await customerSetPin(parseInt(userData, 10), oldPin, newPin);
      if (res?.status === 200) {
        ToastMsg("PIN updated successfully", "success");
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#e88f14" />
      <View style={styles.wrapper}>
        <Header
          type="type3"
          title="Update PIN"
          showBackButton={true}
          searchVisible={false}
          onBackPress={() => router.back()}
          centerTitle={true}
        />
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Update PIN</Text>
        <Text style={styles.subtitle}>
          Secure your account with a new PIN
        </Text>
        <Text style={styles.inputTitle}>Current PIN</Text>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Enter Current PIN"
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

        <Text style={styles.inputTitle}>New PIN</Text>
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

        <Text style={styles.inputTitle}>Confirm New PIN</Text>
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Update PIN"
          onPress={handleSetPin}
          size="large"
          width="100%"
        />

        <Button
          title="Cancel"
          onPress={() => router.back()}
          size="large"
          width="100%"
          variant="outline"
        />

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  wrapper:{
    paddingTop: 5,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#C25B3C",
    marginBottom: 6,
    textAlign: "center",
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#C25B3C",
    marginBottom: 20,
    textAlign: "center",
    paddingBottom: 10,
  },
  inputTitle: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#eacc0cff",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
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