import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const StatusCards = ({ stats, onAddNew }) => {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Bookings</Text>
        <TouchableOpacity style={styles.addNewButton} activeOpacity={0.85} onPress={onAddNew}>
          <Ionicons name="add-circle-outline" size={16} color="#3a7bd5" />
          <Text style={styles.addNewText}>Add new</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#7b61ff' }]}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="calendar-outline" size={20} color="#ffffff" />
          </View>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ff7066' }]}>
          <Text style={styles.statNumber}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active Bookings</Text>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="time-outline" size={20} color="#ffffff" />
          </View>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#d79b2d' }]}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="checkmark-done-outline" size={20} color="#ffffff" />
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    margin: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1b1e28',
    letterSpacing: -0.5,
  },
  addNewButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#eef7ff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#3a7bd5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addNewText: {
    color: '#3a7bd5',
    fontWeight: '700',
    fontSize: 14,
  },
  statsRow: {
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    height: 130,
    borderRadius: 20,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 8,
        shadowColor: '#000',
      },
    }),
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    color: '#ffffff',
    fontWeight: '600',
    opacity: 0.95,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  iconContainer: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
    transform: [{ rotate: '15deg' }],
  },
});

export default StatusCards;