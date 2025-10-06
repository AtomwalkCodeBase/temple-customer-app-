import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const Header = ({ 
  type = 'type1', 
  // Type 1 props
  userName = "Vishnuvardhan", 
  userId, 
  // Type 2 props
  title = "🔔 Sacred Temples",
  subtitle,
  searchValue,
  onSearchChange,
  onSearchPress,
  // Type 3 props
  showBackButton = false,
  showSearchIcon=false,
  searchVisible = false,
  searchQuery = "",
  onSearchQueryChange,
  centerTitle = false,
  onToggleSearch,
  onBackPress,
  paddingTop = Platform.OS === 'ios' ? 60 : 20 
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const getHeaderContainerStyle = () => {
    const baseStyle = [styles.headerContainer];
    
    switch (type) {
      case 'type3':
        baseStyle.push(styles.headerContainerType3);
        baseStyle.push({ paddingTop });
        break;
      case 'type2':
        baseStyle.push(styles.headerContainerType2);
        break;
      case 'type1':
      default:
        baseStyle.push(styles.headerContainerType1);
        break;
    }
    
    return baseStyle;
  };

  const renderType1 = () => (
    <View style={getHeaderContainerStyle()}>
      <View style={styles.leftHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={24} color="#fff" />
        </View>
        <View style={styles.userBlock}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userId}>{userId}</Text>
        </View>
      </View>
    </View>
  );

  const renderType2 = () => (
    <View style={getHeaderContainerStyle()}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.input}
          placeholder="Search temples"
          placeholderTextColor="#6b7280"
          value={searchValue}
          onChangeText={onSearchChange}
          returnKeyType="search"
          onSubmitEditing={onSearchPress}
        />
        <TouchableOpacity style={styles.searchBtn} activeOpacity={0.9} onPress={onSearchPress}>
          <Text style={styles.btnText}>Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderType3 = () => (
    <View style={getHeaderContainerStyle()}>
      <View style={styles.headerRow}>
        {showBackButton && (
          <TouchableOpacity style={styles.backNav} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        )}

        <View style={[styles.titleContainer, centerTitle && { marginLeft: -40, alignItems: 'center', paddingVertical: 10 }]}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        </View>

        {showSearchIcon && (
          <TouchableOpacity style={styles.searchButton} onPress={onToggleSearch}>
          <Ionicons 
            name={searchVisible ? "close" : "search"} 
            size={24} 
            color="#FFF" 
          />
        </TouchableOpacity>
        )}
        
      </View>
      {searchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#11080892"
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            autoFocus={true}
          />
        </View>
      )}
    </View>
  );

  const renderHeader = () => {
    switch (type) {
      case 'type2':
        return renderType2();
      case 'type3':
        return renderType3();
      case 'type1':
      default:
        return renderType1();
    }
  };

  return renderHeader();
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#e88f14',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerContainerType1: {
    padding: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  headerContainerType2: {
    padding: 10,
    paddingHorizontal: 20,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  headerContainerType3: {
    padding: 16,
    paddingBottom: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBlock: {},
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userId: {
    color: '#e9e6ff',
    fontSize: 12,
    marginTop: 2,
  },
  titleRow: {
    marginBottom: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#e9e6ff',
    fontSize: 12,
    marginTop: 6,
  },
  filters: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#111827',
  },
  searchBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#E88F14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    width: '100%',
  },
  backNav: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  searchButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  searchContainer: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#111827',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 10,
  },
});

export default Header;