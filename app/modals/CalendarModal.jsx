import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

const CalendarModal = ({
  visible,
  onClose,
  onBack,
  selectedService,
  selectedVariation,
  loadingDates,
  markedDates,
  selectedDate,
  onDateSelect,
  onConfirmDate,
  bookingLoading,
  formatPrice,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { maxHeight: "90%" }]} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#2D3436" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Select Date</Text>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>
          <Text style={styles.serviceModalName}>
            {selectedService?.name} - {selectedVariation?.pricing_type_str}
          </Text>

          {loadingDates ? (
            <View style={styles.calendarLoading}>
              <ActivityIndicator size="large" color="#E88F14" />
              <Text style={styles.loadingText}>Checking availability...</Text>
            </View>
          ) : (
            <>
              <Calendar
                minDate={new Date().toISOString().split("T")[0]}
                onDayPress={onDateSelect}
                markedDates={{
                  ...markedDates,
                  ...(selectedDate && !markedDates[selectedDate]
                    ? {
                        [selectedDate]: {
                          selected: true,
                          selectedColor: "#E88F14",
                        },
                      }
                    : {}),
                }}
                theme={{
                  selectedDayBackgroundColor: "#E88F14",
                  todayTextColor: "#E88F14",
                  arrowColor: "#E88F14",
                  textDisabledColor: "#CCC",
                }}
                style={styles.calendar}
              />

              {/* Booking Summary */}
              {/* <View style={styles.bookingSummary}>
                <Text style={styles.summaryTitle}>Booking Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedDate
                      ? new Date(selectedDate).toLocaleDateString()
                      : "Not selected"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Time:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedVariation?.start_time} - {selectedVariation?.end_time}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Price:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedVariation
                      ? formatPrice(selectedVariation.base_price)
                      : "N/A"}
                  </Text>
                </View>
              </View> */}

              {/* Confirm Button */}
              <TouchableOpacity
                style={styles.confirmButton(
                  !selectedDate || markedDates[selectedDate]?.disabled || bookingLoading
                )}
                onPress={onConfirmDate}
                disabled={
                  !selectedDate ||
                  markedDates[selectedDate]?.disabled ||
                  bookingLoading
                }
              >
                {bookingLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Date</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
    leftHeader: {
    flexDirection: "row",
    alignItems: "center",
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
  },
  closeButton: {
    padding: 4,
  },
  serviceModalName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6C63FF",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  calendarLoading: {
    height: 350,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  calendar: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
  },
  bookingSummary: {
    backgroundColor: "#F8F9FA",
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3436",
  },
  confirmButton: (disabled) => ({
    backgroundColor: disabled ? "#CCC" : "#E88F14",
    padding: 16,
    borderRadius: 15,
    marginHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
  }),
  confirmButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default CalendarModal;
