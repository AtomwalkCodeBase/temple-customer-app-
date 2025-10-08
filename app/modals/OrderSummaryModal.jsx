// app/modals/OrderSummaryModal.jsx
import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const OrderSummaryModal = ({
  visible,
  onClose,
  onBack,
  selectedService,
  selectedVariation,
  selectedDate,
  onProceedToPayment,
}) => {
  const basePrice = parseFloat(selectedVariation?.base_price || 0);
  const discount = 0; // you can update logic later
  const platformFee = 0; // static fee example
  const quantity = selectedVariation?.quantity || 1; // default to 1 if not set
  const total = basePrice * quantity - discount + platformFee;


  const formatDate = (dateString) => {
    if (!dateString) return "Not selected";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#2D3436" />
              </TouchableOpacity>
              <Text style={styles.title}>Order Summary</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color="#666" />
            </Pressable>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Booking Info Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="calendar-outline" size={18} color="#E88F14" />
                <Text style={styles.cardTitle}>Booking Details</Text>
              </View>
              
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Service</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {selectedService?.name || "Not selected"}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Temple</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {selectedService?.temple_name || "Not selected"}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedDate)}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Time Slot</Text>
                  <Text style={styles.detailValue}>
                    {selectedVariation?.start_time && selectedVariation?.end_time 
                      ? `${selectedVariation.start_time} - ${selectedVariation.end_time}`
                      : "Not selected"
                    }
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {selectedService?.duration_minutes || "N/A"} minutes
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Capacity</Text>
                  <Text style={styles.detailValue}>
                    {selectedService?.capacity || "N/A"} people
                  </Text>
                </View>
              </View>
            </View>

            {/* Pricing Details Card */}
            <View style={[styles.card, styles.pricingCard]}>
              <View style={styles.cardHeader}>
                <Ionicons name="pricetag-outline" size={18} color="#E88F14" />
                <Text style={styles.cardTitle}>Payment Details</Text>
              </View>

              <View style={styles.pricingRows}>
                <View style={styles.pricingRow}>
                  <View style={styles.pricingLabelContainer}>
                    <Text style={styles.pricingLabel}>Base Price</Text>
                    <Text style={styles.pricingSubLabel}>
                      {selectedVariation?.pricing_type_str}
                    </Text>
                  </View>
                  <Text style={styles.pricingAmount}>₹{basePrice.toFixed(2)} {quantity > 1 && ` × ${quantity} = ₹${(basePrice * quantity).toFixed(2)}`}</Text>
                </View>
                
                <View style={styles.pricingRow}>
                  <View style={styles.pricingLabelContainer}>
                    <Text style={[styles.pricingLabel, styles.discountText]}>Discount</Text>
                    <Text style={styles.pricingSubLabel}>Special offer</Text>
                  </View>
                  <Text style={[styles.pricingAmount, styles.discountText]}>
                    - ₹{discount.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.pricingRow}>
                  <View style={styles.pricingLabelContainer}>
                    <Text style={styles.pricingLabel}>Platform Fee</Text>
                    <Text style={styles.pricingSubLabel}>Service charges</Text>
                  </View>
                  <Text style={styles.pricingAmount}>₹{platformFee.toFixed(2)}</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={[styles.pricingRow, styles.totalRow]}>
                  <View style={styles.pricingLabelContainer}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalSubLabel}>Inclusive of all taxes</Text>
                  </View>
                  <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.proceedButton}
            onPress={onProceedToPayment}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.proceedText}>Proceed to Payment</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  backButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  scroll: {
    padding: 20,
    paddingBottom: 10,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pricingCard: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FEF3C7",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailItem: {
    width: "48%",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 20,
  },
  pricingRows: {
    gap: 12,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  pricingLabelContainer: {
    flex: 1,
  },
  pricingLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  pricingSubLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  pricingAmount: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  discountText: {
    color: "#10B981",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  totalRow: {
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  totalSubLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E88F14",
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  secondaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  proceedButton: {
    backgroundColor: "#E88F14",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#E88F14",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  
  proceedText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },

  pricePill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pricePillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});

export default OrderSummaryModal;