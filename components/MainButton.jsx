import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function MainButton({
  title = "Button",
  onPress,
  loading = false,
  disabled = false,
  colors = ["#eacc0cff", "#dc6326ff"],
  style,
  textStyle,
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, style, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={colors}
        style={styles.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={[styles.primaryText, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryText: { color: "#fff", fontSize: 17, fontWeight: "700" },
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
  primaryGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
});
