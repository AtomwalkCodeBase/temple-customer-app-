import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import Toast from 'react-native-toast-message';
import styled from 'styled-components/native';

// Styled components
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
      shadow-offset: 0px 2px;
      shadow-opacity: 0.25;
      shadow-radius: 4px;
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
  align-items: center;
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-offset: 0px 2px;
      shadow-opacity: 0.1;
      shadow-radius: 4px;
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
  background-color: ${props => props.backgroundColor || '#6C63FF'};
`;

const ModalButtonText = styled.Text`
  color: #FFF;
  font-weight: 600;
  margin-left: 8px;
`;

const LoadingContainer = styled.View`
  padding: 20px;
  align-items: center;
  justify-content: center;
`;

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
      
      // Download the QR code
      const { uri } = await FileSystem.downloadAsync(remoteUri, fileUri);

      // Check if sharing is available
      if (!(await Sharing.isAvailableAsync())) {
        Toast.show({
          type: 'error',
          text1: 'Sharing not available',
          text2: 'Sharing is not available on this device',
        });
        return;
      }

      // Share the QR code
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `Booking QR Code - ${booking.ref_code}`,
      });
    } catch (error) {
      console.error("Error sharing QR code:", error);
      Toast.show({
        type: 'error',
        text1: 'Failed to share QR code',
        text2: 'Please try again later',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleShareDetails = () => {
    if (onShareDetails) {
      onShareDetails(booking);
    }
  };

  if (!booking) return null;

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <ModalContainer>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Booking Details</ModalTitle>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </ModalHeader>
            
            <ScrollView contentContainerStyle={styles.modalBody}>
              <ModalTempleName>{booking.service_data?.temple_name || 'Unknown Temple'}</ModalTempleName>
              <ModalServiceName>{booking.service_data?.name || 'Unknown Service'}</ModalServiceName>
              
              {(booking.qr_image || booking.booking_qrcode) ? (
                <QrContainer>
                  <Image 
                    source={{ uri: booking.qr_image || booking.booking_qrcode }} 
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
                  <ModalDetailValue>{booking.ref_code || 'N/A'}</ModalDetailValue>
                </ModalDetailRow>
                
                <ModalDetailRow>
                  <ModalDetailLabel>Date:</ModalDetailLabel>
                  <ModalDetailValue>{formatDate ? formatDate(booking.booking_date) : booking.booking_date || 'N/A'}</ModalDetailValue>
                </ModalDetailRow>
                
                <ModalDetailRow>
                  <ModalDetailLabel>Time:</ModalDetailLabel>
                  <ModalDetailValue>
                    {formatTime ? formatTime(booking.start_time) : booking.start_time || 'N/A'} - {formatTime ? formatTime(booking.end_time) : booking.end_time || 'N/A'}
                  </ModalDetailValue>
                </ModalDetailRow>

                <ModalDetailRow>
                  <ModalDetailLabel>Status:</ModalDetailLabel>
                  <ModalStatusBadge statusColor={getStatusColor ? getStatusColor(booking.status) : '#6C63FF'}>
                    <ModalStatusText>{booking.status_display || booking.status || 'N/A'}</ModalStatusText>
                  </ModalStatusBadge>
                </ModalDetailRow>

                <ModalDetailRow>
                  <ModalDetailLabel>Total Amount:</ModalDetailLabel>
                  <ModalDetailValue>
                    {calculateTotal ? calculateTotal(booking.quantity, booking.unit_price) : `₹${(parseInt(booking.quantity || 0) * parseFloat(booking.unit_price || 0)).toFixed(2)}`}
                  </ModalDetailValue>
                </ModalDetailRow>
              </ModalDetails>
              
              <ModalButtons>
                {(booking.qr_image || booking.booking_qrcode) && (
                  <ModalButton 
                    backgroundColor="#6C63FF" 
                    onPress={downloadAndShareQR}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="share-social-outline" size={20} color="#FFF" />
                        <ModalButtonText>Share QR Code</ModalButtonText>
                      </>
                    )}
                  </ModalButton>
                )}
                
                <ModalButton 
                  backgroundColor="#4CAF50" 
                  onPress={handleShareDetails}
                >
                  <Ionicons name="document-text-outline" size={20} color="#FFF" />
                  <ModalButtonText>Share Details</ModalButtonText>
                </ModalButton>
              </ModalButtons>
            </ScrollView>
          </ModalContent>
        </ModalContainer>
      </Modal>

      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  modalBody: {
    alignItems: 'center',
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
});

export default BookingDetails;