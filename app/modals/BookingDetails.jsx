import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView, Share, StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from 'react-native-toast-message';

const BookingDetails = ({
  visible,
  onClose,
  booking,
  onShareDetails,
  formatDate,
  formatTime,
  calculateTotal,
  getStatusColor,
  qrModalVisible,
  setQrModalVisible
}) => {
  const [downloading, setDownloading] = React.useState(false);

  const downloadAndShareQR = async () => {
    if (!booking?.qr_image && !booking?.booking_qrcode) {
      Toast.show({
        type: 'error',
        text1: 'QR Code not available',
        text2: 'No QR code image found for this booking',
      });
      return;
    }

    setDownloading(true);
    try {
      const remoteUri = booking.qr_image || booking.booking_qrcode;
      const fileUri = FileSystem.documentDirectory + "qr_code.png";
      
      const { uri } = await FileSystem.downloadAsync(remoteUri, fileUri);

      if (!(await Sharing.isAvailableAsync())) {
        Toast.show({
          type: 'error',
          text1: 'Sharing not available',
          text2: 'Sharing is not available on this device',
        });
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `Booking QR Code - ${booking.ref_code}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to share QR code',
        text2: 'Please try again later',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleShareDetails = async (booking) => {
  if (!booking) return;

  const message = `
Booking Details:
Temple: ${booking.service_data?.temple_name || "N/A"}
Service: ${booking.service_data?.name || "N/A"}
Date: ${booking.booking_date || "N/A"}
Time: ${booking.start_time || ""} - ${booking.end_time || ""}
Status: ${booking.status || "N/A"}
Reference: ${booking.ref_code || "N/A"}
`;

  try {
    await Share.share({
      message,
      title: "Booking Details",
    });
  } catch (err) {
    console.log("Share failed:", err);
    Toast.show({
      type: "error",
      text1: "Failed to share details",
      text2: "Please try again later",
    });
  }
};



  if (!booking) return null;

  const getStatusColorValue = (status) => {
    if (getStatusColor) return getStatusColor(status);
    
    switch (status?.toLowerCase()) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#6C63FF';
    }
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={true}
              indicatorStyle="default"
            >
              <Text style={styles.templeName}>{booking.service_data?.temple_name || 'Unknown Temple'}</Text>
              <Text style={styles.serviceName}>{booking.service_data?.name || 'Unknown Service'}</Text>
              
              {(booking.qr_image || booking.booking_qrcode) ? (
                <View style={styles.qrContainer}>
                  <Image 
                    source={{ uri: booking.qr_image || booking.booking_qrcode }} 
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
              
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference Code:</Text>
                  <Text style={styles.detailValue}>{booking.ref_code || 'N/A'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate ? formatDate(booking.booking_date) : booking.booking_date || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>
                    {formatTime ? formatTime(booking.start_time) : booking.start_time || 'N/A'} - 
                    {formatTime ? formatTime(booking.end_time) : booking.end_time || 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColorValue(booking.status) }]}>
                    <Text style={styles.statusText}>
                      {booking.status_display || booking.status || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValue}>
                    {calculateTotal ? 
                      calculateTotal(booking.quantity, booking.unit_price) : 
                      `₹${(parseInt(booking.quantity || 0) * parseFloat(booking.unit_price || 0)).toFixed(2)}`
                    }
                  </Text>
                </View>
              </View>
              
              <View style={styles.buttonsContainer}>
                {(booking.qr_image || booking.booking_qrcode) && (
                  <TouchableOpacity 
                    style={[styles.button, styles.primaryButton, downloading && styles.buttonDisabled]}
                    onPress={downloadAndShareQR}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="share-social-outline" size={20} color="#FFF" />
                        <Text style={styles.buttonText}>Share QR Code</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                
                {/* <TouchableOpacity 
                  style={[styles.button, styles.successButton]}
                  onPress={handleShareDetails}
                >
                  <Ionicons name="document-text-outline" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Share Details</Text>
                </TouchableOpacity> */}
                <TouchableOpacity 
                  style={[styles.button, styles.successButton]}
                  onPress={() => handleShareDetails(booking)}   // ✅ pass booking
                >
                  <Ionicons name="document-text-outline" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Share Details</Text>
                </TouchableOpacity>

              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
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
  closeButton: {
    padding: 4,
  },
  modalBody: {
    alignItems: 'center',
  },
  templeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    color: '#6C63FF',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  noQrContainer: {
    padding: 30,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  noQrText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
});

export default BookingDetails;