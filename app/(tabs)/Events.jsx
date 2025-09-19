import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Toast from 'react-native-toast-message';
import styled from 'styled-components/native';
import ToastMsg from '../../components/ToastMsg';
import { getBookingList, getTempleServiceList, processBooking } from '../../services/productService';

const { width } = Dimensions.get('window');
const H_PADDING = 16;
const CARD_W = Math.floor(width - H_PADDING * 2);

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
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
  useCallback(() => {
    // Reset search state whenever tab is focused
    setSearchVisible(false);
    setSearchQuery('');
  }, [])
);


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

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchQuery('');
    }
  };

  const filteredEvents = searchQuery
    ? events.filter(event => 
        event.temple_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

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

  const EventCard = ({ event }) => (
    <Card>
      <TopImage
        source={{ uri: event.image || 'https://via.placeholder.com/300x200?text=Event' }}
        imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <ImageOverlay>
          <EventBadge>
            <EventBadgeText>EVENT</EventBadgeText>
          </EventBadge>
          <TempleName>{event.temple_name}</TempleName>
        </ImageOverlay>
      </TopImage>
      
      <CardBody>
        <ServiceName>{event.name}</ServiceName>
        <Description numberOfLines={2}>
          {event.description}
        </Description>
        
        <DetailsGrid>
          <DetailItem>
            <Ionicons name="people-outline" size={16} color="#5C6BC0" />
            <DetailValue>Up to {event.capacity} people</DetailValue>
          </DetailItem>
          <DetailItem>
            <Ionicons name="time-outline" size={16} color="#5C6BC0" />
            <DetailValue>{event.duration_minutes} mins</DetailValue>
          </DetailItem>
        </DetailsGrid>
        
        <BookingFooter>
          <PriceContainer>
            <StartingFrom>Starting from</StartingFrom>
            <BookingPrice>{formatPrice(event.base_price)}</BookingPrice>
          </PriceContainer>
          
          <BookButton onPress={() => handleBookNow(event)}>
            <BookButtonText>Book Now</BookButtonText>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </BookButton>
        </BookingFooter>
      </CardBody>
    </Card>
  );

  const EmptyState = () => (
    <CenterContainer>
      <Ionicons name="calendar-outline" size={64} color="#DDD" />
      <EmptyText>
        {searchQuery ? 'No matching events found' : 'No events available'}
      </EmptyText>
      <EmptySubtext>
        {searchQuery ? 'Try a different search term' : 'Check back later for upcoming events at our temples.'}
      </EmptySubtext>
    </CenterContainer>
  );

  if (loading) {
    return (
      <CenterContainer>
        <ActivityIndicator size="large" color="#E88F14" />
        <LoadingText>Loading events...</LoadingText>
      </CenterContainer>
    );
  }

  return (
    <Screen>
      <Header>
        <Row>
          <TitleSubtitle>
            <Title>🗓️ Temple Events</Title>
            <Subtitle>Discover special events and celebrations</Subtitle>
          </TitleSubtitle>

          <SearchButton onPress={toggleSearch}>
            <Ionicons 
              name={searchVisible ? "close" : "search"} 
              size={24} 
              color="#FFF" 
            />
          </SearchButton>
        </Row>

        {searchVisible && (
          <SearchContainer>
            <SearchInput
              placeholder="Search events..."
              placeholderTextColor="#11080892"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
          </SearchContainer>
        )}
      </Header>

      <List
        data={filteredEvents}
        renderItem={({ item }) => <EventCard event={item} />}
        keyExtractor={(item) => item.service_id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#E88F14']}
            tintColor={'#E88F14'}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <ModalContainer>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Choose Package</ModalTitle>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </ModalHeader>

            <ServiceModalName>
              {selectedEvent?.name}
            </ServiceModalName>

            <ScrollView contentContainerStyle={styles.variationList}>
              {selectedEvent?.service_variation_list?.map((item) => (
                <VariationItem key={item.id.toString()} variation={item} />
              ))}
            </ScrollView>
          </ModalContent>
        </ModalContainer>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={calendarModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <ModalContainer>
          <ModalContent style={styles.calendarModal}>
            <ModalHeader>
              <ModalTitle>Select Date</ModalTitle>
              <TouchableOpacity
                onPress={() => {
                  setCalendarModalVisible(false);
                  setMarkedDates({});
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </ModalHeader>

            <ServiceModalName>
              {selectedEvent?.name} - {selectedVariation?.pricing_type_str}
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
                    [selectedDate]: { 
                      ...markedDates[selectedDate], 
                      selected: true, 
                      selectedColor: '#E88F14' 
                    }
                  }}
                  theme={{
                    selectedDayBackgroundColor: '#E88F14',
                    todayTextColor: '#E88F14',
                    arrowColor: '#E88F14',
                    textDisabledColor: '#CCC',
                  }}
                  style={styles.calendar}
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
                  style={(!selectedDate || markedDates[selectedDate]?.disabled) && styles.disabledButton}
                  onPress={confirmBooking}
                  disabled={!selectedDate || markedDates[selectedDate]?.disabled || bookingLoading}
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
        </ModalContainer>
      </Modal>
      
      <Toast />
    </Screen>
  );
};

// Styled components (same as bookings.jsx)
const Screen = styled.View`
  flex: 1;
  background-color: #f6f7fb;
`;

const Header = styled.View`
  padding: 16px;
  padding-bottom: 12px;
  background-color: #E88F14;
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 18px;
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const TitleSubtitle = styled.View`
  flex: 1;
`;

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

const SearchButton = styled.TouchableOpacity`
  height: 40px;
  width: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
`;

const List = styled(FlatList).attrs(() => ({}))``;

const Card = styled.View`
  width: ${CARD_W}px;
  background-color: #ffffff;
  border-radius: 16px;
  margin-bottom: 16px;
  margin-horizontal: ${H_PADDING}px;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 12px;
  shadow-offset: 0px 4px;
  elevation: 3;
`;

const TopImage = styled.ImageBackground`
  width: 100%;
  height: 180px;
  overflow: hidden;
`;

const ImageOverlay = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0,0,0,0.6);
  padding: 12px;
`;

const EventBadge = styled.View`
  position: absolute;
  top: 16px;
  right: 16px;
  background-color: #FF6B6B;
  padding-horizontal: 12px;
  padding-vertical: 6px;
  border-radius: 20px;
`;

const EventBadgeText = styled.Text`
  color: #FFF;
  font-size: 12px;
  font-weight: bold;
`;

const TempleName = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #FFF;
`;

const CardBody = styled.View`
  padding: 16px;
`;

const ServiceName = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #6C63FF;
  margin-bottom: 8px;
`;

const Description = styled.Text`
  font-size: 14px;
  color: #666;
  line-height: 20;
  margin-bottom: 16px;
`;

const DetailsGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const DetailItem = styled.View`
  width: 48%;
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
`;

const DetailValue = styled.Text`
  font-size: 14px;
  color: #555;
  margin-left: 8px;
  flex: 1;
`;

const BookingFooter = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 16px;
  border-top-width: 1px;
  border-top-color: #EEE;
`;

const PriceContainer = styled.View`
  flex: 1;
`;

const StartingFrom = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
`;

const BookingPrice = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #E88F14;
`;

const BookButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: #E88F14;
  padding-vertical: 12px;
  padding-horizontal: 16px;
  border-radius: 12px;
  gap: 8px;
`;

const BookButtonText = styled.Text`
  color: #FFF;
  font-size: 14px;
  font-weight: bold;
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
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
`;

const EmptySubtext = styled.Text`
  font-size: 16px;
  color: #666;
  text-align: center;
  padding-horizontal: 20px;
`;

// Modal Styles
const ModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.View`
  background-color: white;
  border-radius: 20px;
  padding: 20px;
  width: 90%;
  max-height: 80%;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
  elevation: 5;
`;

const ModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #333;
`;

const ServiceModalName = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #E88F14;
  padding-horizontal: 20px;
  padding-vertical: 10px;
`;

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
  font-weight: bold;
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
  font-weight: bold;
  color: #E88F14;
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
  font-weight: bold;
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
  font-weight: bold;
`;

// Keep some StyleSheet styles for specific properties
const styles = StyleSheet.create({
  variationList: {
    padding: 20,
  },
  calendarModal: {
    maxHeight: '90%',
  },
  closeButton: {
    padding: 4,
  },
  calendar: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
});

export default Events;