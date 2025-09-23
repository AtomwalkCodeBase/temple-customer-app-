import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StatusBar
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import styled from 'styled-components/native';
import Cards from "../../components/Cards";
import Header from '../../components/Header';
import ToastMsg from '../../components/ToastMsg';
import { getBookingList, getTempleServiceList, processBooking } from '../../services/productService';

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
  
  // Booking state variables
  const [selectedService, setSelectedService] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [loadingDates, setLoadingDates] = useState(false);

  // Live search filtering
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
      
      // Fallback to sample data if API fails
      const fallbackData = [
        {
          "service_id": "T_0000010_S_00046",
          "name": "Ananda bazar",
          "temple_id": "T_0000010",
          "temple_name": "Durga Mandir",
          "service_type": "Hall",
          "service_type_str": "Hall",
          "description": "You can book for thread ceremony, Birthday Party, Marriage anniversary etc.",
          "capacity": 100,
          "base_price": "0.00",
          "image": "https://temple-ai-bucket.s3.amazonaws.com/media/TEMPLE_DB/T_0000010/T_0000010_S_00046/beautiful-interior-of-banquet-hall-marriage-hall-i_dBMKq4b.jpg",
          "is_active": true,
          "service_variation_list": [
            {
              "id": "V_0001",
              "pricing_type_str": "Full Day",
              "start_time": "06:00:00",
              "end_time": "22:00:00",
              "max_participant": 100,
              "max_no_per_day": 1,
              "base_price": "5000.00",
              "price_type": "FULL_DAY"
            }
          ]
        },
        {
          "service_id": "T_0000010_S_00037",
          "name": "Ashutosh Hall",
          "temple_id": "T_0000010",
          "temple_name": "Durga Mandir",
          "service_type": "HALL",
          "service_type_str": "Hall Booking",
          "description": "test",
          "capacity": 20,
          "base_price": "200.00",
          "image": "https://temple-ai-bucket.s3.amazonaws.com/media/TEMPLE_DB/T_0000010/T_0000010_S_00037/1-1.jpg",
          "is_active": true,
          "service_variation_list": [
            {
              "id": "V_0002",
              "pricing_type_str": "Morning Slot",
              "start_time": "06:00:00",
              "end_time": "12:00:00",
              "max_participant": 20,
              "max_no_per_day": 2,
              "base_price": "1000.00",
              "price_type": "TIME_SLOT"
            },
            {
              "id": "V_0003",
              "pricing_type_str": "Evening Slot",
              "start_time": "16:00:00",
              "end_time": "22:00:00",
              "max_participant": 20,
              "max_no_per_day": 2,
              "base_price": "1500.00",
              "price_type": "TIME_SLOT"
            }
          ]
        },
        {
          "service_id": "T_0000014_S_00026",
          "name": "Baisakhi Event",
          "temple_id": "T_0000014",
          "temple_name": "Ganesh Mandir",
          "service_type": "EVENT",
          "service_type_str": "Temple Events",
          "description": "Test",
          "capacity": 100,
          "base_price": "0.00",
          "image": "https://temple-ai-bucket.s3.amazonaws.com/media/TEMPLE_DB/T_0000014/T_0000014_S_00026/Akshardham-Temple-Delhi.jpg",
          "is_active": true,
          "service_variation_list": [
            {
              "id": "V_0004",
              "pricing_type_str": "General Admission",
              "start_time": "09:00:00",
              "end_time": "18:00:00",
              "max_participant": 100,
              "max_no_per_day": 100,
              "base_price": "0.00",
              "price_type": "GENERAL"
            }
          ]
        },
        {
          "service_id": "T_0000014_S_00024",
          "name": "Bhagwan Puja",
          "temple_id": "T_0000014",
          "temple_name": "Ganesh Mandir",
          "service_type": "PUJA",
          "service_type_str": "Puja Booking in Temple",
          "description": "Testings",
          "capacity": 90,
          "base_price": "0.00",
          "image": "https://temple-ai-bucket.s3.amazonaws.com/media/TEMPLE_DB/T_0000014/T_0000014_S_00024/Akshardham-Temple-Delhi.jpg",
          "is_active": true,
          "service_variation_list": [
            {
              "id": "V_0005",
              "pricing_type_str": "Standard Puja",
              "start_time": "07:00:00",
              "end_time": "08:00:00",
              "max_participant": 10,
              "max_no_per_day": 5,
              "base_price": "500.00",
              "price_type": "TIME_SLOT"
            }
          ]
        },
      ];
      
      setServices(fallbackData);
      setFilteredServices(fallbackData);
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
      // Map category names to match API service types
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

  // Booking functions
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
    <VariationItemContainer onPress={() => handleVariationSelect(variation)}>
      <VariationContent>
        <VariationName>{variation.pricing_type_str}</VariationName>
        <VariationTime>
          {variation.start_time} - {variation.end_time}
        </VariationTime>
        <VariationCapacity>
          Max {variation.max_participant} people • {variation.max_no_per_day} slots/day
        </VariationCapacity>
      </VariationContent>
      <VariationPrice>
        <VariationPriceText>{formatPrice(variation.base_price)}</VariationPriceText>
      </VariationPrice>
    </VariationItemContainer>
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
      width={CARD_W}
    />
  );
};

  // const renderServiceItem = ({ item }) => {
  //   const minPrice = item.service_variation_list?.length > 0 
  //     ? Math.min(...item.service_variation_list.map(v => parseFloat(v.base_price)))
  //     : parseFloat(item.base_price || 0);

  //   return (
  //     <ServiceCard>
  //       <ServiceImage 
  //         source={{ uri: item.image }} 
  //         resizeMode="cover"
  //         onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
  //       />
  //       <ImageGradient colors={['transparent', 'rgba(0,0,0,0.8)']} />
  //       <ServiceInfo>
  //         <ServiceName numberOfLines={1}>{item.name}</ServiceName>
  //         <TempleName>{item.temple_name}</TempleName>
  //         <ServiceDescription numberOfLines={2}>
  //           {item.description}
  //         </ServiceDescription>
  //         <PriceContainer>
  //           <PriceText>
  //             {minPrice === 0 ? "Free" : formatPrice(minPrice)}
  //           </PriceText>
  //           <CapacityText>Capacity: {item.capacity}</CapacityText>
  //         </PriceContainer>
  //         <BookButton onPress={() => handleBookNow(item)}>
  //           <BookButtonText>Book Now</BookButtonText>
  //         </BookButton>
  //       </ServiceInfo>
  //     </ServiceCard>
  //   );
  // };

  if (loading) {
    return (
      <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E88F14" />
        <LoadingText>Loading services...</LoadingText>
      </Screen>
    );
  }

  if (error && services.length === 0) {
    return (
      <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ErrorText>{error}</ErrorText>
        <RetryButton onPress={fetchServices}>
          <RetryButtonText>Retry</RetryButtonText>
        </RetryButton>
      </Screen>
    );
  }


  return (
    <Screen>
      
      <Header
        type="type2"
        title="Book Services"
        subtitle="Choose from available services"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />


      {/* Category Filters */}
      <CategoryContainer horizontal showsHorizontalScrollIndicator={false}>
        {['All', 'Hall', 'Puja', 'Event'].map((category) => (
          <CategoryButton
            key={category}
            active={selectedCategory === category}
            onPress={() => filterServices(category)}
          >
            <CategoryText active={selectedCategory === category}>
              {category}
            </CategoryText>
          </CategoryButton>
        ))}
      </CategoryContainer>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <EmptyContainer>
          <EmptyText>No services found for {selectedCategory}</EmptyText>
        </EmptyContainer>
      ) : (
        <ServicesList
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

      {/* Package Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <ModalOverlay>
          <ModalContent style={{ maxHeight: '60%', minHeight: 300 }}>
            <ModalHeader>
              <ModalTitle>Choose Package</ModalTitle>
              <CloseButton onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </CloseButton>
            </ModalHeader>

            <ServiceModalName>
              {selectedService?.name}
            </ServiceModalName>

            {selectedService?.service_variation_list?.length > 0 ? (
              <VariationList
                data={selectedService.service_variation_list}
                renderItem={({ item }) => <VariationItem variation={item} />}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 20 }}
              />
            ) : (
              <EmptyPackageContainer>
                <Ionicons name="cube-outline" size={48} color="#CCC" />
                <EmptyPackageText>Packages will be available soon for booking</EmptyPackageText>
              </EmptyPackageContainer>
            )}
          </ModalContent>
        </ModalOverlay>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={calendarModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <ModalOverlay>
          <ModalContent style={{ maxHeight: '90%' }}>
            <ModalHeader>
              <ModalTitle>Select Date</ModalTitle>
              <CloseButton onPress={() => {
                setCalendarModalVisible(false);
                setMarkedDates({});
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </CloseButton>
            </ModalHeader>

            <ServiceModalName>
              {selectedService?.name} - {selectedVariation?.pricing_type_str}
            </ServiceModalName>

            {loadingDates ? (
              <CalendarLoading>
                <ActivityIndicator size="large" color="#E88F14" />
                <LoadingText>Checking availability...</LoadingText>
              </CalendarLoading>
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
                  style={calendarStyles.calendar}
                />

                <BookingSummary>
                  <SummaryTitle>Booking Summary</SummaryTitle>
                  <SummaryRow>
                    <SummaryLabel>Date:</SummaryLabel>
                    <SummaryValue>
                      {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Not selected'}
                    </SummaryValue>
                  </SummaryRow>
                  <SummaryRow>
                    <SummaryLabel>Time:</SummaryLabel>
                    <SummaryValue>
                      {selectedVariation?.start_time} - {selectedVariation?.end_time}
                    </SummaryValue>
                  </SummaryRow>
                  <SummaryRow>
                    <SummaryLabel>Price:</SummaryLabel>
                    <SummaryValue>
                      {selectedVariation ? formatPrice(selectedVariation.base_price) : 'N/A'}
                    </SummaryValue>
                  </SummaryRow>
                </BookingSummary>

                <ConfirmButton 
                  onPress={confirmBooking}
                  disabled={!selectedDate || markedDates[selectedDate]?.disabled || bookingLoading}
                  style={(!selectedDate || markedDates[selectedDate]?.disabled) && { backgroundColor: '#CCC' }}
                >
                  {bookingLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <ConfirmButtonText>Confirm Booking</ConfirmButtonText>
                  )}
                </ConfirmButton>
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </Screen>
  );
};

// Styled Components
const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  statusBarBackground: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
    backgroundColor: '#E88F14',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
};

const Screen = styled.SafeAreaView`
  flex: 1;
  background-color: #f6f7fb;
`;

const StatusBarBackground = styled.View`
  height: ${Platform.OS === 'ios' ? 44 : StatusBar.currentHeight}px;
  background-color: #E88F14;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
`;

const TitleRow = styled.View``;

const Title = styled.Text`
  color: #ffffff;
  font-size: 24px;
  font-weight: 800;
`;

const Subtitle = styled.Text`
  color: #e9e6ff;
  font-size: 12px;
  margin-top: 6px;
`;

const CategoryContainer = styled.ScrollView`
  padding-vertical: 12px;
  padding-horizontal: 8px;
  background-color: #f6f7fb;
  height:80px;
`;

const CategoryButton = styled.TouchableOpacity`
  padding-horizontal: 16px;
  padding-vertical: 8px;
  border-radius: 20px;
  margin-horizontal: 4px;
  height: 35px;
  background-color: ${props => props.active ? '#E88F14' : '#f1f1f1'};
`;

const CategoryText = styled.Text`
  font-size: 14px;
  color: ${props => props.active ? '#fff' : '#666'};
  font-weight: 500;
`;

const ServicesList = styled(FlatList).attrs(() => ({}))``;

const ServiceCard = styled.View`
  width: ${CARD_W}px;
  background-color: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-opacity: 0.08;
      shadow-radius: 12px;
      shadow-offset: 0px 4px;
    `,
    android: `
      elevation: 3;
    `,
  })}
`;

const ServiceImage = styled.Image`
  width: 100%;
  height: 120px;
`;

const ImageGradient = styled(LinearGradient)`
  position: absolute;
  left: 0;
  right: 0;
  top: 70px;
  height: 50px;
`;

const ServiceInfo = styled.View`
  padding: 12px;
`;

const ServiceName = styled.Text`
  font-size: 15px;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 4px;
`;

const TempleName = styled.Text`
  font-size: 14px;
  color: #4a6da7;
  margin-bottom: 8px;
  font-weight: 500;
`;

const ServiceDescription = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  line-height: 20px;
`;

const PriceContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const PriceText = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #4a6da7;
`;

const CapacityText = styled.Text`
  font-size: 14px;
  color: #888;
`;

const BookButton = styled.TouchableOpacity`
  background-color: #E88F14;
  padding: 8px;
  border-radius: 8px;
  align-items: center;
`;

const BookButtonText = styled.Text`
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
`;

const ErrorText = styled.Text`
  color: #dc2626;
  font-size: 16px;
  text-align: center;
  margin-bottom: 16px;
`;

const RetryButton = styled.TouchableOpacity`
  background-color: #E88F14;
  padding: 12px 24px;
  border-radius: 8px;
`;

const RetryButtonText = styled.Text`
  color: #ffffff;
  font-weight: 600;
`;

const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const EmptyText = styled.Text`
  color: #6b7280;
  font-size: 16px;
  text-align: center;
`;

const LoadingText = styled.Text`
  margin-top: 12px;
  font-size: 16px;
  color: #666;
`;

// Modal Styles
const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0,0,0,0.5);
  justify-content: flex-end;
`;

const ModalContent = styled.View`
  background-color: #FFF;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  max-height: 80%;
`;

const ModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #EEE;
`;

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #2D3436;
`;

const CloseButton = styled.TouchableOpacity`
  padding: 4px;
`;

const ServiceModalName = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #6C63FF;
  padding-horizontal: 20px;
  padding-vertical: 10px;
`;

const VariationList = styled(FlatList).attrs(() => ({}))``;

const VariationItemContainer = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #F8F9FA;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 12px;
`;

const VariationContent = styled.View`
  flex: 1;
`;

const VariationName = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #2D3436;
  margin-bottom: 4px;
`;

const VariationTime = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 2px;
`;

const VariationCapacity = styled.Text`
  font-size: 12px;
  color: #888;
`;

const VariationPrice = styled.View`
  align-items: flex-end;
`;

const VariationPriceText = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #E88F14;
`;

const EmptyPackageContainer = styled.View`
  flex: 1;
  justify-content: flex-start;
  align-items: center;
  padding: 40px;
  min-height: 200px;
  padding-horizontal: 20px;
`;

const EmptyPackageText = styled.Text`
  font-size: 16px;
  color: #666;
  text-align: center;
  margin-top: 16px;
`;

const CalendarLoading = styled.View`
  height: 350px;
  justify-content: center;
  align-items: center;
`;

const BookingSummary = styled.View`
  background-color: #F8F9FA;
  padding: 20px;
  margin-horizontal: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
`;

const SummaryTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #2D3436;
  margin-bottom: 15px;
`;

const SummaryRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const SummaryLabel = styled.Text`
  font-size: 14px;
  color: #666;
`;

const SummaryValue = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #2D3436;
`;

const ConfirmButton = styled.TouchableOpacity`
  background-color: #E88F14;
  padding: 16px;
  border-radius: 15px;
  margin-horizontal: 20px;
  align-items: center;
  margin-bottom: 20px;
`;

const ConfirmButtonText = styled.Text`
  color: #FFF;
  font-size: 16px;
  font-weight: 700;
`;

// Keep some StyleSheet styles for specific properties
const calendarStyles = {
  calendar: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
};

export default BookServicesScreen;