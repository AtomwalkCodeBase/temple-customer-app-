import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="PanchangScreen/index" />
        <Stack.Screen name="screens/Choose-login" />
        <Stack.Screen name="screens/BookSevaScreen" />
        <Stack.Screen name="screens/Forgot-pin" />
        <Stack.Screen name="screens/Login" />
        <Stack.Screen name="screens/MyBookings" />
        <Stack.Screen name="screens/Pin-login" />
        <Stack.Screen name="screens/PopUp" />
        <Stack.Screen name="screens/Register" />
        <Stack.Screen name="screens/Reset-pin" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f6f9",
  },
});
