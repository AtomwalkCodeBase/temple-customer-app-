import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
    Linking,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import Toast from 'react-native-toast-message';
import styled from 'styled-components/native';
import ToastMsg from "../../components/ToastMsg";
import { cancelBooking, getBookingList } from '../../services/productService';
const { width } = Dimensions.get("window");
const H_PADDING = 16;
const CARD_W = Math.floor(width - H_PADDING * 2);

export default function Booking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      setSearchVisible(false);
      setSearchQuery('');
    }, [])
  );

  const fetchBookings = async () => {
    const CUST_REF_CODE = await AsyncStorage.getItem("ref_code");
    try {
      setError(null);
      const response = await getBookingList(CUST_REF_CODE);
      const data = await response.data;
      setBookings(data.reverse());
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings. Please try again.');
      ToastMsg("Failed to load bookings. Please try again.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const formatDate = (dateString) => {
    const [day, month, year] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    return hour > 12 
      ? `${hour - 12}:${minutes} PM` 
      : `${hour === 0 ? 12 : hour}:${minutes} AM`;
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const calculateTotal = (quantity, unitPrice) => {
    return formatCurrency(parseInt(quantity, 10) * parseFloat(unitPrice));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'B': // BOOKED
        return '#4CAF50';
      case 'P': // PENDING
        return '#FF9800';
      case 'C': // COMPLETED
        return '#2196F3';
      case 'X': // CANCELLED
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const openImage = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error('Failed to open image:', err);
        ToastMsg("Failed to open image", "error");
      });
    }
  };

  const showQRCode = (booking) => {
    setSelectedBooking(booking);
    setQrModalVisible(true);
  };

  const showCancelBooking = (booking) => {
    setSelectedBooking(booking);
    setCancelRemarks('');
    setCancelModalVisible(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) {
      ToastMsg("No booking selected for cancellation", "error");
      return;
    }
    
    setCancelling(true);
    const customer_refcode = await AsyncStorage.getItem("ref_code");
    try {
      const cancelData = {
        cust_ref_code: customer_refcode,
        call_mode: "CANCEL",
        booking_ref_code: selectedBooking.ref_code,
        remarks: cancelRemarks?.trim() || ""   // optional
      };
      const response = await cancelBooking(cancelData);
      if (response?.status === 200) {
        ToastMsg("Booking cancelled successfully");
        setCancelModalVisible(false);
        fetchBookings();
      } else {
        ToastMsg(error?.message || "Failed to cancel booking", "error");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error.response?.data || error.message);
      ToastMsg("Failed to cancel booking. Please try again.", "error");
    } finally {
      setCancelling(false);
    }
  };

  const downloadAndShareQR = async () => {
    if (!selectedBooking?.qr_image) {
      ToastMsg("QR code image is not available for sharing", "error");
      return;
    }
    
    try {
      const remoteUri = selectedBooking.qr_image.startsWith("http")
        ? selectedBooking.qr_image
        : `https://temple.atomwalk.com/${selectedBooking.qr_image}`;
      const fileUri = FileSystem.documentDirectory + "qr_code.png";
      const { uri } = await FileSystem.downloadAsync(remoteUri, fileUri);
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        ToastMsg("Sorry, we need media library permissions to share the QR code", "error");
        return;
      }
      
      if (!(await Sharing.isAvailableAsync())) {
        ToastMsg("Sharing is not available on this device", "error");
        return;
      }
      
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `Booking QR Code - ${selectedBooking.ref_code}`,
      });
    } catch (error) {
      console.error("Error sharing QR code:", error);
      ToastMsg("Failed to share QR code. Please try again.", "error");
    }
  };

  const shareBookingDetails = async (booking) => {
    if (!booking) return;
    
    try {
      await Share.share({
        message: `Booking Details:
        Temple: ${booking.service_data.temple_name}
        Service: ${booking.service_data.name}
        Date: ${formatDate(booking.booking_date)}
        Time: ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}
        Reference: ${booking.ref_code}
        Status: ${booking.status_display}
        Total: ${calculateTotal(booking.quantity, booking.unit_price)}`
      });
    } catch (error) {
      console.error('Error sharing booking details:', error);
      ToastMsg("Failed to share booking details", "error");
    }
  };

  const canCancelBooking = (booking) => {
    const isCancellableStatus = booking.status == 'B';
    
    const [day, month, year] = booking.booking_date.split('-');
    const bookingDate = new Date(`${year}-${month}-${day}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isFutureDate = bookingDate >= today;
    
    return isCancellableStatus && isFutureDate;
  };

  const filteredBookings = searchQuery
    ? bookings.filter(booking => 
        booking.service_data.temple_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.service_data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.ref_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.booking_date.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookings;

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchQuery('');
    }
  };

  const renderBookingItem = ({ item }) => (
    <Card>
      <TopImage
        source={{ uri: item.service_data.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
        imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <ImageOverlay>
          <TempleName>{item.service_data.temple_name}</TempleName>
        </ImageOverlay>
      </TopImage>
      
      <CardBody>
        <ServiceName>{item.service_data.name}</ServiceName>
        
        <DetailsGrid>
          <DetailItem>
            <Ionicons name="calendar-outline" size={16} color="#5C6BC0" />
            <DetailValue>{formatDate(item.booking_date)}</DetailValue>
          </DetailItem>
          
          <DetailItem>
            <Ionicons name="time-outline" size={16} color="#5C6BC0" />
            <DetailValue>
              {formatTime(item.start_time)} - {formatTime(item.end_time)}
            </DetailValue>
          </DetailItem>
          
          <DetailItem>
            <Ionicons name="hourglass-outline" size={16} color="#5C6BC0" />
            <DetailValue>{item.service_data.duration_minutes} mins</DetailValue>
          </DetailItem>
          
          <DetailItem>
            <Ionicons name="people-outline" size={16} color="#5C6BC0" />
            <DetailValue>{item.quantity} guests</DetailValue>
          </DetailItem>
        </DetailsGrid>
        
        <BookingFooter>
          <StatusBadge statusColor={getStatusColor(item.status)}>
            <StatusText>{item.status_display}</StatusText>
          </StatusBadge>
          
          <FooterRight>
            <BookingPrice>{calculateTotal(item.quantity, item.unit_price)}</BookingPrice>
            {(item.qr_image || item.booking_qrcode) && (
              <QrButton onPress={() => showQRCode(item)}>
                <Ionicons name="qr-code-outline" size={24} color="#5C6BC0" />
              </QrButton>
            )}
          </FooterRight>
        </BookingFooter>
        
        <ActionButtons>
          {item.status.toUpperCase() ==="B" && (
            <CancelButton onPress={() => showCancelBooking(item)}>
              <Ionicons name="close-circle-outline" size={18} color="#F44336" />
              <CancelButtonText>Cancel Booking</CancelButtonText>
            </CancelButton>
          )}
        </ActionButtons>
        
        <RefCode>Ref: {item.ref_code}</RefCode>
      </CardBody>
    </Card>
  );

  if (loading) {
    return (
      <CenterContainer>
        <ActivityIndicator size="large" color="#E88F14" />
        <LoadingText>Loading your bookings...</LoadingText>
      </CenterContainer>
    );
  }

  if (error) {
    return (
      <CenterContainer>
        <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
        <ErrorText>{error}</ErrorText>
        <RetryButton onPress={fetchBookings}>
          <RetryButtonText>Try Again</RetryButtonText>
        </RetryButton>
      </CenterContainer>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <StatusBarBackground />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <Header>
        <Row>
          {/* Left Column: Title + Subtitle */}
          <TitleSubtitle>
            <Title>📋 My Bookings</Title>
            <Subtitle>Manage and track your spiritual journey</Subtitle>
          </TitleSubtitle>
          {/* Right Column: Search Icon */}
          <SearchButton onPress={toggleSearch}>
            <Ionicons 
              name={searchVisible ? "close" : "search"} 
              size={24} 
              color="#FFF" 
            />
          </SearchButton>
        </Row>
        {/* Search bar appears below row when active */}
        {searchVisible && (
          <SearchContainer>
            <SearchInput
              placeholder="Search bookings..."
              placeholderTextColor="#11080892"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
          </SearchContainer>
        )}
      </Header>
      
      {filteredBookings.length === 0 ? (
        <CenterContainer>
          <EmptyImage
            source={{ uri: 'https://images.unsplash.com/photo-1567495242264-fe2a4a3ca2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
          />
          <EmptyText>
            {searchQuery ? 'No matching bookings found' : 'No bookings yet'}
          </EmptyText>
          <EmptySubtext>
            {searchQuery ? 'Try a different search term' : 'Start exploring and book your next temple service!'}
          </EmptySubtext>
        </CenterContainer>
      ) : (
        <List
          data={filteredBookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.ref_code}
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
        />
      )}
      
      {/* QR Code Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <ModalContainer>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Booking Details</ModalTitle>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </ModalHeader>
            
            {selectedBooking && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                <ModalTempleName>{selectedBooking.service_data.temple_name}</ModalTempleName>
                <ModalServiceName>{selectedBooking.service_data.name}</ModalServiceName>
                
                {(selectedBooking.qr_image || selectedBooking.booking_qrcode) ? (
                  <QrContainer>
                    <Image 
                      source={{ uri: selectedBooking.qr_image || selectedBooking.booking_qrcode }} 
                      style={styles.qrImage} 
                      resizeMode="contain"
                    />
                  </QrContainer>
                ) : (
                  <NoQrContainer>
                    <Ionicons name="qr-code-outline" size={64} color="#CCC" />
                    <NoQrText>QR Code Not Available</NoQrText>
                  </NoQrContainer>
                )}
                
                <ModalDetails>
                  <ModalDetailRow>
                    <ModalDetailLabel>Reference Code:</ModalDetailLabel>
                    <ModalDetailValue>{selectedBooking.ref_code}</ModalDetailValue>
                  </ModalDetailRow>
                  
                  <ModalDetailRow>
                    <ModalDetailLabel>Date:</ModalDetailLabel>
                    <ModalDetailValue>{formatDate(selectedBooking.booking_date)}</ModalDetailValue>
                  </ModalDetailRow>
                  
                  <ModalDetailRow>
                    <ModalDetailLabel>Time:</ModalDetailLabel>
                    <ModalDetailValue>
                      {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                    </ModalDetailValue>
                  </ModalDetailRow>
                  <ModalDetailRow>
                    <ModalDetailLabel>Status:</ModalDetailLabel>
                    <ModalStatusBadge statusColor={getStatusColor(selectedBooking.status)}>
                      <ModalStatusText>{selectedBooking.status_display}</ModalStatusText>
                    </ModalStatusBadge>
                  </ModalDetailRow>
                  <ModalDetailRow>
                    <ModalDetailLabel>Total Amount:</ModalDetailLabel>
                    <ModalDetailValue>
                      {calculateTotal(selectedBooking.quantity, selectedBooking.unit_price)}
                    </ModalDetailValue>
                  </ModalDetailRow>
                </ModalDetails>
                
                <ModalButtons>
                  {(selectedBooking.qr_image || selectedBooking.booking_qrcode) && (
                    <ModalButton style={styles.shareQrButton} onPress={downloadAndShareQR}>
                      <Ionicons name="share-social-outline" size={20} color="#FFF" />
                      <ModalButtonText>Share QR Code</ModalButtonText>
                    </ModalButton>
                  )}
                  
                  <ModalButton style={styles.shareDetailsButton} onPress={shareBookingDetails}>
                    <Ionicons name="document-text-outline" size={20} color="#FFF" />
                    <ModalButtonText>Share Details</ModalButtonText>
                  </ModalButton>
                </ModalButtons>
              </ScrollView>
            )}
          </ModalContent>
        </ModalContainer>
      </Modal>
      
      {/* Cancel Booking Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <ModalContainer>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Cancel Booking</ModalTitle>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </ModalHeader>
            
            {selectedBooking && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                <CancelWarning>
                  <Ionicons name="warning" size={20} color="#FF9800" />
                  Are you sure you want to cancel this booking?
                </CancelWarning>
                
                <BookingInfo>
                  <BookingInfoTitle>{selectedBooking.service_data.temple_name}</BookingInfoTitle>
                  <BookingInfoSubtitle>{selectedBooking.service_data.name}</BookingInfoSubtitle>
                  
                  <BookingInfoDetails>
                    <BookingInfoText>
                      Date: {formatDate(selectedBooking.booking_date)}
                    </BookingInfoText>
                    <BookingInfoText>
                      Time: {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                    </BookingInfoText>
                    <BookingInfoText>
                      Reference: {selectedBooking.ref_code}
                    </BookingInfoText>
                  </BookingInfoDetails>
                </BookingInfo>
                <RemarksContainer>
                  <RemarksLabel>Reason for cancellation (optional)</RemarksLabel>
                  <RemarksInput
                    placeholder="Please provide a reason for cancellation"
                    value={cancelRemarks}
                    onChangeText={setCancelRemarks}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </RemarksContainer>
                <CancelModalButtons>
                  <ModalButton style={styles.cancelButtonModal} onPress={() => setCancelModalVisible(false)} disabled={cancelling}>
                    <ModalButtonText>Go Back</ModalButtonText>
                  </ModalButton>
                  
                  <ModalButton style={styles.confirmCancelButton} onPress={handleCancelBooking} disabled={cancelling}>
                    {cancelling ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={20} color="#FFF" />
                        <ModalButtonText>Confirm</ModalButtonText>
                      </>
                    )}
                  </ModalButton>
                </CancelModalButtons>
              </ScrollView>
            )}
          </ModalContent>
        </ModalContainer>
      </Modal>
      
      <Toast />
    </Screen>
  );
}

// Styled components with proper safe area and status bar handling
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

const Header = styled.View`
  padding: 16px;
  padding-top: ${Platform.OS === 'ios' ? 60 : 16}px;
  padding-bottom: 12px;
  background-color: #E88F14;
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 18px;
  z-index: 2;
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
  margin-top: 8px;
`;

const Subtitle = styled.Text`
  color: #e9e6ff;
  font-size: 12px;
  margin-top: 6px;
`;

const SearchButton = styled.TouchableOpacity`
  padding: 8px;
`;

const SearchContainer = styled.View`
  margin-top: 10px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px;
`;

const SearchInput = styled.TextInput`
  color: #FFF;
  font-size: 16px;
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

const TopImage = styled(ImageBackground)`
  height: 160px;
  width: 100%;
`;

const ImageOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.3);
  justify-content: flex-end;
  padding: 16px;
`;

const TempleName = styled.Text`
  color: #FFF;
  font-size: 20px;
  font-weight: 700;
`;

const CardBody = styled.View`
  padding: 16px;
`;

const ServiceName = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #2D3436;
  margin-bottom: 12px;
`;

const DetailsGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const DetailItem = styled.View`
  flex-direction: row;
  align-items: center;
  width: 48%;
  margin-bottom: 8px;
`;

const DetailValue = styled.Text`
  font-size: 14px;
  color: #666;
  margin-left: 6px;
`;

const BookingFooter = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const StatusBadge = styled.View`
  padding-horizontal: 10px;
  padding-vertical: 4px;
  border-radius: 8px;
  background-color: ${props => props.statusColor};
`;

const StatusText = styled.Text`
  color: #FFF;
  font-size: 12px;
  font-weight: 600;
`;

const FooterRight = styled.View`
  flex-direction: row;
  align-items: center;
`;

const BookingPrice = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #6C63FF;
  margin-right: 12px;
`;

const QrButton = styled.TouchableOpacity`
  padding: 8px;
  border-radius: 12px;
  background-color: #F0F0FF;
`;

const ActionButtons = styled.View`
  margin-top: 12px;
`;

const CancelButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background-color: #FFF;
  border-width: 1px;
  border-color: #F44336;
  border-radius: 8px;
  margin-bottom: 8px;
`;

const CancelButtonText = styled.Text`
  color: #F44336;
  font-weight: 600;
  margin-left: 6px;
`;

const RefCode = styled.Text`
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  font-style: italic;
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

const EmptyImage = styled.Image`
  width: 200px;
  height: 200px;
  border-radius: 100px;
  margin-bottom: 20px;
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

const ErrorText = styled.Text`
  font-size: 16px;
  color: #F44336;
  margin-bottom: 16px;
  text-align: center;
  margin-top: 12px;
`;

const RetryButton = styled.TouchableOpacity`
  background-color: #E88F14;
  padding-horizontal: 24px;
  padding-vertical: 12px;
  border-radius: 12px;
  flex-direction: row;
  align-items: center;
`;

const RetryButtonText = styled.Text`
  color: #FFF;
  font-weight: 600;
  margin-left: 8px;
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
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-offset: { width: 0, height: 2 };
      shadow-opacity: 0.25;
      shadow-radius: 4;
    `,
    android: `
      elevation: 5;
    `,
  })}
