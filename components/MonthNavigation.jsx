import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MonthNavigation = ({ currentMonth, onNavigateMonth }) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <View style={styles.monthHeader}>
      <TouchableOpacity onPress={() => onNavigateMonth(-1)} style={styles.monthNavButton}>
        <Ionicons name="chevron-back" size={24} color="#E88F14" />
      </TouchableOpacity>
      
      <Text style={styles.monthTitle}>
        {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
      </Text>
      
      <TouchableOpacity onPress={() => onNavigateMonth(1)} style={styles.monthNavButton}>
        <Ionicons name="chevron-forward" size={24} color="#E88F14" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 8,
    elevation: 2,
  },
  monthNavButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default MonthNavigation;