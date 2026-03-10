// components/PanchangDetailModal.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import SunCalc from "suncalc";

// Constants
const RAHU_INDEX_MAP = [8, 2, 7, 5, 6, 4, 3]; // Sunday to Saturday
const FALLBACK_LOCATION = { latitude: 20.2961, longitude: 85.8245 }; // Odisha approx

const PanchangDetailModal = ({
  modalVisible,
  setModalVisible,
  selectedDate,
  panchangData,
  formatDate,
}) => {
  // State
  const [isNotified, setIsNotified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [calendarPermission, setCalendarPermission] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [localSunTimes, setLocalSunTimes] = useState(null);
  const [rahuKalam, setRahuKalam] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Memoized date key
  const dateKey = useMemo(
    () => selectedDate?.toDateString() || "",
    [selectedDate],
  );

  // Check notification status
  const checkNotificationStatus = useCallback(async () => {
    if (!dateKey) return;

    try {
      const notifications = await AsyncStorage.getItem(
        "panchang_notifications",
      );
      if (notifications) {
        const parsed = JSON.parse(notifications);
        setIsNotified(!!parsed[dateKey]);
      } else {
        setIsNotified(false);
      }
    } catch (error) {
      console.error("Error checking notification status:", error);
      setIsNotified(false);
    }
  }, [dateKey]);

  // Request calendar permissions
  const requestCalendarPermissions = useCallback(async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      setCalendarPermission(status === "granted");
      return status === "granted";
    } catch (error) {
      console.error("Error requesting calendar permission:", error);
      return false;
    }
  }, []);

  // Generate event notes
  const generateEventNotes = useCallback(() => {
    if (!panchangData) return "Panchang details not available";

    const notes = [
      `Panchang Details for ${formatDate(selectedDate)}\n`,
      `Tithi: ${panchangData.tithi || "N/A"}`,
      `Nakshatra: ${panchangData.nakshatra || "N/A"}`,
      `Sunrise: ${formatTime(localSunTimes?.sunrise) || panchangData.sunrise || "N/A"}`,
      `Sunset: ${formatTime(localSunTimes?.sunset) || panchangData.sunset || "N/A"}`,
    ];

    if (panchangData.yoga) notes.push(`Yoga: ${panchangData.yoga}`);
    if (panchangData.karana) notes.push(`Karana: ${panchangData.karana}`);
    if (panchangData.moonrise) notes.push(`Moonrise: ${panchangData.moonrise}`);
    if (panchangData.moonset) notes.push(`Moonset: ${panchangData.moonset}`);

    if (rahuKalam) {
      notes.push(
        `Rahu Kalam: ${formatTime(rahuKalam.start)} - ${formatTime(rahuKalam.end)}`,
      );
    }

    if (panchangData.festivals?.length > 0) {
      notes.push(`\nFestivals: ${panchangData.festivals.join(", ")}`);
    }

    if (panchangData.muhurats?.length > 0) {
      notes.push("\nAuspicious Timings:");
      panchangData.muhurats.forEach((muhurat) => notes.push(`• ${muhurat}`));
    }

    return notes.join("\n");
  }, [panchangData, selectedDate, formatDate, localSunTimes, rahuKalam]);

  // Create calendar event
  const createCalendarEvent = useCallback(async () => {
    try {
      const hasPermission = await requestCalendarPermissions();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Please grant calendar access to add events",
        );
        return false;
      }

      const calendars = await Calendar.getCalendarsAsync();
      const defaultCalendar = calendars.find(
        (cal) => cal.allowsModifications && cal.allowsModifications,
      );

      if (!defaultCalendar) {
        Alert.alert("Error", "No writable calendar found");
        return false;
      }

      const eventDetails = {
        title: `Panchang - ${formatDate(selectedDate)}`,
        startDate: selectedDate,
        endDate: new Date(selectedDate.getTime() + 30 * 60000),
        notes: generateEventNotes(),
        alarms: [{ relativeOffset: -60 }],
        timeZone: "Asia/Kolkata",
      };

      return await Calendar.createEventAsync(defaultCalendar.id, eventDetails);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      Alert.alert("Error", "Failed to create calendar event");
      return false;
    }
  }, [
    selectedDate,
    formatDate,
    generateEventNotes,
    requestCalendarPermissions,
  ]);

  // Save notification to storage
  const saveNotificationToStorage = useCallback(
    async (eventId = null) => {
      try {
        const notifications = await AsyncStorage.getItem(
          "panchang_notifications",
        );
        const parsed = notifications ? JSON.parse(notifications) : {};

        parsed[dateKey] = {
          date: selectedDate.toISOString(),
          panchangData,
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
    },
    [dateKey, selectedDate, panchangData],
  );

  // Remove notification from storage
  const removeNotificationFromStorage = useCallback(async () => {
    try {
      const notifications = await AsyncStorage.getItem(
        "panchang_notifications",
      );
      if (notifications) {
        const parsed = JSON.parse(notifications);
        const eventId = parsed[dateKey]?.calendarEventId;

        // Delete from calendar if exists and we have permission
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
  }, [dateKey, calendarPermission]);

  // Handle notify button press
  const handleNotifyPress = useCallback(async () => {
    if (!panchangData) {
      Alert.alert("Error", "No panchang data available for this date");
      return;
    }

    setIsLoading(true);
    try {
      if (isNotified) {
        await removeNotificationFromStorage();
        Alert.alert("Success", "Notification removed successfully");
      } else {
        const eventId = await createCalendarEvent();

        if (eventId) {
          await saveNotificationToStorage(eventId);
          Toast.show({
            type: "success",
            text1:
              "Notification set successfully! Check your calendar for details.",
          });
        } else {
          await saveNotificationToStorage();
          Alert.alert(
            "Success",
            "Notification saved locally. To get calendar notifications, please grant calendar permissions.",
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process notification request");
    } finally {
      setIsLoading(false);
    }
  }, [
    panchangData,
    isNotified,
    createCalendarEvent,
    saveNotificationToStorage,
    removeNotificationFromStorage,
  ]);

  // View all notifications
  const viewAllNotifications = useCallback(async () => {
    try {
      const notifications = await AsyncStorage.getItem(
        "panchang_notifications",
      );
      const count = notifications
        ? Object.keys(JSON.parse(notifications)).length
        : 0;

      Alert.alert(
        "Notifications",
        `You have ${count} active notification${count !== 1 ? "s" : ""}`,
      );
    } catch (error) {
      console.error("Error viewing notifications:", error);
      Alert.alert("Error", "Failed to load notifications");
    }
  }, []);

  // Get user location
  const getUserLocation = useCallback(async () => {
    setIsLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setUserLocation(FALLBACK_LOCATION);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      console.error("Location error:", error);
      setUserLocation(FALLBACK_LOCATION);
    } finally {
      setIsLocationLoading(false);
    }
  }, []);

  // Calculate local times and Rahu Kalam
  const calculateLocalTimes = useCallback(
    (coords) => {
      if (!coords || !selectedDate) return;

      try {
        const safeDate = new Date(selectedDate);
        safeDate.setHours(12, 0, 0, 0);

        const times = SunCalc.getTimes(
          safeDate,
          coords.latitude,
          coords.longitude,
        );

        setLocalSunTimes({
          sunrise: times.sunrise,
          sunset: times.sunset,
        });

        // Calculate Rahu Kalam
        const day = safeDate.getDay();
        const daylight = times.sunset - times.sunrise;
        const segment = daylight / 8;

        const rahuIndex = RAHU_INDEX_MAP[day] - 1;
        const start = new Date(times.sunrise.getTime() + segment * rahuIndex);
        const end = new Date(start.getTime() + segment);

        setRahuKalam({ start, end });
      } catch (error) {
        console.error("SunCalc error:", error);
        setLocalSunTimes(null);
        setRahuKalam(null);
      }
    },
    [selectedDate],
  );

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([checkNotificationStatus(), getUserLocation()]);
    setRefreshing(false);
  }, [checkNotificationStatus, getUserLocation]);

  // Format time helper
  const formatTime = useCallback((dateObj) => {
    if (!dateObj) return "Calculating...";
    try {
      return dateObj.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Invalid time";
    }
  }, []);

  // Effects
  useEffect(() => {
    if (modalVisible && selectedDate) {
      getUserLocation();
      checkNotificationStatus();
    }
  }, [modalVisible, selectedDate, getUserLocation, checkNotificationStatus]);

  useEffect(() => {
    if (userLocation && selectedDate) {
      calculateLocalTimes(userLocation);
    }
  }, [userLocation, selectedDate, calculateLocalTimes]);

  // Loading state
  if (!selectedDate) return null;

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
                disabled={isLoading}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#5e3c19"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={isLoading}
              >
                <Ionicons name="close" size={24} color="#5e3c19" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.modalBody}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {isLocationLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E88F14" />
                <Text style={styles.loadingText}>Getting location data...</Text>
              </View>
            ) : panchangData ? (
              <>
                {/* Notify Button */}
                <TouchableOpacity
                  style={[
                    styles.notifyButton,
                    isNotified && styles.notifyButtonActive,
                  ]}
                  onPress={handleNotifyPress}
                  disabled={isLoading || isLocationLoading}
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

                {/* Tithi & Nakshatra Section */}
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

                {/* Timings Section */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Timings</Text>

                  {/* Sunrise/Sunset with location indicator */}
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Sunrise:</Text>
                    <Text style={styles.modalInfoValue}>
                      {localSunTimes?.sunrise ? (
                        formatTime(localSunTimes.sunrise)
                      ) : (
                        <ActivityIndicator size="small" color="#E88F14" />
                      )}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Sunset:</Text>
                    <Text style={styles.modalInfoValue}>
                      {localSunTimes?.sunset ? (
                        formatTime(localSunTimes.sunset)
                      ) : (
                        <ActivityIndicator size="small" color="#E88F14" />
                      )}
                    </Text>
                  </View>

                  {/* Rahu Kalam - NEW */}
                  {rahuKalam && (
                    <View style={[styles.modalInfoRow, styles.rahuKalamRow]}>
                      <Text style={styles.modalInfoLabel}>🌑 Rahu Kalam:</Text>
                      <Text
                        style={[styles.modalInfoValue, styles.rahuKalamText]}
                      >
                        {formatTime(rahuKalam.start)} -{" "}
                        {formatTime(rahuKalam.end)}
                      </Text>
                    </View>
                  )}

                  {/* Moon times */}
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

                  {/* Location info */}
                  {userLocation && (
                    <Text style={styles.locationInfo}>
                      📍 Based on your location
                    </Text>
                  )}
                </View>

                {/* Festivals Section */}
                {panchangData.festivals?.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Festivals</Text>
                    {panchangData.festivals.map((festival, index) => (
                      <View key={index} style={styles.modalFestivalItem}>
                        <Ionicons name="star" size={16} color="#E88F14" />
                        <Text style={styles.modalFestivalText}>{festival}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Muhurats Section */}
                {panchangData.muhurats?.length > 0 && (
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
              <View style={styles.noDataContainer}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.modalNoData}>
                  No details available for this date
                </Text>
              </View>
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
    maxHeight: "90%",
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
    maxHeight: "100%",
  },
  notifyButton: {
    backgroundColor: "#E88F14",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notifyButtonActive: {
    backgroundColor: "#d32f2f",
  },
  notifyIcon: {
    marginRight: 8,
  },
  notifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E88F14",
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#f2f2f2",
    paddingBottom: 8,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingVertical: 2,
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
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  rahuKalamRow: {
    backgroundColor: "#fff3e0",
    padding: 8,
    borderRadius: 8,
    marginVertical: 6,
  },
  rahuKalamText: {
    color: "#c62828",
    fontWeight: "bold",
  },
  modalFestivalItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#fff9f0",
    padding: 8,
    borderRadius: 8,
  },
  modalFestivalText: {
    fontSize: 16,
    color: "#5e3c19",
    marginLeft: 8,
    flex: 1,
  },
  locationInfo: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "right",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  noDataContainer: {
    padding: 40,
    alignItems: "center",
  },
  modalNoData: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 12,
  },
});

export default PanchangDetailModal;
