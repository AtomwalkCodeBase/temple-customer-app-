import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ToastMsg from "../../components/ToastMsg";
import { cancelBooking, getPaymentStatus, processBooking } from "../../services/productService";

const PaymentOptionsModal = ({
  visible,
  onBack,
  onPaymentComplete,
  selectedService,
  selectedVariation,
  selectedDate,
}) => {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const paymentMethods = [
    { 
      id: "upi", 
      name: "UPI", 
      icon: "phone-portrait-outline",
      description: "Google Pay, PhonePe & more",
    },
    { 
      id: "card", 
      name: "Credit / Debit Card", 
      icon: "card-outline",
      description: "Visa, Mastercard, RuPay",
    },
    { 
      id: "netbanking", 
      name: "Net Banking", 
      icon: "business-outline",
      description: "All major banks",
    },
    { 
      id: "wallet", 
      name: "Wallets", 
      icon: "wallet-outline",
      description: "Paytm, Amazon Pay",
    },
  ];

  const formatDateForAPI = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const months = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleConfirm = async () => {
  if (!selected) {
    ToastMsg("Please select a payment method", "error");
    return;
  }
  if (!selectedDate || !selectedVariation || !selectedService) {
    ToastMsg("Missing booking details", "error");
    return;
  }

  try {
    setLoading(true);
    const customer_refcode = await AsyncStorage.getItem("ref_code");

    const bookingData = {
      cust_ref_code: customer_refcode,
      call_mode: "ADD_BOOKING",
      service_variation_id: selectedVariation.id,
      booking_date: formatDateForAPI(selectedDate),
      end_date: formatDateForAPI(selectedDate),
      start_time: selectedVariation.start_time,
      end_time: selectedVariation.end_time,
      notes: `Booking for ${selectedService.name}`,
      quantity: 1,
      duration: selectedService.duration_minutes || 60,
      unit_price: parseFloat(selectedVariation.base_price),
    };

    // Step 1️⃣: Create booking
    const response = await processBooking(bookingData);

    // ✅ Handle both axios & fetch-style responses
    const bookingRefCode =
      response?.data?.booking_ref_code || response?.booking_ref_code || null;

    if (bookingRefCode) {
      ToastMsg("Booking created. Checking payment status...", "info");

      // Step 2️⃣: Verify payment
      const paymentResponse = await getPaymentStatus(bookingRefCode);

      // Handle axios/fetch structures safely
      const paymentData = paymentResponse?.data || paymentResponse;
      const paymentStatus = paymentData?.payment?.status;
      const transactionId = paymentData?.payment?.transaction_id;

      if (!paymentStatus) {
        ToastMsg("Payment status unavailable.", "error");
        onBack(false);
        return;
      }

      if (paymentStatus === "S") {
        ToastMsg("Payment successful! Booking confirmed.", "success");
        onPaymentComplete('success', bookingRefCode);
      } else if (paymentStatus === "F" || paymentStatus === "P") {
        const message =
          paymentStatus === "F"
            ? "Payment failed. Cancelling booking..."
            : "Payment pending. Cancelling booking...";
        ToastMsg(message, "error");

        const cancelData = {
          cust_ref_code: customer_refcode,
          call_mode: "CANCEL",
          booking_ref_code: bookingRefCode,
          remarks:
            paymentStatus === "F"
              ? "Payment failed automatically"
              : "Payment pending automatically",
        };

        try {
          const cancelRes = await cancelBooking(cancelData);
          ToastMsg("Booking cancelled due to payment issue.", "warning");
        } catch (cancelErr) {
          console.error("Error cancelling booking:", cancelErr);
          ToastMsg("Failed to cancel booking automatically.", "error");
        }
        onPaymentComplete('failed', bookingRefCode);
      } else {
        ToastMsg("Unknown payment status. Please contact support.", "error");
        onPaymentComplete('failed', bookingRefCode);
      }
    } else {
      ToastMsg("Failed to process booking.", "error");
      onBack(false);
    }
  } catch (err) {
    console.error("❌ Error in handleConfirm:", err);
    ToastMsg("Something went wrong while processing booking.", "error");
    onBack(false);
  } finally {
    setLoading(false);
  }
};



  // Pricing calculation
  const basePrice = parseFloat(selectedVariation?.base_price || 0);
  const discount = 0;
  const platformFee = 0;
  const total = basePrice - discount + platformFee;

  const formatDate = (dateString) => {
    if (!dateString) return "Not selected";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <StatusBar backgroundColor="#E88F14" barStyle="dark-content" />
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            
            onPress={() => onBack(null)}
          >
            <Ionicons name="arrow-back" size={20} color="#000" />
          </Pressable>
          <Text style={styles.title}>Payment</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Total Amount Section below header */}
        <View style={styles.totalSection}>
          <View style={styles.totalContainer}>
            <View style={styles.totalLeft}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowPricing(!showPricing)}
              >
                <Ionicons 
                  name={showPricing ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
          </View>

          {/* Pricing Details Dropdown */}
          {showPricing && (
            <View style={styles.pricingDetails}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Service Price</Text>
                <Text style={styles.pricingValue}>₹{basePrice.toFixed(2)}</Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Discount</Text>
                <Text style={[styles.pricingValue, styles.discountValue]}>
                  -₹{discount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Platform Fee</Text>
                <Text style={styles.pricingValue}>₹{platformFee.toFixed(2)}</Text>
              </View>
              <View style={styles.pricingDivider} />
              <View style={styles.pricingRow}>
                <Text style={styles.pricingTotalLabel}>Total Amount</Text>
                <Text style={styles.pricingTotalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Content Area */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Payment Methods */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionHeader}>Payment Methods</Text>
            
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentItem,
                  selected === method.id && styles.paymentItemSelected
                ]}
                onPress={() => setSelected(method.id)}
              >
                <View style={styles.paymentLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={method.icon} size={18} color="#666" />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentName}>{method.name}</Text>
                    <Text style={styles.paymentDescription}>{method.description}</Text>
                  </View>
                </View>
                
                <View style={[
                  styles.radio,
                  selected === method.id && styles.radioSelected
                ]}>
                  {selected === method.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.securityText}>
              Your payment is secure and encrypted
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.payButton,
              selected && !loading && styles.payButtonActive
            ]}
            disabled={!selected || loading}
            onPress={handleConfirm}
          >
            {loading ? (
              <Text style={styles.payButtonText}>Processing...</Text>
            ) : (
              <Text style={styles.payButtonText}>
                {selected ? `Pay ₹${total.toFixed(2)}` : 'Select Payment Method'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FFF",
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  placeholder: {
    width: 28,
  },
  totalSection: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginRight: 12,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#E88F14",
  },
  pricingDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pricingLabel: {
    fontSize: 13,
    color: "#666",
  },
  pricingValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000",
  },
  discountValue: {
    color: "#10B981",
  },
  pricingDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  pricingTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  pricingTotalValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E88F14",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summarySection: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  summaryDetails: {
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
  },
  paymentSection: {
    marginBottom: 20,
  },
  paymentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  paymentItemSelected: {
    backgroundColor: "transparent",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginBottom: 2,
  },
  paymentDescription: {
    fontSize: 12,
    color: "#666",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: "#E88F14",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E88F14",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  securityText: {
    fontSize: 12,
    color: "#065F46",
    marginLeft: 6,
    fontWeight: "500",
  },
  footer: {
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  payButton: {
    backgroundColor: "#E5E7EB",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  payButtonActive: {
    backgroundColor: "#E88F14",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});

export default PaymentOptionsModal;