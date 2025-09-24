import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import CalendarGrid from '../../components/CalendarGrid';
import FestivalsList from '../../components/FestivalsList';
import HeaderComponent from '../../components/HeaderComponent';
import MonthNavigation from '../../components/MonthNavigation';
import PanchangDetailModal from '../../components/PanchangDetailModal';
import { getPanchangData } from '../../services/productService';
import { getRegionTitle } from '../../utils/languageMapping';

const { width } = Dimensions.get('window');

const PanchangScreen = () => {
  const [panchangData, setPanchangData] = useState(null);
  const [monthlyFestivals, setMonthlyFestivals] = useState([]);
  const [allPanchangData, setAllPanchangData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [region, setRegion] = useState('odisha');
  const [calendarType, setCalendarType] = useState('jagannath_panji');
  const [modalVisible, setModalVisible] = useState(false);
   const [headerTitle, setHeaderTitle] = useState('Panchang');
  const router = useRouter();

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Use focus effect to refresh data when screen comes into focus
   useFocusEffect(
    useCallback(() => {
      // Load preferences and check if they've changed
      const checkAndRefreshPreferences = async () => {
        try {
          const storedRegion = await AsyncStorage.getItem('userRegion');
          const storedCalendarType = await AsyncStorage.getItem('calendarType');
          
          // Check if preferences have changed
          const regionChanged = storedRegion && storedRegion !== region;
          const calendarTypeChanged = storedCalendarType && storedCalendarType !== calendarType;
          
          if (regionChanged || calendarTypeChanged) {
            // Update state with new preferences
            if (storedRegion) {
              setRegion(storedRegion);
              // Update header title based on new region
              setHeaderTitle(getRegionTitle(storedRegion, 'local'));
            }
            if (storedCalendarType) setCalendarType(storedCalendarType);
            
            // Reset and reload data
            setAllPanchangData({});
            setLoading(true);
          }
        } catch (error) {
          console.error('Error checking preferences:', error);
        }
      };
      
      checkAndRefreshPreferences();
    }, [region, calendarType])
  );


  useEffect(() => {
    loadStoredPreferences();
  }, []);

  useEffect(() => {
    if (region && calendarType) {
      loadAllPanchangData();
    }
  }, [region, calendarType, currentMonth]);

  useEffect(() => {
    updatePanchangForSelectedDate();
    extractMonthlyFestivals();
  }, [selectedDate, allPanchangData, currentMonth]);

  const loadStoredPreferences = async () => {
    try {
      const storedRegion = await AsyncStorage.getItem('userRegion');
      const storedCalendarType = await AsyncStorage.getItem('calendarType');
      
      if (storedRegion) {
        setRegion(storedRegion);
        // Set header title based on region
        setHeaderTitle(getRegionTitle(storedRegion, 'local'));
      }
      if (storedCalendarType) setCalendarType(storedCalendarType);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadAllPanchangData = async () => {
    try {
      setLoading(true);
      setAllPanchangData({}); // reset for new month

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      const response = await getPanchangData(region, calendarType, year, month);

      if (response.status === 200 && response.data) {
        setAllPanchangData(response.data);
      } else {
        Toast.show({
          type: 'error',
          text1: response.message || 'No Panchang data for this month',
        });
        setAllPanchangData({});
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong while fetching Panchang data.',
      });
      setAllPanchangData({});
    } finally {
      setLoading(false);
    }
  };

  const updatePanchangForSelectedDate = () => {
    const dateString = formatDateToAPIString(selectedDate);
    const dateData = allPanchangData[dateString];

    if (dateData) {
      setPanchangData(dateData);
    } else {
      setPanchangData(null);
    }
  };

  const formatDateToAPIString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const extractMonthlyFestivals = () => {
    try {
      const month = currentMonth.getMonth();
      const year = currentMonth.getFullYear();
      
      const festivals = [];
      
      Object.entries(allPanchangData).forEach(([dateString, data]) => {
        const [yearStr, monthStr, dayStr] = dateString.split('-');
        const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
        
        if (date.getMonth() === month && date.getFullYear() === year) {
          if (data.festivals && Array.isArray(data.festivals) && data.festivals.length > 0) {
            const festivalNames = data.festivals.join(', ');
            
            festivals.push({
              date: dateString,
              day: date.getDate(),
              name: festivalNames,
              weekday: weekDays[date.getDay()],
            });
          }
        }
      });
      
      festivals.sort((a, b) => new Date(a.date) - new Date(b.date));
      setMonthlyFestivals(festivals);
    } catch (error) {
      console.error('Error extracting monthly festivals:', error);
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const onDatePress = (day) => {
    const dateString = formatDateToAPIString(day.date);
    const dateData = allPanchangData[dateString];
    
    setSelectedDate(day.date);
    
    if (dateData) {
      setPanchangData(dateData);
    } else {
      setPanchangData(null);
    }
    
    setModalVisible(true);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const refreshData = async () => {
    await loadAllPanchangData();
  };

  const handleBackPress = () => {
    router.push({ pathname: '/profile' });
  };

  const navigateToSettings = () => {
    router.push('/ProfileSetting');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.statusBarBackground} />
      <StatusBar style="light" />
      
     <HeaderComponent 
        headerTitle={headerTitle} // Use the dynamic title
        onBackPress={handleBackPress}
        icon2Name={"refresh"}
        icon2OnPress={refreshData}
        icon1Name={"settings"}
        icon1OnPress={navigateToSettings}
      />
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E88F14" />
          <Text style={styles.loadingText}>Loading Panchang data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <MonthNavigation 
            currentMonth={currentMonth} 
            onNavigateMonth={navigateMonth} 
          />
          
          <CalendarGrid
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            allPanchangData={allPanchangData}
            weekDays={weekDays}
            onDatePress={onDatePress}
            formatDateToAPIString={formatDateToAPIString}
          />
          
          <FestivalsList
            festivals={monthlyFestivals}
            allPanchangData={allPanchangData}
            setSelectedDate={setSelectedDate}
            setPanchangData={setPanchangData}
            setModalVisible={setModalVisible}
          />
        </ScrollView>
      )}

      <PanchangDetailModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedDate={selectedDate}
        panchangData={panchangData}
        formatDate={formatDate}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f3e9',
  },
  statusBarBackground: {
    height: 60,
    backgroundColor: '#E88F14',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#5e3c19',
  },
  content: {
    flex: 1,
  },
});

export default PanchangScreen;