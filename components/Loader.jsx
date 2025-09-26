import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const Loader = ({ 
  size = 100, 
  color = '#8B5CF6', 
  text = 'Loading...',
  showText = true 
}) => {
  const spinValue = new Animated.Value(0);
  const pulseValue = new Animated.Value(0);

  // Rotation animation
  Animated.loop(
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ).start();

  // Pulse animation
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseValue, {
        toValue: 0,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  ).start();

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulse = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.3],
  });

  const glow = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.loaderContainer, { width: size * 1.5, height: size * 1.5 }]}>
        {/* Outer Ring */}
        <Animated.View
          style={[
            styles.outerRing,
            {
              width: size,
              height: size,
              borderColor: color,
              transform: [{ rotate: spin }],
              shadowRadius: glow,
              shadowColor: color,
            },
          ]}
        />
        
        {/* Inner Orb */}
        <Animated.View
          style={[
            styles.innerOrb,
            {
              width: size * 0.4,
              height: size * 0.4,
              backgroundColor: color,
              transform: [{ scale: pulse }],
              shadowRadius: glow,
              shadowColor: color,
            },
          ]}
        />
        
        {/* Orbital Dots */}
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.orbitalDot,
              {
                width: size * 0.1,
                height: size * 0.1,
                backgroundColor: color,
                transform: [
                  { 
                    rotate: spinValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [`${index * 120}deg`, `${index * 120 + 360}deg`],
                    })
                  },
                  {
                    translateX: size * 0.35,
                  }
                ],
              },
            ]}
          />
        ))}
        
        {/* Central Glow */}
        <Animated.View
          style={[
            styles.centralGlow,
            {
              width: size * 0.2,
              height: size * 0.2,
              backgroundColor: color,
              opacity: pulseValue,
              transform: [{ scale: pulse }],
            },
          ]}
        />
      </View>
      
      {showText && (
        <Animated.Text
          style={[
            styles.loadingText,
            {
              color: color,
              opacity: pulseValue,
              transform: [{ scale: pulse }],
            },
          ]}
        >
          {text}
        </Animated.Text>
      )}
    </View>
  );
};

const HolographicLoader = ({ 
  size = 120, 
  colors = ['#8B5CF6', '#06B6D4', '#10B981'],
  text = 'Initializing...' 
}) => {
  const rotateValue = new Animated.Value(0);

  Animated.loop(
    Animated.timing(rotateValue, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ).start();

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.holoContainer}>
      <View style={[styles.holoLoader, { width: size, height: size }]}>
        {/* Holographic Rings */}
        {colors.map((color, index) => (
          <Animated.View
            key={index}
            style={[
              styles.holoRing,
              {
                width: size - (index * 20),
                height: size - (index * 20),
                borderColor: color,
                transform: [{ rotate }],
                borderWidth: 2 + index,
              },
            ]}
          />
        ))}
        
        {/* Scanning Beam */}
        <Animated.View
          style={[
            styles.scanBeam,
            {
              transform: [
                { rotate },
                { translateX: size / 2 - 10 },
              ],
            },
          ]}
        />
        
        {/* Center Dot */}
        <View style={styles.centerDot} />
      </View>
      
      <Text style={styles.holoText}>{text}</Text>
      
      {/* Progress Dots */}
      <View style={styles.progressDots}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: colors[index],
                opacity: rotateValue.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: [0.3, 1, 0.3, 0.3],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 100,
    borderStyle: 'dashed',
    shadowOpacity: 0.8,
  },
  innerOrb: {
    position: 'absolute',
    borderRadius: 50,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
  },
  orbitalDot: {
    position: 'absolute',
    borderRadius: 50,
  },
  centralGlow: {
    position: 'absolute',
    borderRadius: 50,
    shadowOpacity: 0.8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '300',
    letterSpacing: 2,
  },
  holoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    margin: 20,
  },
  holoLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  holoRing: {
    position: 'absolute',
    borderRadius: 100,
    borderStyle: 'dotted',
    opacity: 0.7,
  },
  scanBeam: {
    position: 'absolute',
    width: 20,
    height: 3,
    backgroundColor: '#06B6D4',
    borderRadius: 2,
  },
  centerDot: {
    width: 12,
    height: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },
  holoText: {
    marginTop: 20,
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'System',
    fontWeight: '300',
    letterSpacing: 1,
  },
  progressDots: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

// Export both loader variants
export { HolographicLoader, Loader };
export default Loader;