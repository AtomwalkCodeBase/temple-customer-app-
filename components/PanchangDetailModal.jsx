// components/PanchangDetailModal.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PanchangDetailModal = ({
  modalVisible,
  setModalVisible,
  selectedDate,
  panchangData,
  formatDate,
}) => {
  const [isNotified, setIsNotified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarPermission, setCalendarPermission] = useState(false);

  // Check if this date is already in notifications
  useEffect(() => {
    checkNotificationStatus();
  }, [selectedDate, modalVisible]);

  const checkNotificationStatus = async () => {
    try {
      const notifications = await AsyncStorage.getItem(
        "panchang_notifications",
      );
      if (notifications) {
        const parsed = JSON.parse(notifications);
        const dateKey = selectedDate.toDateString();
        setIsNotified(!!parsed[dateKey]);
      }
    } catch (error) {
      console.error("Error checking notification status:", error);
    }
  };

  // Request calendar permissions
  const requestCalendarPermissions = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    setCalendarPermission(status === "granted");
    return status === "granted";
  };

  // Create calendar event in Google Calendar
  const createCalendarEvent = async () => {
    try {
      const hasPermission = await requestCalendarPermissions();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Please grant calendar access to add events",
        );
        return false;
      }

      // Get default calendar (usually Google Calendar)
      const calendars = await Calendar.getCalendarsAsync();
      const defaultCalendar =
        calendars.find(
          (cal) => cal.allowsModifications && cal.source.name === "Google",
        ) || calendars.find((cal) => cal.allowsModifications);

      if (!defaultCalendar) {
        Alert.alert("Error", "No writable calendar found");
        return false;
      }

      // Create event details
      const eventDetails = {
        title: `Panchang - ${formatDate(selectedDate)}`,
        startDate: selectedDate,
        endDate: new Date(selectedDate.getTime() + 30 * 60000), // 30 minutes duration
        notes: generateEventNotes(),
        alarms: [{ relativeOffset: -60 }], // Alert 1 hour before
        timeZone: "Asia/Kolkata",
      };

      const eventId = await Calendar.createEventAsync(
        defaultCalendar.id,
        eventDetails,
      );
      return eventId;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      Alert.alert("Error", "Failed to create calendar event");
      return false;
    }
  };

  // Generate detailed notes for the calendar event
  const generateEventNotes = () => {
    if (!panchangData) return "Panchang details not available";

    let notes = `Panchang Details for ${formatDate(selectedDate)}\n\n`;
    notes += `Tithi: ${panchangData.tithi || "N/A"}\n`;
    notes += `Nakshatra: ${panchangData.nakshatra || "N/A"}\n`;
    notes += `Sunrise: ${panchangData.sunrise || "N/A"}\n`;
    notes += `Sunset: ${panchangData.sunset || "N/A"}\n`;

    if (panchangData.yoga) notes += `Yoga: ${panchangData.yoga}\n`;
    if (panchangData.karana) notes += `Karana: ${panchangData.karana}\n`;
    if (panchangData.moonrise) notes += `Moonrise: ${panchangData.moonrise}\n`;
    if (panchangData.moonset) notes += `Moonset: ${panchangData.moonset}\n`;

    if (panchangData.festivals && panchangData.festivals.length > 0) {
      notes += `\nFestivals: ${panchangData.festivals.join(", ")}\n`;
    }

    if (panchangData.muhurats && panchangData.muhurats.length > 0) {
      notes += `\nAuspicious Timings:\n`;
      panchangData.muhurats.forEach((muhurat) => {
        notes += `• ${muhurat}\n`;
      });
    }

    return notes;
  };

  // Save notification to AsyncStorage
  const saveNotificationToStorage = async (eventId = null) => {
    try {
      const notifications = await AsyncStorage.getItem(
        "panchang_notifications",
      );
      const parsed = notifications ? JSON.parse(notifications) : {};

      const dateKey = selectedDate.toDateString();
      parsed[dateKey] = {
        date: selectedDate.toISOString(),
        panchangData: panchangData,
        notifiedAt: new Date().toISOString(),
        calendarEventId: eventId,
      };

      await AsyncStorage.setItem(
        "panchang_notifications",
        JSON.stringify(parsed),
      );
      setIsNotified(true);
    } catch (error) {
      console.error("Error saving notification:", error);
      throw error;
    }
  };

  // Remove notification from AsyncStorage
  const removeNotificationFromStorage = async () => {
    try {
      const notifications = await AsyncStorage.getItem(
        "panchang_notifications",
      );
      if (notifications) {
        const parsed = JSON.parse(notifications);
        const dateKey = selectedDate.toDateString();

        // Get event ID before deleting
        const eventId = parsed[dateKey]?.calendarEventId;

        // Delete from calendar if exists
        if (eventId && calendarPermission) {
          try {
            await Calendar.deleteEventAsync(eventId);
          } catch (error) {
            console.error("Error deleting calendar event:", error);
          }
        }

        delete parsed[dateKey];
        await AsyncStorage.setItem(
          "panchang_notifications",
          JSON.stringify(parsed),
        );
        setIsNotified(false);
      }
    } catch (error) {
      console.error("Error removing notification:", error);
      throw error;
    }
  };

  // Handle notify button press
  const handleNotifyPress = async () => {
    if (!panchangData) {
      Alert.alert("Error", "No panchang data available for this date");
      return;
    }

    setIsLoading(true);
    try {
      if (isNotified) {
        // Remove notification
        await removeNotificationFromStorage();
        Alert.alert("Success", "Notification removed successfully");
      } else {
        // Add notification with Google Calendar sync
        const eventId = await createCalendarEvent();

        if (eventId) {
          await saveNotificationToStorage(eventId);
          Alert.alert(
            "Success",
            "Event added to your Google Calendar. You will receive notifications from Google Calendar.",
          );
        } else {
          // Save locally even if calendar fails
          await saveNotificationToStorage();
          Alert.alert(
            "Success",
            "Notification saved locally. To get Google Calendar notifications, please grant calendar permissions.",
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process notification request");
    } finally {
      setIsLoading(false);
    }
  };

  // View all notifications
  const viewAllNotifications = async () => {
    try {
      const notifications = await AsyncStorage.getItem(
        "panchang_notifications",
      );
      if (notifications) {
        const parsed = JSON.parse(notifications);
        const count = Object.keys(parsed).length;
        Alert.alert(
          "Notifications",
          `You have ${count} active notification(s)`,
        );
      } else {
        Alert.alert("Notifications", "No active notifications");
      }
    } catch (error) {
      console.error("Error viewing notifications:", error);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{formatDate(selectedDate)}</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={viewAllNotifications}
                style={styles.headerButton}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#5e3c19"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#5e3c19" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalBody}>
            {panchangData ? (
              <>
                {/* Notify Me Button */}
                <TouchableOpacity
                  style={[
                    styles.notifyButton,
                    isNotified && styles.notifyButtonActive,
                  ]}
                  onPress={handleNotifyPress}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name={
                          isNotified ? "notifications" : "notifications-outline"
                        }
                        size={20}
                        color="#fff"
                        style={styles.notifyIcon}
                      />
                      <Text style={styles.notifyButtonText}>
                        {isNotified ? "Remove Notification" : "Notify Me"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    Tithi & Nakshatra
                  </Text>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Tithi:</Text>
                    <Text style={styles.modalInfoValue}>
                      {panchangData.tithi || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Nakshatra:</Text>
                    <Text style={styles.modalInfoValue}>
                      {panchangData.nakshatra || "N/A"}
                    </Text>
                  </View>
                  {panchangData.yoga && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Yoga:</Text>
                      <Text style={styles.modalInfoValue}>
                        {panchangData.yoga}
                      </Text>
                    </View>
                  )}
                  {panchangData.karana && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Karana:</Text>
                      <Text style={styles.modalInfoValue}>
                        {panchangData.karana}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Timings</Text>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Sunrise:</Text>
                    <Text style={styles.modalInfoValue}>
                      {panchangData.sunrise || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Sunset:</Text>
                    <Text style={styles.modalInfoValue}>
                      {panchangData.sunset || "N/A"}
                    </Text>
                  </View>
                  {panchangData.moonrise && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Moonrise:</Text>
                      <Text style={styles.modalInfoValue}>
                        {panchangData.moonrise}
                      </Text>
                    </View>
                  )}
                  {panchangData.moonset && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Moonset:</Text>
                      <Text style={styles.modalInfoValue}>
                        {panchangData.moonset}
                      </Text>
                    </View>
                  )}
                </View>

                {panchangData.festivals &&
                  panchangData.festivals.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Festivals</Text>
                      {panchangData.festivals.map((festival, index) => (
                        <View key={index} style={styles.modalFestivalItem}>
                          <Ionicons name="star" size={16} color="#E88F14" />
                          <Text style={styles.modalFestivalText}>
                            {festival}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                {panchangData.muhurats && panchangData.muhurats.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Muhurats</Text>
                    {panchangData.muhurats.map((muhurat, index) => (
                      <View key={index} style={styles.modalInfoRow}>
                        <Ionicons
                          name="time"
                          size={16}
                          color="#E88F14"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.modalInfoValue}>{muhurat}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.modalNoData}>
                No details available for this date
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5e3c19",
    flex: 1,
    marginRight: 16,
  },
  modalBody: {
    padding: 20,
  },
  notifyButton: {
    backgroundColor: "#E88F14",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  notifyButtonActive: {
    backgroundColor: "#d32f2f", // Red for remove
  },
  notifyIcon: {
    marginRight: 8,
  },
  notifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E88F14",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
    paddingBottom: 8,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontSize: 16,
    color: "#7e5c3a",
    fontWeight: "500",
    flex: 1,
  },
  modalInfoValue: {
    fontSize: 16,
    color: "#5e3c19",
    fontWeight: "bold",
    textAlign: "right",
    flex: 1,
  },
  modalFestivalItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalFestivalText: {
    fontSize: 16,
    color: "#5e3c19",
    marginLeft: 8,
  },
  modalNoData: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    padding: 20,
  },
});

export default PanchangDetailModal;