`;

const ModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ModalTitle = styled.Text`
  font-size: 24px;
  font-weight: 700;
  color: #333;
`;

const ModalTempleName = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 4px;
`;

const ModalServiceName = styled.Text`
  font-size: 16px;
  color: #6C63FF;
  text-align: center;
  margin-bottom: 20px;
`;

const QrContainer = styled.View`
  padding: 20px;
  background-color: #FFF;
  border-radius: 12px;
  margin-bottom: 20px;
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-offset: { width: 0, height: 2 };
      shadow-opacity: 0.1;
      shadow-radius: 4;
    `,
    android: `
      elevation: 2;
    `,
  })}
`;

const NoQrContainer = styled.View`
  padding: 30px;
  background-color: #F8F9FA;
  border-radius: 12px;
  margin-bottom: 20px;
  align-items: center;
`;

const NoQrText = styled.Text`
  margin-top: 10px;
  color: #999;
  font-size: 14px;
`;

const ModalDetails = styled.View`
  width: 100%;
  margin-bottom: 20px;
`;

const ModalDetailRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 8px;
  border-bottom-width: 1px;
  border-bottom-color: #EEE;
`;

const ModalDetailLabel = styled.Text`
  font-size: 14px;
  color: #666;
  font-weight: 500;
`;

