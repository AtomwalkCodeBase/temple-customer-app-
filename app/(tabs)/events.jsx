import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Cards from "../../components/Cards";
import Header from '../../components/Header';
import ToastMsg from '../../components/ToastMsg';
import { getBookingList, getPaymentStatus, getTempleServiceList, processBooking } from '../../services/productService';
import CalendarModal from '../modals/CalendarModal';
import OrderSummaryModal from '../modals/OrderSummaryModal';
import PaymentOptionsModal from '../modals/PaymentOptionsModal';
import PaymentStatusModal from '../modals/PaymentStatusModal';
import ServiceDetails from '../modals/ServiceDetails';

const { width } = Dimensions.get('window');
const H_PADDING = 16;
const COL_GAP = 16;
const CARD_W = Math.floor((width - H_PADDING * 2 - COL_GAP) / 2);

const BookServicesScreen = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [loadingDates, setLoadingDates] = useState(false);
  const [orderSummaryVisible, setOrderSummaryVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentStatusVisible, setPaymentStatusVisible] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [bookingRefCode, setBookingRefCode] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);

  const handleCloseStatusModal = () => {
    setPaymentStatusVisible(false);
    setPaymentStatus('');
    setBookingRefCode('');
  };

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredServices(
        selectedCategory === 'All'
          ? services
          : services.filter(s => s.service_type.toUpperCase() === selectedCategory.toUpperCase())
      );
      return;
    }
    const filtered = services.filter(service => {
      const matchesQuery =
        service.name.toLowerCase().includes(query) ||
        service.temple_name.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory === 'All' ||
        service.service_type.toUpperCase() === selectedCategory.toUpperCase();
        return matchesQuery && matchesCategory;
      });
      setFilteredServices(filtered);
    }, [searchQuery, services, selectedCategory]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTempleServiceList();
      if (response.status === 200 && response.data) {
        const activeServices = response.data.filter(service => service.is_active);
        setServices(activeServices);
        setFilteredServices(activeServices);
      } else {
        throw new Error('Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services. Please try again.');
      ToastMsg('Failed to load services. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filterServices = (category) => {
    setSelectedCategory(category);
    if (category === 'All') {
      setFilteredServices(services);
    } else {
      const categoryMap = {
        'Hall': 'HALL',
        'Puja': 'PUJA',
        'Event': 'EVENT'
      };
      const apiCategory = categoryMap[category] || category.toUpperCase();
      const filtered = services.filter(service => 
        service.service_type.toUpperCase() === apiCategory
      );
      setFilteredServices(filtered);
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

    // Check if this is an EVENT service
    const isEventService = selectedService?.service_type?.toUpperCase() === 'EVENT';

    if (isEventService) {
      // EVENT service logic - block dates based on capacity
      const dateWiseBookings = {};
      
      // Group bookings by date and calculate total participants
      allBookings.forEach((booking) => {
        if (booking.status !== "B") return;
        
        const bookingDate = formatAPIDateToISO(booking.booking_date);
        if (!bookingDate) return;
        
        if (!dateWiseBookings[bookingDate]) {
          dateWiseBookings[bookingDate] = {
            totalParticipants: 0,
            count: 0
          };
        }
        
        // Add participants for this booking
        const participants = parseInt(booking.no_of_participants) || 1;
        dateWiseBookings[bookingDate].totalParticipants += participants;
        dateWiseBookings[bookingDate].count += 1;
      });

      // Mark dates as disabled if capacity is exceeded
      Object.keys(dateWiseBookings).forEach(date => {
        const bookingData = dateWiseBookings[date];
        const maxCapacity = parseInt(variation.max_participant) || 0;
        const maxSlots = parseInt(variation.max_no_per_day) || 0;
        
        // Check if capacity OR slot limit is exceeded
        const capacityExceeded = maxCapacity > 0 && bookingData.totalParticipants >= maxCapacity;
        const slotsExceeded = maxSlots > 0 && bookingData.count >= maxSlots;
        
        if (capacityExceeded || slotsExceeded) {
          dates[date] = {
            disabled: true,
            disableTouchEvent: true,
          };
        }
      });

    } else {
      // Existing logic for HALL and PUJA services (time-based blocking)
      allBookings.forEach((booking) => {
        const bookingDate = formatAPIDateToISO(booking.booking_date);
        if (booking.status !== "B") {
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
    }

    setMarkedDates(dates);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    ToastMsg("Failed to load availability. Please try again.", "error");
  } finally {
    setLoadingDates(false);
  }
};

  const navigation = useNavigation();

  const checkPaymentStatus = async (refCode) => {
    try {
      const response = await getPaymentStatus(refCode);
      
      if (response.status === 200 && response.data) {
        const paymentStatus = response.data.payment?.status;
        
        switch (paymentStatus) {
          case 'S': // Success
            setPaymentStatus('success');
            ToastMsg('Payment successful! Booking confirmed.', 'success');
            break;
          case 'F': // Failed
            setPaymentStatus('failed');
            // Cancel the booking since payment failed
            await cancelBooking(refCode);
            ToastMsg('Payment failed. Booking cancelled.', 'error');
            break;
          case 'P': // Processing
            setPaymentStatus('processing');
            // Cancel the booking since payment is still processing
            await cancelBooking(refCode);
            ToastMsg('Payment is still processing. Please try again.', 'warning');
            break;
          default:
            setPaymentStatus('failed');
            await cancelBooking(refCode);
            ToastMsg('Payment status unknown. Please contact support.', 'error');
            break;
        }
      } else {
        setPaymentStatus('failed');
        await cancelBooking(refCode);
        ToastMsg('Failed to verify payment status.', 'error');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('failed');
      await cancelBooking(refCode);
      ToastMsg('Error verifying payment. Please contact support.', 'error');
    } finally {
      setPaymentStatusVisible(true);
    }
  };

  const cancelBooking = async (refCode) => {
    try {
      const customer_refcode = await AsyncStorage.getItem('ref_code');
      const cancelData = {
        cust_ref_code: customer_refcode,
        call_mode: "CANCEL_BOOKING",
        booking_ref_code: refCode,
        cancel_reason: "Payment failed or processing"
      };
      await processBooking(cancelData);
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleProceedToPayment = () => {
    setOrderSummaryVisible(false);
    setPaymentModalVisible(true);
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
      const isEventService = selectedService?.service_type?.toUpperCase() === 'EVENT';
      
      if (isEventService) {
        ToastMsg('This date is fully booked. No available capacity.', 'error');
      } else {
        ToastMsg('This date is not available for booking.', 'error');
      }
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

  const confirmDate = async () => {
    setCalendarModalVisible(false);
    setOrderSummaryVisible(true);
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

  const renderServiceItem = ({ item }) => {
    const minPrice = item.service_variation_list?.length > 0 
      ? Math.min(...item.service_variation_list.map(v => parseFloat(v.base_price)))
      : parseFloat(item.base_price || 0);
    return (
      <Cards
        type="service"
        image={item.image}
        title={item.name}
        templeName={item.temple_name}
        description={item.description}
        price={minPrice}
        capacity={item.capacity}
        onBookPress={() => handleBookNow(item)}
        bookButtonText="Select Package"
        width={CARD_W}
      />
    );
  };

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E88F14" />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  if (error && services.length === 0) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        type="type2"
        title="Book Services"
        subtitle="Choose from available services"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContentContainer}
      >
        {['All', 'Hall', 'Puja', 'Event'].map((category) => (
          <TouchableOpacity
            key={category}
            style={styles.categoryButton(selectedCategory === category)}
            onPress={() => filterServices(category)}
          >
            <Text style={styles.categoryText(selectedCategory === category)}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredServices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No services found for {selectedCategory}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={item => item.service_id}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            paddingHorizontal: H_PADDING,
            marginBottom: 16,
          }}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
          renderItem={renderServiceItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ServiceDetails
        selectedService={selectedService}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        handleVariationSelect={handleVariationSelect}
      />

      <CalendarModal
        visible={calendarModalVisible}
        onBack={() => {
          setCalendarModalVisible(false);
          setModalVisible(true);
        }}
        onClose={() => {
          setCalendarModalVisible(false);
          setMarkedDates({});
        }}
        selectedService={selectedService}
        selectedVariation={selectedVariation}
        loadingDates={loadingDates}
        markedDates={markedDates}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onConfirmDate={confirmDate}
        bookingLoading={bookingLoading}
        formatPrice={formatPrice}
      />

      <OrderSummaryModal
        visible={orderSummaryVisible}
        onBack={() => {
          setOrderSummaryVisible(false);
          setCalendarModalVisible(true);
        }}
        onClose={() => {
          setOrderSummaryVisible(false);
        }}
        onProceedToPayment={handleProceedToPayment}
        selectedService={selectedService}
        selectedVariation={selectedVariation}
        selectedDate={selectedDate}
        formatPrice={formatPrice}
        bookingLoading={bookingLoading}
      />

      <PaymentOptionsModal
        visible={paymentModalVisible}
        onBack={() => {
          setOrderSummaryVisible(true);
          setPaymentModalVisible(false);
        }}
        onPaymentComplete={(status, refCode) => {
          setPaymentModalVisible(false);
          setPaymentStatus(status);
          setBookingRefCode(refCode);
          setPaymentStatusVisible(true);
          
          // Also close order summary if needed
          setOrderSummaryVisible(false);
        }}
        selectedService={selectedService}
        selectedVariation={selectedVariation}
        selectedDate={selectedDate}
        bookingRefCode={bookingRefCode}
      />

      <PaymentStatusModal
        visible={paymentStatusVisible}
        status={paymentStatus}
        onClose={handleCloseStatusModal}
        message={paymentStatus === 'success' 
          ? 'Your booking has been confirmed!' 
          : paymentStatus === 'processing'
          ? 'Payment is being processed. Please check your payment status later.'
          : 'Payment failed. Please try again.'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  modalContentFull: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '92%',
    alignSelf: 'stretch',
  },
  detailsScroll: {
    paddingBottom: 16,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3436',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
  },
  pillText: {
    fontSize: 12,
    color: '#A04E00',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  galleryImage: {
    width: Math.floor((width - 20 - 20 - 12) / 1.2),
    height: 170,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#EEE',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E88F14',
  },
  priceNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  termsBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  termsText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  policyGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
  marginTop: 8,
  },

  policyCard: {
    width: '100%',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: 12, // space between rows
  },

  policyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },

  policyCardText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },

  categoryContainer: {
    height: 80,
  },
  categoryContentContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f6f7fb',
  },
  categoryButton: (active) => ({
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    height: 35,
    backgroundColor: active ? '#E88F14' : '#f1f1f1',
  }),
  categoryText: (active) => ({
    fontSize: 14,
    color: active ? '#fff' : '#666',
    fontWeight: '500',
  }),
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#E88F14',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
    paddingVertical: 40,
    paddingHorizontal: 20,
    minHeight: 200,
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
  confirmButton: (disabled) => ({
    backgroundColor: disabled ? '#CCC' : '#E88F14',
    padding: 16,
    borderRadius: 15,
    marginHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  }),
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  calendar: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
});

export default BookServicesScreen;