import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CalendarGrid = ({
  currentMonth,
  selectedDate,
  allPanchangData,
  weekDays,
  onDatePress,
  formatDateToAPIString
}) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const generateCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    const dayOfWeek = firstDay.getDay();
    startDate.setDate(1 - dayOfWeek);
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = currentDate.getDate() === today.getDate() && 
                       currentDate.getMonth() === today.getMonth() && 
                       currentDate.getFullYear() === today.getFullYear();
        const isSelected = currentDate.getDate() === selectedDate.getDate() && 
                          currentDate.getMonth() === selectedDate.getMonth() && 
                          currentDate.getFullYear() === selectedDate.getFullYear();
        
        const dateString = formatDateToAPIString(currentDate);
        
        const dateData = allPanchangData[dateString];
        const hasFestival = dateData && 
                           dateData.festivals && 
                           Array.isArray(dateData.festivals) && 
                           dateData.festivals.length > 0;
        
        days.push({
          date: currentDate,
          day: currentDate.getDate(),
          isCurrentMonth,
          isToday,
          isSelected,
          hasFestival,
          dateString,
          key: `${week}-${day}`
        });
      }
    }
    
    return days;
  };

  const calendarDays = generateCalendarGrid();
  const weeks = [];
  
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <View style={styles.calendarContainer}>
      {/* Week Days Header */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Days Grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => (
            <TouchableOpacity
              key={day.key}
              style={[
                styles.dayCell,
                !day.isCurrentMonth && styles.otherMonthDay,
                day.isToday && styles.todayCell,
                day.isSelected && styles.selectedCell,
              ]}
              onPress={() => onDatePress(day)}
            >
              <Text style={[
                styles.dayText,
                !day.isCurrentMonth && styles.otherMonthText,
                day.isToday && styles.todayText,
                day.isSelected && styles.selectedText,
              ]}>
                {day.day}
              </Text>
              {day.hasFestival && (
                <View style={styles.festivalDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  weekDaysRow: {
    flexDirection: 'row',
    backgroundColor: '#ffd700',
  },
  weekDayCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  weekDayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: '#000',
    borderRightColor: '#000',
    position: 'relative',
    backgroundColor: '#fff',
  },
  dayText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '500',
  },
  otherMonthDay: {
    backgroundColor: '#f0f0f0',
  },
  otherMonthText: {
    color: '#999',
  },
  todayCell: {
    backgroundColor: '#E88F14',
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedCell: {
    backgroundColor: '#4834d4',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  festivalDot: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d32f2f',
  },
});

export default CalendarGrid;