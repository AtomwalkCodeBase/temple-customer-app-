import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from "expo-sharing";
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import ToastMsg from "../../components/ToastMsg";
import { cancelBooking, getBookingList } from '../../services/productService';

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

  const shareBookingDetails = async () => {
    if (!selectedBooking) return;

    try {
      await Share.share({
        message: `Booking Details:
Temple: ${selectedBooking.service_data.temple_name}
Service: ${selectedBooking.service_data.name}
Date: ${formatDate(selectedBooking.booking_date)}
Time: ${formatTime(selectedBooking.start_time)} - ${formatTime(selectedBooking.end_time)}
Reference: ${selectedBooking.ref_code}
Status: ${selectedBooking.status_display}
Total: ${calculateTotal(selectedBooking.quantity, selectedBooking.unit_price)}`
      });
    } catch (error) {
      console.error('Error sharing booking details:', error);
      ToastMsg("Failed to share booking details", "error");
    }
  };

  const canCancelBooking = (booking) => {
    // Allow cancellation for ALL service types (halls, puja, events) with booked or pending status
    // and only if the booking date is in the future
    const isCancellableStatus = booking.status === 'B' || booking.status === 'P';
    
    // Parse the booking date properly (format: DD-MM-YYYY)
    const [day, month, year] = booking.booking_date.split('-');
    const bookingDate = new Date(`${year}-${month}-${day}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
    
    const isFutureDate = bookingDate >= today;
    
    return isCancellableStatus && isFutureDate;
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <TouchableOpacity onPress={() => openImage(item.service_data.image)}>
        <Image 
          source={{ uri: item.service_data.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }} 
          style={styles.bookingImage} 
        />
        <View style={styles.imageOverlay}>
          <Text style={styles.templeName}>{item.service_data.temple_name}</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.bookingDetails}>
        <Text style={styles.serviceName}>{item.service_data.name}</Text>
        
        <View style={styles.detailsContainer}>
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
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status_display}</Text>
          </View>
          
          <View style={styles.footerRight}>
            <Text style={styles.bookingPrice}>{calculateTotal(item.quantity, item.unit_price)}</Text>
            {(item.qr_image || item.booking_qrcode) && (
              <TouchableOpacity 
                style={styles.qrButton}
                onPress={() => showQRCode(item)}
              >
                <Ionicons name="qr-code-outline" size={24} color="#5C6BC0" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          {canCancelBooking(item) && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => showCancelBooking(item)}
            >
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
        <ActivityIndicator size="large" color="#6C63FF" />
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.header}>My Bookings</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#6C63FF" />
        </TouchableOpacity>
      </View>
      
      {bookings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1567495242264-fe2a4a3ca2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyText}>No bookings yet</Text>
          <Text style={styles.emptySubtext}>Start exploring and book your next temple service!</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.ref_code}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#6C63FF']}
              tintColor={'#6C63FF'}
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
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedBooking && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.modalTempleName}>{selectedBooking.service_data.temple_name}</Text>
                <Text style={styles.modalServiceName}>{selectedBooking.service_data.name}</Text>
                
                {(selectedBooking.qr_image || selectedBooking.booking_qrcode) ? (
                  <View style={styles.qrContainer}>
                    <Image 
                      source={{ uri: selectedBooking.qr_image || selectedBooking.booking_qrcode }} 
                      style={styles.qrImage} 
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={styles.noQrContainer}>
                    <Ionicons name="qr-code-outline" size={64} color="#CCC" />
                    <Text style={styles.noQrText}>QR Code Not Available</Text>
                  </View>
                )}
                
                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Reference Code:</Text>
                    <Text style={styles.modalDetailValue}>{selectedBooking.ref_code}</Text>
                  </View>
                  
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Date:</Text>
                    <Text style={styles.modalDetailValue}>{formatDate(selectedBooking.booking_date)}</Text>
                  </View>
                  
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Time:</Text>
                    <Text style={styles.modalDetailValue}>
                      {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                    </Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Status:</Text>
                    <View
                      style={[
                        styles.modalStatusBadge,
                        { backgroundColor: getStatusColor(selectedBooking.status) },
                      ]}
                    >
                      <Text style={styles.modalStatusText}>{selectedBooking.status_display}</Text>
                    </View>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Total Amount:</Text>
                    <Text style={styles.modalDetailValue}>
                      {calculateTotal(selectedBooking.quantity, selectedBooking.unit_price)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalButtons}>
                  {(selectedBooking.qr_image || selectedBooking.booking_qrcode) && (
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.shareQrButton]}
                      onPress={downloadAndShareQR}
                    >
                      <Ionicons name="share-social-outline" size={20} color="#FFF" />
                      <Text style={styles.modalButtonText}>Share QR Code</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.shareDetailsButton]}
                    onPress={shareBookingDetails}
                    >
                    <Ionicons name="document-text-outline" size={20} color="#FFF" />
                    <Text style={styles.modalButtonText}>Share Details</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Cancel Booking Modal */}
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
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButtonModal]}
                    onPress={() => setCancelModalVisible(false)}
                    disabled={cancelling}
                  >
                    <Text style={styles.modalButtonText}>Go Back</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmCancelButton]}
                    onPress={handleCancelBooking}
                    disabled={cancelling}
                  >
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#F8F9FA',
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingImage: {
    width: '100%',
    height: 180,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
  },
  templeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  bookingDetails: {
    padding: 20,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C63FF',
    marginBottom: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
    backgroundColor: '#6C63FF',
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
  // Modal Styles
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  shareQrButton: {
    backgroundColor: '#6C63FF',
  },
  shareDetailsButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Cancel Modal Styles
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