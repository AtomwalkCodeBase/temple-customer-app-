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
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import BookingDetails from '../../components/BookingDetails';
import Header from '../../components/Header';
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
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingDetailsVisible, setBookingDetailsVisible] = useState(false);

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

  const handleShareDetails = () => {
    if (onShareDetails) {
      onShareDetails(booking);
    }
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking.bookingData);
    setBookingDetailsVisible(true);
  };
  
  const closeBookingDetails = () => {
    setBookingDetailsVisible(false);
    setSelectedBooking(null);
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

  const showQRCode = (booking) => {
    setSelectedBooking(booking);
    setBookingDetailsVisible(true);
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
    <View style={styles.card}>
      <ImageBackground 
        source={{ uri: item.service_data.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
        style={styles.topImage}
        imageStyle={styles.topImageStyle}
      >
        <View style={styles.imageOverlay}>
          <Text style={styles.templeName}>{item.service_data.temple_name}</Text>
        </View>
      </ImageBackground>
      
      <View style={styles.cardBody}>
        <Text style={styles.serviceName}>{item.service_data.name}</Text>
        
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#5C6BC0" />
            <Text style={styles.detailValue}>{formatDate(item.booking_date)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#5C6BC0" />
            <Text style={styles.detailValue}>
              {formatTime(item.start_time)} - {formatTime(item.end_time)}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="hourglass-outline" size={16} color="#5C6BC0" />
            <Text style={styles.detailValue}>{item.service_data.duration_minutes} mins</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color="#5C6BC0" />
            <Text style={styles.detailValue}>{item.quantity} guests</Text>
          </View>
        </View>
        
        <View style={styles.bookingFooter}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status_display}</Text>
          </View>
          
          <View style={styles.footerRight}>
            <Text style={styles.bookingPrice}>{calculateTotal(item.quantity, item.unit_price)}</Text>
            {(item.qr_image || item.booking_qrcode) && (
              <TouchableOpacity style={styles.qrButton} onPress={() => showQRCode(item)}>
                <Ionicons name="qr-code-outline" size={24} color="#5C6BC0" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          {item.status.toUpperCase() ==="B" && (
            <TouchableOpacity style={styles.cancelButton} onPress={() => showCancelBooking(item)}>
              <Ionicons name="close-circle-outline" size={18} color="#F44336" />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.refCode}>Ref: {item.ref_code}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E88F14" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.statusBarBackground} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <Header
        type="type3"
        showBackButton={true}
        title="My Bookings"
        subtitle="Manage and track your spiritual journey"
        searchVisible={searchVisible}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onToggleSearch={toggleSearch}
        paddingTop={30}
      />

      {filteredBookings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Image 
            style={styles.emptyImage}
            source={{ uri: 'https://images.unsplash.com/photo-1567495242264-fe2a4a3ca2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
          />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No matching bookings found' : 'No bookings yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : 'Start exploring and book your next temple service!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.ref_code}
          contentContainerStyle={styles.listContent}
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

      <BookingDetails
        visible={bookingDetailsVisible}
        onClose={closeBookingDetails}
        booking={selectedBooking}
        onShareDetails={handleShareDetails}
        formatDate={formatDate}
        formatTime={formatTime}
        calculateTotal={calculateTotal}
        getStatusColor={getStatusColor}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Booking</Text>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedBooking && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.cancelWarning}>
                  <Ionicons name="warning" size={20} color="#FF9800" />
                  Are you sure you want to cancel this booking?
                </Text>
                
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingInfoTitle}>{selectedBooking.service_data.temple_name}</Text>
                  <Text style={styles.bookingInfoSubtitle}>{selectedBooking.service_data.name}</Text>
                  
                  <View style={styles.bookingInfoDetails}>
                    <Text style={styles.bookingInfoText}>
                      Date: {formatDate(selectedBooking.booking_date)}
                    </Text>
                    <Text style={styles.bookingInfoText}>
                      Time: {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                    </Text>
                    <Text style={styles.bookingInfoText}>
                      Reference: {selectedBooking.ref_code}
                    </Text>
                  </View>
                </View>
                <View style={styles.remarksContainer}>
                  <Text style={styles.remarksLabel}>Reason for cancellation (optional)</Text>
                  <TextInput
                    style={styles.remarksInput}
                    placeholder="Please provide a reason for cancellation"
                    value={cancelRemarks}
                    onChangeText={setCancelRemarks}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                <View style={styles.cancelModalButtons}>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButtonModal]} onPress={() => setCancelModalVisible(false)} disabled={cancelling}>
                    <Text style={styles.modalButtonText}>Go Back</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.modalButton, styles.confirmCancelButton]} onPress={handleCancelBooking} disabled={cancelling}>
                    {cancelling ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={20} color="#FFF" />
                        <Text style={styles.modalButtonText}>Confirm</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      <Toast />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f7fb',
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
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    paddingBottom: 12,
    backgroundColor: '#E88F14',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    zIndex: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSubtitle: {
    flex: 1,
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
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  searchInput: {
    color: '#FFF',
    fontSize: 16,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  card: {
    width: CARD_W,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: H_PADDING,
    overflow: "hidden", 
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  topImage: {
    height: 160,
    width: '100%',
  },
  topImageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  templeName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  cardBody: {
    padding: 16,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6C63FF',
    marginRight: 12,
  },
  qrButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F0F0FF',
  },
  actionButtons: {
    marginTop: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    marginBottom: 8,
  },
  cancelButtonText: {
    color: '#F44336',
    fontWeight: '600',
    marginLeft: 6,
  },
  refCode: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
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
  emptyImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#E88F14',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    alignItems: 'center',
  },
  modalTempleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalServiceName: {
    fontSize: 16,
    color: '#6C63FF',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  noQrContainer: {
    padding: 30,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  noQrText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  modalDetails: {
    width: '100%',
    marginBottom: 20,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  modalStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalStatusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  shareQrButton: {
    backgroundColor: '#6C63FF',
  },
  shareDetailsButton: {
    backgroundColor: '#4CAF50',
  },
  cancelWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    color: '#FF9800',
    fontWeight: '600',
  },
  bookingInfo: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  bookingInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  bookingInfoSubtitle: {
    fontSize: 14,
    color: '#6C63FF',
    marginBottom: 12,
  },
  bookingInfoDetails: {
    gap: 4,
  },
  bookingInfoText: {
    fontSize: 14,
    color: '#666',
  },
  remarksContainer: {
    marginBottom: 20,
    width: '100%',
  },
  remarksLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  cancelModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  cancelButtonModal: {
    backgroundColor: '#9E9E9E',
  },
  confirmCancelButton: {
    backgroundColor: '#F44336',
  },
});