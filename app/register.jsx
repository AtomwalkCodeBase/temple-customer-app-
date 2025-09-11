// app/register.jsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import TextField from '../components/TextField';
import { customerRegister } from '../services/authService';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [alternate, setAlternate] = useState('');
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState(null);
  const [error, setError] = useState('');

  async function onRegister() {
    const mobileRegex = /^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName || !mobile || !email) {
      setError('Please fill in all required fields');
      return;
    } else if (!mobileRegex.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    } else if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await customerRegister(fullName, mobile, email, alternate);
      setPin(result.pin);
    } catch (error) {
      setError(error.message || 'Something went wrong');
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
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <View style={styles.backCircle}>
            <Ionicons name="chevron-back" size={22} color="#ffff" />
          </View>
        </TouchableOpacity>

        <View style={styles.centerContent}>
          <BlurView intensity={10} tint="light" style={styles.glassBox}>
            <View style={styles.body}>
              {!pin ? (
                <>
                  <Text style={styles.title}>Join Temple Connect</Text>
                  <Text style={styles.subtitle}>
                    Begin your spiritual journey with us
                  </Text>

                  <TextField
                    placeholder="Full Name"
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      if (error) setError('');
                    }}
                  />
                  <TextField
                    placeholder="Mobile Number"
                    keyboardType="phone-pad"
                    value={mobile}
                    onChangeText={(text) => {
                      setMobile(text);
                      if (error) setError('');
                    }}
                  />
                  <TextField
                    placeholder="Email Address"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) setError('');
                    }}
                  />
                  <TextField
                    placeholder="Alternate Contact (Optional)"
                    keyboardType="phone-pad"
                    value={alternate}
                    onChangeText={setAlternate}
                  />

                  {/* 🔹 Error message */}
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={onRegister}
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
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <Text style={styles.registerLine}>
                    Already have an account?{' '}
                    <Text
                      style={styles.registerLink}
                      onPress={() => router.replace('/login')}
                    >
                      Sign In Here
                    </Text>
                  </Text>
                </>
              ) : (
                <View style={styles.pinContainer}>
                  <Text style={styles.pinText}>Your PIN:</Text>
                  <Text style={styles.pinValue}>{pin}</Text>
                  <Text style={styles.welcomeText}>Welcome to the journey..!</Text>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.replace('/login')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#eacc0cff', '#dc6326ff']}
                      style={styles.primaryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.primaryText}>Back to Login</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
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
    fontWeight: '400',
    lineHeight: 24,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  primaryBtn: {
    marginTop: 18,
    borderRadius: 16,
    height: 56,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#121417',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    paddingLeft: 10,
    paddingRight: 10,
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  registerLine: { marginTop: 20, textAlign: 'center', color: '#6B7280' },
  registerLink: { color: '#12a4a6', fontWeight: '700' },
  pinContainer: { alignItems: 'center', marginTop: 20 },
  pinText: { fontSize: 16, color: '#6B7280', marginBottom: 10 },
  pinValue: { fontSize: 28, fontWeight: '700', color: '#12a4a6' },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});
