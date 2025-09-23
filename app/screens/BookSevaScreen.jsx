import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StatusBar,
  StyleSheet
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import styled from 'styled-components/native';
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
      // Reset search state whenever tab is focused
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

  const ServiceCard = ({ service }) => {
    const minPrice = service.service_variation_list?.length > 0 
      ? Math.min(...service.service_variation_list.map(v => parseFloat(v.base_price)))
      : parseFloat(service.base_price || 0);

    return (
      <Card>
        <CardImage
          source={{ uri: service.image || 'https://via.placeholder.com/300x200?text=Temple+Hall' }}
          resizeMode="cover"
        />
        <ImageGradient colors={['transparent', 'rgba(0,0,0,0.8)']} />
        
        <CardContent>
          <ServiceName>{service.name}</ServiceName>
          <TempleName>{service.temple_name}</TempleName>
          <Description numberOfLines={2}>
            {service.description}
          </Description>
          
          <DetailsRow>
            <DetailItem>
              <Ionicons name="people" size={16} color="#666" />
              <DetailText>Up to {service.capacity} people</DetailText>
            </DetailItem>
            <DetailItem>
              <Ionicons name="time" size={16} color="#666" />
              <DetailText>{service.duration_minutes} mins</DetailText>
            </DetailItem>
          </DetailsRow>

          <PriceContainer>
            <StartingFrom>Starting from</StartingFrom>
            <Price>
              {formatPrice(minPrice)}
            </Price>
          </PriceContainer>

          <BookButton onPress={() => handleBookNow(service)}>
            <ButtonGradient colors={['#FF6B6B', '#FF8E53']}>
              <BookButtonText>Book Now</BookButtonText>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </ButtonGradient>
          </BookButton>
        </CardContent>
      </Card>
    );
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

  if (loading) {
    return (
      <CenterContainer>
        <ActivityIndicator size="large" color="#E88F14" />
        <LoadingText>Loading services...</LoadingText>
      </CenterContainer>
    );
  }

  if (services.length === 0) {
    return (
      <Screen>
        <StatusBarBackground />
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Header>
          <Title>Book Seva</Title>
          <Subtitle>Choose from available services</Subtitle>
        </Header>
        
        <CenterContainer>
          <Ionicons name="calendar-outline" size={64} color="#CCC" />
          <EmptyText>Services will be available soon for booking</EmptyText>
        </CenterContainer>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <StatusBarBackground />
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

      <List
        data={services}
        renderItem={({ item }) => <ServiceCard service={item} />}
        keyExtractor={(item) => item.service_id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        // refreshControl={
        //   <RefreshControl 
        //     refreshing={refreshing} 
        //     onRefresh={onRefresh}
        //     colors={['#E88F14']}
        //     tintColor={'#E88F14'}
        //   />
        // }
        showsVerticalScrollIndicator={false}
        // ListEmptyComponent={<EmptyState />}
      />

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

const SearchButton = styled.TouchableOpacity`
  height: 40px;
  width: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  margin-top: 10px;
`;

const SearchContainer = styled.View`
  margin-top: 10px;
  background-color: #ffffff;
  border-radius: 14px;
  padding: 10px;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const SearchInput = styled.TextInput`
  flex: 1;
  height: 40px;
  background-color: #f3f4f6;
  border-radius: 10px;
  padding: 0 12px;
  color: #111827;
`;


const TitleContainer = styled.View`
  flex: 1;
  margin-left: 10px;
`;

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

const Title = styled.Text`
  color: #ffffff;
  font-size: 24px;
  font-weight: 800;
  margin-top: 8px;
`;

const Subtitle = styled.Text`
  color: #e9e6ff;
  font-size: 12px;
  margin-top: 6px;
`;

const List = styled(FlatList).attrs(() => ({}))``;

const Card = styled.View`
  width: ${CARD_W}px;
  background-color: #ffffff;
  border-radius: 16px;
  margin-bottom: 16px;
  margin-horizontal: ${H_PADDING}px;
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

const CardImage = styled.Image`
  width: 100%;
  height: 200px;
`;

const ImageGradient = styled(LinearGradient)`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100px;
`;

const CardContent = styled.View`
  padding: 16px;
`;

const ServiceName = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #2D3436;
  margin-bottom: 4px;
`;

const TempleName = styled.Text`
  font-size: 16px;
  color: #6C63FF;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Description = styled.Text`
  font-size: 14px;
  color: #666;
  line-height: 20px;
  margin-bottom: 16px;
`;

const DetailsRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const DetailItem = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const DetailText = styled.Text`
  font-size: 14px;
  color: #666;
`;

const PriceContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background-color: #F8F9FA;
  border-radius: 12px;
`;

const StartingFrom = styled.Text`
  font-size: 14px;
  color: #666;
`;

const Price = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #E88F14;
`;

const BookButton = styled.TouchableOpacity`
  border-radius: 15px;
  overflow: hidden;
`;

const ButtonGradient = styled(LinearGradient)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 16px;
  gap: 8px;
`;

const BookButtonText = styled.Text`
  color: #FFF;
  font-size: 16px;
  font-weight: 700;
`;

const CenterContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const LoadingText = styled.Text`
  margin-top: 12px;
  font-size: 16px;
  color: #666;
`;

const EmptyText = styled.Text`
  font-size: 18px;
  color: #666;
  text-align: center;
  margin-top: 16px;
`;

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
`;

const ConfirmButtonText = styled.Text`
  color: #FFF;
  font-size: 16px;
  font-weight: 700;
`;

// Keep some StyleSheet styles for specific properties
const calendarStyles = StyleSheet.create({
  calendar: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
});

export default BookSevaScreen;