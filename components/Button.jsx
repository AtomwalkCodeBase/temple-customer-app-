import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Button({
  onPress,
  title = "Book now",
  size = "large",
  loading = false,
  disabled = false,
  colors = ["#eacc0cff", "#dc6326ff"],
  style,
  textStyle,
  borderRadius,
  width,
  loadingText,
  marginTop,
  variant = "filled",
  showLoadingText = false,
}) {
  const displayText = loading ? (loadingText || title) : title;

  // Helper function to get size-based styles
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          height: 40,
          fontSize: 14,
          borderRadius: borderRadius || 12,
          marginTop: marginTop !== undefined ? marginTop : 14,
        };
      case "medium":
        return {
          height: 40,
          fontSize: 14,
          borderRadius: borderRadius || 12,
          marginTop: marginTop !== undefined ? marginTop : 12,
        };
      case "large":
      default:
        return {
          height: 56,
          fontSize: 17,
          borderRadius: borderRadius || 16,
          marginTop: marginTop !== undefined ? marginTop : 18,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  if (variant === "outline") {
    return (
      <View style={[
        styles.outlineGradient,
        { 
          borderRadius: sizeStyles.borderRadius,
          width: width || 'auto',
          marginTop: sizeStyles.marginTop,
        }
      ]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientBase,
            { borderRadius: sizeStyles.borderRadius }
          ]}
        >
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled || loading}
            style={[
              styles.outlineBtnInner,
              { 
                borderRadius: Math.max(sizeStyles.borderRadius - 2, 8),
                height: sizeStyles.height,
              }
            ]}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors[1] || "#000"} />
                {showLoadingText && (
                  <Text style={[
                    styles.outlineText,
                    { fontSize: sizeStyles.fontSize },
                    textStyle,
                    { marginLeft: 8 }
                  ]}>
                    {displayText}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={[
                styles.outlineText,
                { fontSize: sizeStyles.fontSize },
                textStyle
              ]}>
                {displayText}
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.bookBtn,
        { 
          borderRadius: sizeStyles.borderRadius,
          width: width || 'auto',
          marginTop: sizeStyles.marginTop,
          height: sizeStyles.height,
        },
        size !== "small" && styles.shadow,
        style,
        disabled && { opacity: 0.6 }
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradientBackground,
          { borderRadius: sizeStyles.borderRadius }
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#FFF" />
            {showLoadingText && (
              <Text style={[
                styles.bookText,
                { fontSize: sizeStyles.fontSize },
                textStyle,
                { marginLeft: 8 }
              ]}>
                {displayText}
              </Text>
            )}
          </View>
        ) : (
          <Text style={[
            styles.bookText,
            { fontSize: sizeStyles.fontSize },
            textStyle
          ]}>
            {displayText}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bookBtn: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shadow: {
    elevation: 3,
    shadowColor: "#121417",
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  gradientBackground: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  bookText: {
    fontWeight: "700",
    color: "#ffffff",
  },
  outlineGradient: {
    overflow: "hidden",
  },
  gradientBase: {
    width: "100%",
    height: "100%",
  },
  outlineBtnInner: {
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  outlineText: {
    color: "#121417",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});