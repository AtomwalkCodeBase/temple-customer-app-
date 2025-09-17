// components/TextField.jsx
import { StyleSheet, TextInput, View } from 'react-native';

export default function TextField(props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        placeholderTextColor="#A68F7A"
        style={styles.input}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: 14 },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e6e8eb',
    backgroundColor: '#f7f8fa',
    fontSize: 16,
  },
});
