import { StyleSheet, Text, View } from 'react-native';

export default function Temples() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Temples</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center' }, text: { fontSize: 18 } });
