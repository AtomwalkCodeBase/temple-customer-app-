import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { ImageBackground, Platform, StyleSheet, Text, View } from "react-native";
import Button from "./Button";

const Cards = ({
  // Common props
  type = "temple", // 'temple' or 'service'
  image,
  title,
  subtitle,
  rating,
  price,
  capacity,
  description,
  
  // Temple specific props
  location,
  email,
  timings = [],
  
  // Service specific props
  templeName,
  serviceType,
  
  // Action props
  onBookPress,
  onBookingDetailsPress, // New prop for booking details
  bookButtonText = "Book now",
  
  // Style props
  width,
  showRating = true,
  showPrice = true,
  
  // New props for booking details
  refCode, // Reference code to display
  showBookingDetailsButton = false, // Control visibility of booking details button
}) => {
  return (
    <View style={[styles.card, { width: width || '100%' }]}>
      {/* Image Section with Rating */}
      <ImageBackground source={{ uri: image }} style={styles.topImage}>
        {showRating && rating !== undefined && (
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.ratingText}>
              {typeof rating === 'number' ? rating.toFixed(1) : rating}
            </Text>
          </View>
        )}
        {type === "service" && (
          <LinearGradient 
            colors={['transparent', 'rgba(0,0,0,0.8)']} 
            style={styles.imageGradient}
          />
        )}
      </ImageBackground>

      <View style={styles.cardBody}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        
        {/* Subtitle - Temple name for services, Location for temples */}
        {type === "service" && templeName && (
          <Text style={styles.subtitle} numberOfLines={1}>{templeName}</Text>
        )}
        
        {type === "temple" && location && (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.meta} numberOfLines={2}>{location}</Text>
          </View>
        )}

        {/* Email (Temple only) */}
        {type === "temple" && email && (
          <View style={[styles.row, { marginTop: 6 }]}>
            <Ionicons name="mail-outline" size={14} color="#6b7280" />
            <Text style={styles.meta} numberOfLines={1}>{email}</Text>
          </View>
        )}

        {/* Description (Service only) */}
        {type === "service" && description && (
          <Text style={styles.description} numberOfLines={2}>{description}</Text>
        )}

        {/* Price and Capacity (Service only) */}
        {type === "service" && (showPrice || capacity) && (
          <View style={styles.priceCapacityContainer}>
            {showPrice && price !== undefined && (
              <Text style={styles.priceText}>
                {parseFloat(price) === 0 ? "Free" : `₹${parseFloat(price).toFixed(2)}`}
              </Text>
            )}
            {capacity && (
              <Text style={styles.capacityText}>Capacity: {capacity}</Text>
            )}
          </View>
        )}

        {/* Timings (Temple only) */}
        {type === "temple" && timings.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Temple Timings</Text>
            <View style={styles.chips}>
              {timings.slice(0, 2).map((timing, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>{timing}</Text>
                </View>
              ))}
              {timings.length > 2 && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>+{timings.length - 2} more</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Booking Details Button (Top right corner) */}
        {showBookingDetailsButton && onBookingDetailsPress && (
          <View style={styles.bookingDetailsContainer}>
            <Button 
              title="Booking Details" 
              onPress={onBookingDetailsPress}
              size="small"
              variant="outline"
              style={styles.bookingDetailsButton}
            />
          </View>
        )}

        {/* Book Button */}
        <Button 
          title={bookButtonText} 
          onPress={onBookPress}
          size="medium"
          style={{ marginTop: type === "service" ? 8 : 12 }}
        />

        {/* Reference Code */}
        {refCode && (
          <Text style={styles.refCode}>Ref: {refCode}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 0,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  topImage: {
    width: '100%',
    height: 120,
    overflow: 'hidden',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 70,
    height: 50,
  },
  ratingPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4a6da7',
    marginBottom: 8,
    fontWeight: '500',
  },
  row: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    flex: 1,
    color: '#6b7280',
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  priceCapacityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  capacityText: {
    fontSize: 14,
    color: '#888',
  },
  sectionLabel: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
  },
  chips: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
  },
  chipText: {
    color: '#4338ca',
    fontWeight: '700',
    fontSize: 12,
  },
  // New styles for booking details and reference code
  bookingDetailsContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  bookingDetailsButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refCode: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default Cards;