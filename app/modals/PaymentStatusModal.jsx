// app/modals/PaymentStatusModal.jsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

const PaymentStatusModal = ({ visible, status = 'success', onClose, onDateSelect }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        if (onClose) {
          onClose();
        }
        router.push('/screens/MyBookings');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          mainIcon: 'notifications-outline',
          statusIcon: 'checkmark',
          color: '#22C55E',
          title: 'Your Booking is Confirmed..!',
          subtitle: '',
        };
      case 'processing':
        return {
          mainIcon: 'notifications-outline',
          statusIcon: null,
          color: '#F59E0B',
          title: 'Payment Pending',
          subtitle: 'Check My Bookings for the Booking update',
        };
      case 'failed':
        return {
          mainIcon: 'notifications-outline',
          statusIcon: 'close',
          color: '#EF4444',
          title: 'Payment failed',
          subtitle: 'Check My Bookings for the Booking update',
        };
      default:
        return {
          mainIcon: 'notifications-outline',
          statusIcon: 'checkmark',
          color: '#22C55E',
          title: 'Your Booking is Confirmed..!',
          subtitle: '',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={[styles.bellContainer, { backgroundColor: `${config.color}20` }]}>
            <Ionicons 
              name={config.mainIcon} 
              size={48} 
              color={config.color} 
              style={styles.bellIcon}
            />
            
            {config.statusIcon && (
              <View style={[styles.statusIndicator, { backgroundColor: config.color }]}>
                <Ionicons 
                  name={config.statusIcon} 
                  size={16} 
                  color="white" 
                />
              </View>
            )}
            
            {status === 'processing' && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={config.color} />
              </View>
            )}
          </View>
          
          <Text style={styles.title}>{config.title}</Text>
          {config.subtitle ? (
            <Text style={styles.subtitle}>{config.subtitle}</Text>
          ) : null}
          
          <Text style={styles.redirectText}>Redirecting to bookings...</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  bellContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  redirectText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default PaymentStatusModal;