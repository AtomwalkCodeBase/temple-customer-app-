import { Ionicons } from "@expo/vector-icons";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get('window');

const ServiceDetails = ({ 
  selectedService, 
  modalVisible, 
  setModalVisible, 
  handleVariationSelect 
}) => {
  return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContentFull} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Service Details</Text>
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.detailsScroll}>
            {/* Title + Meta */}
            <View style={styles.section}>
              <Text style={styles.detailTitle}>{selectedService?.name || 'Service'}</Text>
              <View style={styles.metaRow}>
                <View style={styles.pill}>
                  <Ionicons name="home-outline" size={14} color="#A04E00" />
                  <Text style={styles.pillText}>
                    {selectedService?.temple_name || 'Temple'}
                  </Text>
                </View>
                <View style={styles.pill}>
                  <Ionicons name="pricetag-outline" size={14} color="#A04E00" />
                  <Text style={styles.pillText}>
                    {(selectedService?.service_type || 'SERVICE').toString().replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>

            {/* About */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.aboutText}>
                {selectedService?.description?.trim() || 'Details will be provided at booking.'}
              </Text>
            </View>

            {/* Gallery */}
            {!!(selectedService?.gallery?.length || selectedService?.images?.length || selectedService?.image) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gallery</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(selectedService?.gallery || selectedService?.images || [selectedService?.image])
                    .filter(Boolean)
                    .map((img, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: typeof img === 'string' ? img : img?.url }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                      />
                    ))
                  }
                </ScrollView>
              </View>
            )}

            {/* Pricing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Starting From:</Text>
                <Text style={styles.priceValue}>
                  {selectedService?.service_variation_list?.length > 0
                    ? `₹${Math.min(...selectedService.service_variation_list.map(v => parseFloat(v.base_price))).toFixed(2)}`
                    : `₹${parseFloat(selectedService?.base_price || 0).toFixed(2)}`}
                </Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Capacity:</Text>
                <Text style={styles.priceValue}>
                  {selectedService?.capacity || 'N/A'} people
                </Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Duration:</Text>
                <Text style={styles.priceValue}>
                  {selectedService?.duration_minutes ? `${selectedService.duration_minutes} mins` : 'N/A'}
                </Text>
              </View>

              <Text style={styles.priceNote}>
                Final price depends on the selected package and date/time availability.
              </Text>
            </View>

            {/* Variations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Service Variations</Text>
              {(selectedService?.service_variation_list?.length > 0) ? (
                selectedService.service_variation_list.map((variation) => (
                  <TouchableOpacity
                    key={variation.id}
                    style={styles.variationItemContainer}
                    activeOpacity={0.9}
                    onPress={() => handleVariationSelect(variation)}
                  >
                    <View style={styles.variationContent}>
                      <Text style={styles.variationName}>{variation.pricing_type_str}</Text>
                      <Text style={styles.variationTime}>
                        {variation.start_time} - {variation.end_time}
                      </Text>
                      <Text style={styles.variationCapacity}>
                        Max {variation.max_participant} people • {variation.max_no_per_day} slots/day
                      </Text>
                    </View>
                    <View style={styles.variationPrice}>
                      <Text style={styles.variationPriceText}>
                        ₹{parseFloat(variation.base_price).toFixed(2)}
                      </Text>
                      <View style={styles.selectButton}>
                        <Text style={styles.selectButtonText}>Select</Text>
                        <Ionicons name="chevron-forward" size={16} color="#FFF" />
                      </View>
                    </View>
                  </TouchableOpacity>

                ))
              ) : (
                <View style={styles.emptyPackageContainer}>
                  <Ionicons name="cube-outline" size={48} color="#CCC" />
                  <Text style={styles.emptyPackageText}>
                    Packages will be available soon for booking
                  </Text>
                </View>
              )}
            </View>

            {/* Policies & Terms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Policies & Terms</Text>

              {/* Advance Payment Policy */}
              {selectedService?.adv_policy_data && (
                <View style={styles.policyCard}>
                  <Text style={styles.policyCardTitle}>Advance Payment Policy</Text>
                  <Text style={styles.policyCardText}>
                    <Text style={{ fontWeight: '700' }}>{selectedService.adv_policy_data.name}</Text>
                  </Text>
                  <Text style={styles.policyCardText}>
                    Advance payment required: <Text style={{ fontWeight: '700' }}>{selectedService.adv_policy_data.percent}%</Text> 
                    (minimum ₹{selectedService.adv_policy_data.min_amount})
                  </Text>
                  <Text style={styles.policyCardText}>
                    Payment due: <Text style={{ fontWeight: '700' }}>{selectedService.adv_policy_data.due_days_before} days</Text> before booking date
                  </Text>
                </View>
              )}

              {/* Refund Policy */}
              {selectedService?.refund_policy_data?.refund_rules?.length > 0 && (
                <View style={styles.policyCard}>
                  <Text style={styles.policyCardTitle}>Refund Policy</Text>
                  <Text style={styles.policyCardText}>
                    <Text style={{ fontWeight: '700' }}>{selectedService.refund_policy_data.name}</Text>
                  </Text>
                  {selectedService.refund_policy_data.refund_rules.map((rule, idx) => (
                    <View key={rule.id || idx} style={{ marginTop: 6 }}>
                      <Text style={styles.policyCardText}>
                        Cancellation <Text style={{ fontWeight: '700' }}>{rule.min_hours_before} hours</Text> before: <Text style={{ fontWeight: '700' }}>{rule.refund_percent}% refund</Text>
                      </Text>
                      {rule.notes && (
                        <Text style={[styles.policyCardText, { fontStyle: 'italic', marginTop: 2 }]}>
                          Note: {rule.notes}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContentFull: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '92%',
    alignSelf: 'stretch',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
  },
  closeButton: {
    padding: 4,
  },
  detailsScroll: {
    paddingBottom: 16,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3436',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
  },
  pillText: {
    fontSize: 12,
    color: '#A04E00',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  galleryImage: {
    width: Math.floor((width - 52) / 1.2),
    height: 170,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#EEE',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6B7280',
  },
  priceNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  variationItemContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#FFF',
  padding: 20,
  borderRadius: 18,
  marginBottom: 16,

  // Floating look
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 6,
},
variationPriceText: {
  fontSize: 18,
  fontWeight: '700',
  color: '#E88F14',
},

  variationContent: {
    flex: 1,
  },
  variationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 4,
  },
  variationTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  variationCapacity: {
    fontSize: 12,
    color: '#888',
  },
  variationPrice: {
    alignItems: 'flex-end',
    gap: 8,
    
  },
  variationPriceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E88F14',

  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E88F14',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    // Button shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyPackageContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    minHeight: 200,
  },
  emptyPackageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  policyCard: {
    width: '100%',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: 12,
  },
  policyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },
  policyCardText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});

export default ServiceDetails;
