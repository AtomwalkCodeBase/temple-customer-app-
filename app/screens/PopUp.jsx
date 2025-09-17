import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";

export default function PopUp({ isVisible, onYes, onNo, message }) {
  return (
    <Modal isVisible={isVisible} animationIn="zoomIn" animationOut="zoomOut">
      <View style={styles.popupContainer}>
        {/* Close Icon */}
        <TouchableOpacity style={styles.closeButton} onPress={onNo}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>

        {/* Fingerprint Icon */}
        <Ionicons
          name="finger-print"
          size={60}
          color="#E88F14"
          style={{ marginBottom: 20 }}
        />

        {/* Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.yesButton]} onPress={onYes}>
            <Text style={styles.buttonText}>YES</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.noButton]} onPress={onNo}>
            <Text style={styles.buttonText}>NO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
