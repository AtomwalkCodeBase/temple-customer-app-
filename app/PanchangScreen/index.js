import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function PanchangScreen() {
  return (
	<SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
		<View style={styles.statusBarBackground} />
			  <StatusBar style="light" />
	  <Text>panchangScreen</Text>
	</SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
	flex: 1,
	backgroundColor: '#f2f6f9',
  },
  statusBarBackground: {
	height: 40, // fallback for iOS, dynamic height can be added with useSafeAreaInsets
	backgroundColor: '#E88F14',
	width: '100%',
	position: 'absolute',
	top: 0,
	left: 0,
  },
});