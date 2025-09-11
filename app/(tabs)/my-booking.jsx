import { StyleSheet, Text, View } from 'react-native';

export default function Booking() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>My Bookings</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center' }, text: { fontSize: 18 } });
