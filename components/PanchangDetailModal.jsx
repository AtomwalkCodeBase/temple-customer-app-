// components/PanchangDetailModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PanchangDetailModal = ({
  modalVisible,
  setModalVisible,
  selectedDate,
  panchangData,
  formatDate
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{formatDate(selectedDate)}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#5e3c19" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {panchangData ? (
              <>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Tithi & Nakshatra</Text>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Tithi:</Text>
                    <Text style={styles.modalInfoValue}>{panchangData.tithi || 'N/A'}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Nakshatra:</Text>
                    <Text style={styles.modalInfoValue}>{panchangData.nakshatra || 'N/A'}</Text>
                  </View>
                  {panchangData.yoga && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Yoga:</Text>
                      <Text style={styles.modalInfoValue}>{panchangData.yoga}</Text>
                    </View>
                  )}
                  {panchangData.karana && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Karana:</Text>
                      <Text style={styles.modalInfoValue}>{panchangData.karana}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Timings</Text>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Sunrise:</Text>
                    <Text style={styles.modalInfoValue}>{panchangData.sunrise || 'N/A'}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Sunset:</Text>
                    <Text style={styles.modalInfoValue}>{panchangData.sunset || 'N/A'}</Text>
                  </View>
                  {panchangData.moonrise && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Moonrise:</Text>
                      <Text style={styles.modalInfoValue}>{panchangData.moonrise}</Text>
                    </View>
                  )}
                  {panchangData.moonset && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Moonset:</Text>
                      <Text style={styles.modalInfoValue}>{panchangData.moonset}</Text>
                    </View>
                  )}
                </View>

                {panchangData.festivals && panchangData.festivals.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Festivals</Text>
                    {panchangData.festivals.map((festival, index) => (
                      <View key={index} style={styles.modalFestivalItem}>
                        <Ionicons name="star" size={16} color="#E88F14" />
                        <Text style={styles.modalFestivalText}>{festival}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {panchangData.muhurats && panchangData.muhurats.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Auspicious Timings</Text>
                    {panchangData.muhurats.map((muhurat, index) => (
                      <View key={index} style={styles.modalInfoRow}>
                        <Ionicons name="time" size={16} color="#E88F14" style={{marginRight: 8}} />
                        <Text style={styles.modalInfoValue}>{muhurat}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.modalNoData}>No details available for this date</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5e3c19',
    flex: 1,
    marginRight: 16,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E88F14',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    paddingBottom: 8,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontSize: 16,
    color: '#7e5c3a',
    fontWeight: '500',
    flex: 1,
  },
  modalInfoValue: {
    fontSize: 16,
    color: '#5e3c19',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
  },
  modalFestivalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalFestivalText: {
    fontSize: 16,
    color: '#5e3c19',
    marginLeft: 8,
  },
  modalNoData: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
});

export default PanchangDetailModal;