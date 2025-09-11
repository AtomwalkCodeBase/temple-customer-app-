import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router'; // ⬅️ added
import { useEffect, useState } from 'react';
import {
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import TextField from '../components/TextField';
import { customerLogin } from '../services/authService';

export default function LoginScreen() {
  const [mobile, setMobile] = useState('');
  const [secure, setSecure] = useState(true);
  const [pin, setPIN] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ⬅️ read params from router (e.g. /login?force=true)
  const { force } = useLocalSearchParams();

  useEffect(() => {
    (async () => {
      if (force === "true") return; // ⬅️ skip redirect if forced new login

      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        router.replace("/screens/choose-login"); 
      }
    })();
  }, [force]);

  async function handleLogin() {
    const mobileRegex = /^[0-9]{10}$/;

    if (!mobile && !pin) {
      setError('Please enter your mobile number and PIN');
      return;
    } else if (!mobile) {
      setError('Please enter your mobile number');
      return;
    } else if (!mobileRegex.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    } else if (!pin) {
      setError('Please enter your PIN');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await customerLogin(mobile, pin);

      // ✅ Save user & PIN in AsyncStorage
      await AsyncStorage.setItem("user", JSON.stringify(result));
      await AsyncStorage.setItem("userPin", pin);
      await AsyncStorage.setItem("biometric", "false"); // default false

      router.replace('/(tabs)');
    } catch (error) {
      setError(error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require('../assets/images/omBG.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <View style={styles.backCircle}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Center Box */}
        <View style={styles.centerContent}>
          <BlurView intensity={10} tint="light" style={styles.glassBox}>
            <View style={styles.body}>
              <Text style={styles.title}>Welcome back!</Text>
              <Text style={styles.subtitle}>Continue your spiritual journey</Text>

              <TextField
                placeholder="Enter your mobile number"
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={(text) => {
                  setMobile(text);
                  if (error) setError('');
                }}
              />

              <View style={styles.pinWrap}>
                <TextField
                  placeholder="Enter your PIN"
                  secureTextEntry={secure}
                  value={pin}
                  onChangeText={(text) => {
                    setPIN(text);
                    if (error) setError('');
                  }}
                />
                <TouchableOpacity
                  style={styles.eye}
                  onPress={() => setSecure(!secure)}
                >
                  <Ionicons
                    name={secure ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>

              {/* 🔹 Error message */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity onPress={() => router.push('/forgot-pin')}>
                <Text style={styles.forgot}>Forgot PIN?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#eacc0cff', '#dc6326ff']}
                  style={styles.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.primaryText}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.registerLine}>
                Don’t have an account?{' '}
                <Text
                  style={styles.registerLink}
                  onPress={() => router.replace('/register')}
                >
                  Create Account Now
                </Text>
              </Text>
            </View>
          </BlurView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1 },
  back: { padding: 16, position: 'absolute', top: 10, left: 10, zIndex: 1 },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBox: {
    width: '88%',
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#eacc0cb3',
    overflow: 'hidden',
  },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  body: { width: '100%' },
  title: {
    fontSize: 30,
    fontWeight: '1000',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  pinWrap: { position: 'relative' },
  eye: { position: 'absolute', right: 14, top: 1, height: 52, justifyContent: 'center' },
  forgot: { marginTop: 10, textAlign: 'center', color: '#6b7280' },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  primaryBtn: {
    marginTop: 18,
    borderRadius: 16,
    height: 56,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#121417',
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  registerLine: { marginTop: 20, textAlign: 'center', color: '#6B7280' },
  registerLink: { color: '#12a4a6', fontWeight: '700' },
});
