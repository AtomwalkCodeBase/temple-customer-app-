import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { customerForgotPin } from '../../services/authService';

export default function ForgotPinScreen() {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPin, setNewPin] = useState(null);

  async function handleResetPin() {
    if (!mobile) {
      Alert.alert('Missing info', 'Please enter your registered mobile number');
      return;
    }

    setLoading(true);
    try {
      const result = await customerForgotPin(mobile);
      setNewPin(result.e_pin);
    } catch (error) {
      Alert.alert('Reset Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require('../../assets/images/omBG.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <BlurView intensity={50} tint="light" style={styles.glassBox}>
            <View style={styles.body}>
              <Text style={styles.title}>Reset PIN</Text>
              <Text style={styles.subtitle}>Get a new PIN via email</Text>

              {!newPin ? (
                <>
                  <TextField
                    placeholder="Enter your registered mobile number"
                    keyboardType="phone-pad"
                    value={mobile}
                    onChangeText={setMobile}
                  />
                  <Button
                    title="Reset PIN"
                    onPress={handleResetPin}
                    width="100%"
                  />
                </>
              ) : (
                <View style={styles.pinContainer}>
                  <Text style={styles.pinText}>Your new PIN:</Text>
                  <Text style={styles.pinValue}>{newPin}</Text>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.replace('/screens/Login')}
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
  glassBox: {
    width: '90%',
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // fallback for Android
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
    color: '#6B1E1E',
  },
  subtitle: {
    fontSize: 16,
    color: '#C25B3C',
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
  pinContainer: { alignItems: 'center', marginTop: 20 },
  pinText: { fontSize: 16, color: '#6B7280', marginBottom: 10 },
  pinValue: { fontSize: 28, fontWeight: '700', color: '#12a4a6' },
});
