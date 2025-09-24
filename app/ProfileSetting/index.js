// app/settings.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import HeaderComponent from '../../components/HeaderComponent';


const SettingsScreen = () => {
  const [selectedRegion, setSelectedRegion] = useState('odisha');
  const [selectedCalendarType, setSelectedCalendarType] = useState('jagannath_panji');
  const router = useRouter();

  // Available regions and their calendar types
  const regions = [
    { id: 'maharashtra', name: 'Maharashtra', calendarTypes: ['default'] },
    { id: 'tamilnadu', name: 'Tamil Nadu', calendarTypes: ['default'] },
    { id: 'kerala', name: 'Kerala', calendarTypes: ['default'] },
    { id: 'westbengal', name: 'West Bengal', calendarTypes: ['default'] },
    { id: 'gujarat', name: 'Gujarat', calendarTypes: ['default'] },
    { 
      id: 'odisha', 
      name: 'Odisha', 
      calendarTypes: [
        { id: 'jagannath_panji', name: 'Jagannath Panji' },
        { id: 'biraja_panji', name: 'Biraja Panji' }
      ] 
    },
  ];

  useEffect(() => {
    loadStoredPreferences();
  }, []);

  const loadStoredPreferences = async () => {
    try {
      const storedRegion = await AsyncStorage.getItem('userRegion');
      const storedCalendarType = await AsyncStorage.getItem('calendarType');
      
      if (storedRegion) setSelectedRegion(storedRegion);
      if (storedCalendarType) setSelectedCalendarType(storedCalendarType);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    try {
      await AsyncStorage.setItem('userRegion', selectedRegion);
      await AsyncStorage.setItem('calendarType', selectedCalendarType);
      
      Toast.show({
        type: 'success',
        text1: 'Preferences saved successfully!',
      });
      
      router.back();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to save preferences',
      });
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const getCalendarTypesForRegion = (regionId) => {
    const region = regions.find(r => r.id === regionId);
    return region ? region.calendarTypes : [];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.statusBarBackground} />
      <StatusBar style="light" />
      <HeaderComponent 
        headerTitle="Settings" 
        onBackPress={handleBackPress}
      />
      
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Select Your Region</Text>
        
        <View style={styles.optionsContainer}>
          {regions.map(region => (
            <TouchableOpacity
              key={region.id}
              style={[
                styles.optionButton,
                selectedRegion === region.id && styles.selectedOption
              ]}
              onPress={() => {
                setSelectedRegion(region.id);
                // Reset calendar type when region changes
                if (region.calendarTypes.length > 0) {
                  if (typeof region.calendarTypes[0] === 'object') {
                    setSelectedCalendarType(region.calendarTypes[0].id);
                  } else {
                    setSelectedCalendarType('default');
                  }
                }
              }}
            >
              <Text style={[
                styles.optionText,
                selectedRegion === region.id && styles.selectedOptionText
              ]}>
                {region.name}
              </Text>
              {selectedRegion === region.id && (
                <Ionicons name="checkmark-circle" size={20} color="#E88F14" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {getCalendarTypesForRegion(selectedRegion).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Select Calendar Type</Text>
            
            <View style={styles.optionsContainer}>
              {getCalendarTypesForRegion(selectedRegion).map(type => {
                const typeId = typeof type === 'object' ? type.id : type;
                const typeName = typeof type === 'object' ? type.name : 'Default';
                
                return (
                  <TouchableOpacity
                    key={typeId}
                    style={[
                      styles.optionButton,
                      selectedCalendarType === typeId && styles.selectedOption
                    ]}
                    onPress={() => setSelectedCalendarType(typeId)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedCalendarType === typeId && styles.selectedOptionText
                    ]}>
                      {typeName}
                    </Text>
                    {selectedCalendarType === typeId && (
                      <Ionicons name="checkmark-circle" size={20} color="#E88F14" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={savePreferences}
        >
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5e3c19',
    marginBottom: 16,
    marginTop: 24,
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#fff8e1',
  },
  optionText: {
    fontSize: 16,
    color: '#5e3c19',
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: '#E88F14',
  },
  saveButton: {
    backgroundColor: '#E88F14',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;