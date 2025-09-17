// app/(tabs)/Events.jsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import ToastMsg from '../../components/ToastMsg';
import { getBookingList, getTempleServiceList, processBooking } from '../../services/productService';

const { width } = Dimensions.get('window');

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [loadingDates, setLoadingDates] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getTempleServiceList();
      
      // Filter for events only
      const eventData = response.data.filter(
        (service) => service.service_type?.toLowerCase() === 'event'
      );
      
      setEvents(eventData);
    } catch (error) {
      console.error('Error fetching events:', error);
      ToastMsg('Failed to load events. Please try again.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBookingsForService = async (variationId) => {
    try {
      setLoadingDates(true);
      const allBookingsResponse = await getBookingList();

      if (allBookingsResponse.status === 200 && allBookingsResponse.data) {
        const relevantBookings = allBookingsResponse.data.filter(
          booking => String(booking.service_variation_data?.id) === String(variationId)
        );

        const dates = {};

        relevantBookings.forEach(booking => {
          const [day, month, year] = booking.booking_date.split("-");
          const bookingDate = `${year}-${month}-${day.padStart(2, "0")}`;

          dates[bookingDate] = { disabled: true, disableTouchEvent: true };
        });

        setMarkedDates(dates);
      }
    } catch (error) {
      ToastMsg("Failed to load availability. Please try again.", "error");
    } finally {
      setLoadingDates(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleBookNow = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleVariationSelect = async (variation) => {
    setSelectedVariation(variation);
    setModalVisible(false);
    
    // Fetch existing bookings for this service variation
    await fetchBookingsForService(variation.id);
    
    setCalendarModalVisible(true);
  };

  const handleDateSelect = (day) => {
    // Check if the date is disabled
    if (markedDates[day.dateString]?.disabled) {
      ToastMsg('This date is not available for booking.', 'error');
      return;
    }
    
    setSelectedDate(day.dateString);
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price).toFixed(2)}`;
  };

  const formatDateForAPI = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const confirmBooking = async () => {
    if (!selectedDate || !selectedVariation) {
      ToastMsg('Please select a date to continue', 'error');
      return;
    }
    
    // Check if the selected date is available
    if (markedDates[selectedDate]?.disabled) {
      ToastMsg('This date is no longer available for booking.', 'error');
      return;
    }
    
    const customer_refcode = await AsyncStorage.getItem('ref_code');
    
    try {
      setBookingLoading(true);
      
      const bookingData = {
        cust_ref_code: customer_refcode,
        call_mode: "ADD_BOOKING",
        service_variation_id: selectedVariation.id,
        booking_date: formatDateForAPI(selectedDate),
        end_date: formatDateForAPI(selectedDate),
        start_time: selectedVariation.start_time,
        end_time: selectedVariation.end_time,
        notes: `Booking for ${selectedEvent.name}`,
        quantity: 1,
        duration: selectedEvent.duration_minutes,
        unit_price: selectedVariation.base_price
      };
      
      const response = await processBooking(bookingData);
      
      if (response.status === 200) {
        setCalendarModalVisible(false);
        setSelectedEvent(null);
        setSelectedVariation(null);
        setSelectedDate(null);
        setMarkedDates({});
        
        ToastMsg('Your booking has been confirmed!', 'success');
        
        // Navigate after a short delay
        setTimeout(() => {
          router.replace('/(tabs)/my-booking');
        }, 2000);
      } else {
        ToastMsg(response.message || 'Failed to process booking', 'error');
      }
    } catch (error) {
      ToastMsg(`Booking failed: ${error.message}`, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const VariationItem = ({ variation }) => (
    <TouchableOpacity
      style={styles.variationItem}
      onPress={() => handleVariationSelect(variation)}
    >
      <View style={styles.variationContent}>
        <Text style={styles.variationName}>{variation.pricing_type_str}</Text>
        <Text style={styles.variationTime}>
          {variation.start_time} - {variation.end_time}
        </Text>
        <Text style={styles.variationCapacity}>
          Max {variation.max_participant} people • {variation.max_no_per_day} slots/day
        </Text>
      </View>
      <View style={styles.variationPrice}>
        <Text style={styles.variationPriceText}>{formatPrice(variation.base_price)}</Text>
      </View>
    </TouchableOpacity>
  );

  const EventCard = ({ event }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: event.image || 'https://via.placeholder.com/300x200?text=Event' }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageGradient}
        />
        <View style={styles.eventBadge}>
          <Text style={styles.eventBadgeText}>EVENT</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.eventName}>{event.name}</Text>
        <Text style={styles.templeName}>{event.temple_name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={14} color="#666" />
            <Text style={styles.detailText}>Up to {event.capacity} people</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={14} color="#666" />
            <Text style={styles.detailText}>{event.duration_minutes} mins</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.startingFrom}>Starting from</Text>
            <Text style={styles.price}>{formatPrice(event.base_price)}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => handleBookNow(event)}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.buttonGradient}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#DDD" />
      <Text style={styles.emptyTitle}>No Events Available</Text>
      <Text style={styles.emptyText}>
        Check back later for upcoming events at our temples.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Temple Events</Text>
        <Text style={styles.headerSubtitle}>
          Discover special events and celebrations
        </Text>
      </View>

      <FlatList
        data={events}
        renderItem={({ item }) => <EventCard event={item} />}
        keyExtractor={(item) => item.service_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
        ListEmptyComponent={<EmptyState />}
      />

      {/* Package Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Package</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.serviceModalName}>
              {selectedEvent?.name}
            </Text>

            <FlatList
              data={selectedEvent?.service_variation_list || []}
              renderItem={({ item }) => <VariationItem variation={item} />}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.variationList}
            />
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={calendarModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.calendarModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                onPress={() => {
                  setCalendarModalVisible(false);
                  setMarkedDates({});
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.serviceModalName}>
              {selectedEvent?.name} - {selectedVariation?.pricing_type_str}
            </Text>

            {loadingDates ? (
              <View style={styles.calendarLoading}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Checking availability...</Text>
              </View>
            ) : (
              <>
                <Calendar
                  minDate={new Date().toISOString().split('T')[0]}
                  onDayPress={handleDateSelect}
                  markedDates={{
                    ...markedDates,
                    [selectedDate]: { 
                      ...markedDates[selectedDate], 
                      selected: true, 
                      selectedColor: '#FF6B6B' 
                    }
                  }}
                  theme={{
                    selectedDayBackgroundColor: '#FF6B6B',
                    todayTextColor: '#FF6B6B',
                    arrowColor: '#FF6B6B',
                    textDisabledColor: '#CCC',
                  }}
                  style={styles.calendar}
                />

                <View style={styles.bookingSummary}>
                  <Text style={styles.summaryTitle}>Booking Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Date:</Text>
                    <Text style={styles.summaryValue}>
                      {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Not selected'}
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
                      {selectedVariation ? formatPrice(selectedVariation.base_price) : 'N/A'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.confirmButton, (!selectedDate || markedDates[selectedDate]?.disabled) && styles.disabledButton]}
                  onPress={confirmBooking}
                  disabled={!selectedDate || markedDates[selectedDate]?.disabled || bookingLoading}
                >
                  {bookingLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  eventBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  eventBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 20,
  },
  eventName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  templeName: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  startingFrom: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  bookButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  calendarModal: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  closeButton: {
    padding: 4,
  },
  serviceModalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  variationList: {
    padding: 20,
  },
  variationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 15,
    marginBottom: 12,
  },
  variationContent: {
    flex: 1,
  },
  variationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  variationTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  variationCapacity: {
    fontSize: 12,
    color: '#888',
  },
  variationPrice: {
    alignItems: 'flex-end',
  },
  variationPriceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  calendar: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  calendarLoading: {
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingSummary: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Events;