const ModalDetailValue = styled.Text`
  font-size: 14px;
  color: #333;
  font-weight: 600;
`;

const ModalStatusBadge = styled.View`
  padding-horizontal: 10px;
  padding-vertical: 4px;
  border-radius: 8px;
  background-color: ${props => props.statusColor};
`;

const ModalStatusText = styled.Text`
  color: #FFF;
  font-size: 12px;
  font-weight: 600;
`;

const ModalButtons = styled.View`
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  gap: 10px;
`;

const ModalButton = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-vertical: 12px;
  border-radius: 12px;
`;

const ModalButtonText = styled.Text`
  color: #FFF;
  font-weight: 600;
  margin-left: 8px;
`;

// Cancel Modal Styles
const CancelWarning = styled.Text`
  flex-direction: row;
  align-items: center;
  background-color: #FFF3E0;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
  color: #FF9800;
  font-weight: 600;
`;

const BookingInfo = styled.View`
  background-color: #F8F9FA;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
`;

const BookingInfoTitle = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
`;

const BookingInfoSubtitle = styled.Text`
  font-size: 14px;
  color: #6C63FF;
  margin-bottom: 12px;
`;

const BookingInfoDetails = styled.View`
  gap: 4px;
`;

const BookingInfoText = styled.Text`
  font-size: 14px;
  color: #666;
`;

const RemarksContainer = styled.View`
  margin-bottom: 20px;
  width: 100%;
`;

const RemarksLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const RemarksInput = styled.TextInput`
  border-width: 1px;
  border-color: #DDD;
  border-radius: 12px;
  padding: 15px;
  font-size: 14px;
  min-height: 100px;
  text-align-vertical: top;
`;

const CancelModalButtons = styled.View`
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  gap: 10px;
`;

// Keep some StyleSheet styles for specific properties
const styles = StyleSheet.create({
  modalBody: {
    alignItems: 'center',
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  shareQrButton: {
    backgroundColor: '#6C63FF',
  },
  shareDetailsButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonModal: {
    backgroundColor: '#9E9E9E',
  },
  confirmCancelButton: {
    backgroundColor: '#F44336',
  },
});