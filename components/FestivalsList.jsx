// components/FestivalsList.js
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FestivalsList = ({ 
  festivals, 
  onFestivalPress, 
  allPanchangData, 
  setSelectedDate, 
  setPanchangData, 
  setModalVisible 
}) => {
  if (festivals.length === 0) {
    return (
      <View style={styles.noFestivalsContainer}>
        <Text style={styles.noFestivalsText}>No special days this month</Text>
      </View>
    );
  }

  return (
    <View style={styles.specialDaysSection}>
      <View style={styles.specialDaysHeader}>
        <Text style={styles.specialDaysTitle}>SPECIAL DAYS</Text>
      </View>
      
      {festivals.map((festival, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.festivalItem}
          onPress={() => {
            setSelectedDate(new Date(festival.date));
            const dateData = allPanchangData[festival.date];
            if (dateData) {
              setPanchangData(dateData);
            } else {
              setPanchangData(null);
            }
            setModalVisible(true);
          }}
        >
          <Text style={styles.festivalDate}>
            {festival.day}: {festival.weekday}:
          </Text>
          <Text style={styles.festivalName}> {festival.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  specialDaysSection: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  specialDaysHeader: {
    backgroundColor: '#ffd700',
    paddingVertical: 12,
    alignItems: 'center',
  },
  specialDaysTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  festivalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  festivalDate: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
    minWidth: 80,
  },
  festivalName: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  noFestivalsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
  },
  noFestivalsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default FestivalsList;