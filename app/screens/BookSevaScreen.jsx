import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Cards from '../../components/Cards';
import Header from '../../components/Header';
import ToastMsg from '../../components/ToastMsg';
import { getBookingList, getTempleServiceList, processBooking } from '../../services/productService';

const { width } = Dimensions.get('window');
const H_PADDING = 16;
const CARD_W = Math.floor(width - H_PADDING * 2);

const BookSevaScreen = () => {
  const { type = "hall", temple = "" } = useLocalSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [loadingDates, setLoadingDates] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchQuery('');
    }
  };  

  useFocusEffect(
    useCallback(() => {
      setSearchVisible(false);
      setSearchQuery('');
    }, [])
  );

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const mockData = await getTempleServiceList();
      const filteredServices = mockData.data.filter(
        (service) =>
          service.service_type?.toLowerCase() === type.toLowerCase() && service.temple_id === temple
      );
      setServices(filteredServices);
    } catch (error) {
      ToastMsg('Failed to load services. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingsForService = async (variation, serviceId) => {
    try {
      setLoadingDates(true);

      const response = await getBookingList();
      if (response.status !== 200 || !response.data) return;

      const allBookings = response.data.filter(
        (b) => (b.service_data?.service_id || b.service_id) === serviceId
      );

      const currentStart = parseTime(variation.start_time);
      const currentEnd = parseTime(variation.end_time);
      const currentPriceType = variation.price_type;
      const dates = {};

      allBookings.forEach((booking) => {
        const bookingDate = formatAPIDateToISO(booking.booking_date);
        if (!bookingDate) {
          return;
        }
        const bookingStart = parseTime(booking.start_time);
        const bookingEnd = parseTime(booking.end_time);
        const bookingPriceType = booking.service_variation_data?.price_type;
        if (bookingPriceType === "FULL_DAY") {
          dates[bookingDate] = {
            disabled: true,
            disableTouchEvent: true,
          };
          return;
        }
        if (currentPriceType === "FULL_DAY") {
          dates[bookingDate] = {
            disabled: true,
            disableTouchEvent: true,
          };
          return;
        }
        if (
          bookingStart !== null &&
          bookingEnd !== null &&
          currentStart !== null &&
          currentEnd !== null
        ) {
          const overlap = bookingStart < currentEnd && currentStart < bookingEnd;
          if (overlap) {
            dates[bookingDate] = {
              disabled: true,
              disableTouchEvent: true,
            };
          }
        }
      });
      setMarkedDates(dates);
    } catch (error) {
      ToastMsg("Failed to load availability. Please try again.", "error");
    } finally {
      setLoadingDates(false);
    }
  };

  const formatAPIDateToISO = (apiDate) => {
    if (!apiDate) return null;
    const [day, mon, year] = apiDate.split("-");
    return `${year}-${mon}-${day.padStart(2, "0")}`;
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const [hh, mm, ss] = timeStr.split(':').map(Number);
    return hh * 60 + (mm || 0);
  };

  const handleBookNow = (service) => {
    setSelectedService(service);
    setModalVisible(true);
  };

  const handleVariationSelect = async (variation) => {
    setSelectedVariation(variation);
    setModalVisible(false);
    await fetchBookingsForService(variation, selectedService.service_id);
    setCalendarModalVisible(true);
  };

  const handleDateSelect = (day) => {
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
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
                    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const confirmBooking = async () => {
    if (!selectedDate || !selectedVariation) {
      ToastMsg('Please select a date to continue', 'error');
      return;
    }
    
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
        notes: `Booking for ${selectedService.name}`,
        quantity: 1,
        duration: selectedService.duration_minutes || 60,
        unit_price: parseFloat(selectedVariation.base_price)
      };

      const response = await processBooking(bookingData);

      if (response.status === 200) {
        setCalendarModalVisible(false);
        setSelectedService(null);
        setSelectedVariation(null);
        setSelectedDate(null);
        setMarkedDates({});

        ToastMsg('Your booking has been confirmed!', 'success');
        
        setTimeout(() => {
          router.replace('/screens/MyBookings');
        }, 2000);
      } else {
        ToastMsg('Failed to process booking', 'error');
      }
    } catch (error) {
      ToastMsg(`Booking failed: ${error.message}`, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const VariationItem = ({ variation }) => (
    <TouchableOpacity 
      style={styles.variationItemContainer}
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E88F14" />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  if (services.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.statusBarBackground} />
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Header>
          <Text style={styles.title}>Book Seva</Text>
          <Text style={styles.subtitle}>Choose from available services</Text>
        </Header>
        
        <View style={styles.centerContainer}>
          <Ionicons name="calendar-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Services will be available soon for booking</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.statusBarBackground} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <Header
        type="type3"
        title="Book Seva"
        subtitle="Choose from available services"
        showBackButton={true}
        searchVisible={searchVisible}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onToggleSearch={toggleSearch}
        onBackPress={() => router.back()}
      />

      <FlatList
        data={services}
        renderItem={({ item }) => {
          const minPrice = item.service_variation_list?.length > 0
            ? Math.min(...item.service_variation_list.map(v => parseFloat(v.base_price)))
            : parseFloat(item.base_price || 0);

          return (
            <View style={styles.wrapper}>
              <Cards
                type="service"
                image={item.image || "https://via.placeholder.com/300x200?text=Temple+Service"}
                title={item.name}
                subtitle={item.temple_name}
                description={item.description}
                price={minPrice}
                capacity={item.capacity}
                templeName={item.temple_name}
                onBookPress={() => handleBookNow(item)}
                bookButtonText="Book Now"
                width={CARD_W}
                marginBottom="16px"
              />
            </View>
          );
        }}
        keyExtractor={(item) => item.service_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '60%', minHeight: 300 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Package</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.serviceModalName}>
              {selectedService?.name}
            </Text>

            {selectedService?.service_variation_list?.length > 0 ? (
              <FlatList
                data={selectedService.service_variation_list}
                renderItem={({ item }) => <VariationItem variation={item} />}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 20 }}
              />
            ) : (
              <View style={styles.emptyPackageContainer}>
                <Ionicons name="cube-outline" size={48} color="#CCC" />
                <Text style={styles.emptyPackageText}>Packages will be available soon for booking</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={calendarModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setCalendarModalVisible(false);
                  setMarkedDates({});
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
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
                  minDate={new Date().toISOString().split('T')[0]}
                  onDayPress={handleDateSelect}
                  markedDates={{
                    ...markedDates,
                    ...(selectedDate && !markedDates[selectedDate] ? {
                      [selectedDate]: { selected: true, selectedColor: '#E88F14' }
                    } : {})
                  }}
                  theme={{
                    selectedDayBackgroundColor: '#E88F14',
                    todayTextColor: '#E88F14',
                    arrowColor: '#E88F14',
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
                  style={[
                    styles.confirmButton,
                    (!selectedDate || markedDates[selectedDate]?.disabled || bookingLoading) && styles.confirmButtonDisabled
                  ]}
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
  screen: {
    flex: 1,
    backgroundColor: '#f6f7fb',
    paddingTop: 10,
  },
  statusBarBackground: {
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    backgroundColor: '#E88F14',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: '#e9e6ff',
    fontSize: 12,
    marginTop: 6,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  wrapper: {
    marginBottom: 16,
  },
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
    fontWeight: '700',
    color: '#2D3436',
  },
  closeButton: {
    padding: 4,
  },
  serviceModalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  variationItemContainer: {
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#E88F14',
  },
  emptyPackageContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: 200,
    padding: 40,
  },
  emptyPackageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  calendarLoading: {
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendar: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
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
    fontWeight: '700',
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
    backgroundColor: '#E88F14',
    padding: 16,
    borderRadius: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default BookSevaScreen;