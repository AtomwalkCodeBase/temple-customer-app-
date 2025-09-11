import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { customerSetPin } from "../../services/authService";

export default function ResetPin() {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const handleSetPin = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        Alert.alert("Error", "User not logged in");
        return;
      }

      const user = JSON.parse(userData);
      const res = await customerSetPin(user.customer_id, oldPin, newPin);

      if (res?.status === "success") {
        Alert.alert("Success", "PIN updated successfully");
        await AsyncStorage.setItem("userPin", newPin); // Save new PIN locally
        router.back();
      } else {
        Alert.alert("Failed", res?.message || "Could not update PIN");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set / Update PIN</Text>

      <TextInput
        placeholder="Enter Old PIN"
        secureTextEntry
        style={styles.input}
        value={oldPin}
        onChangeText={setOldPin}
      />

      <TextInput
        placeholder="Enter New PIN"
        secureTextEntry
        style={styles.input}
        value={newPin}
        onChangeText={setNewPin}
      />

      <TouchableOpacity style={styles.button} onPress={handleSetPin}>
        <Text style={styles.buttonText}>Update PIN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#4d88ff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
