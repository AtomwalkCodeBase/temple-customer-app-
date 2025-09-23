import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ToastMsg from '../../components/ToastMsg';

export default function TabLayout() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.statusBarBackground} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#e88f14',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Services',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="event" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="temples"
          options={{
            title: 'Temples',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="temple-hindu" color={color} size={size} />
            ),
          }}
        />
        {/* <Tabs.Screen
          name="my-booking"
          options={{
            title: 'My Bookings',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="calendar-check" color={color} size={size} />
            ),
          }}
        /> */}
        
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
      <ToastMsg/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6f9',
  },
  statusBarBackground: {
    height: Platform.OS === "android" ? StatusBar.currentHeight : 44,
    backgroundColor: '#E88F14',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
