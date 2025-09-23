import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Animated, Platform } from 'react-native';
import styled from 'styled-components/native';

const Header = ({ 
  type = 'type1', 
  // Type 1 props
  userName = "Vishnuvardhan", 
  userId, 
  bellRotate = new Animated.Value(0),
  onBellPress,
  hasNotification = true,
  // Type 2 props
  title = "🔔 Sacred Temples",
  subtitle = "Discover divine temples and book your spiritual journey with us",
  searchValue,
  onSearchChange,
  onSearchPress,
  // Type 3 props
  showBackButton = false,
  searchVisible = false,
  searchQuery = "",
  onSearchQueryChange,
  onToggleSearch,
  onBackPress
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const renderType1 = () => (
    <HeaderContainer type={type}>
      <LeftHeader>
        <Avatar>
          <Ionicons name="person-outline" size={24} color="#fff" />
        </Avatar>
        <UserBlock>
          <UserName>{userName}</UserName>
          <UserId>{userId}</UserId>
        </UserBlock>
      </LeftHeader>
      <BellWrap activeOpacity={0.8} onPress={onBellPress}>
        <Animated.View style={{ transform: [{ rotate: bellRotate }] }}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </Animated.View>
        {hasNotification && <Dot />}
      </BellWrap>
    </HeaderContainer>
  );

  const renderType2 = () => (
    <HeaderContainer type={type}>
      <TitleRow>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
      </TitleRow>

      <Filters>
        <Input
          placeholder="Search temples"
          value={searchValue}
          onChangeText={onSearchChange}
          returnKeyType="search"
          onSubmitEditing={onSearchPress}
        />
        <SearchBtn activeOpacity={0.9} onPress={onSearchPress}>
          <BtnText>Search</BtnText>
        </SearchBtn>
      </Filters>
    </HeaderContainer>
  );

  const renderType3 = () => (
    <HeaderContainer type={type}>
      <HeaderRow>
        {showBackButton && (
          <BackNav onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </BackNav>
        )}
        <TitleContainer>
          <Title>{title}</Title>
          <Subtitle>{subtitle}</Subtitle>
        </TitleContainer>
        <SearchButton onPress={onToggleSearch}>
          <Ionicons 
            name={searchVisible ? "close" : "search"} 
            size={24} 
            color="#FFF" 
          />
        </SearchButton>
      </HeaderRow>
      {searchVisible && (
        <SearchContainer>
          <SearchInput
            placeholder="Search events..."
            placeholderTextColor="#11080892"
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            autoFocus={true}
          />
        </SearchContainer>
      )}
    </HeaderContainer>
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

// Styled Components
const HeaderContainer = styled.View`
  padding: ${props => props.type === 'type3' ? '16px' : '10px 20px 10px 20px'};
  padding-top: ${props => 
    props.type === 'type3' && Platform.OS === 'ios' ? '60px' : 
    props.type === 'type3' ? '16px' : '10px'};
  padding-bottom: ${props => props.type === 'type3' ? '12px' : '10px'};
  flex-direction: ${props => props.type === 'type1' ? 'row' : 'column'};
  align-items: ${props => props.type === 'type1' ? 'center' : 'flex-start'};
  justify-content: ${props => props.type === 'type1' ? 'space-between' : 'flex-start'};
  background-color: #e88f14;
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 18px;
  z-index: ${props => props.type === 'type3' ? '2' : '1'};
`;

const LeftHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
`;

const UserBlock = styled.View``;

const UserName = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const UserId = styled.Text`
  color: #e9e6ff;
  font-size: 12px;
  margin-top: 2px;
`;

const BellWrap = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background-color: transparent;
  align-items: center;
  justify-content: center;
`;

const Dot = styled.View`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: #fa020bff;
`;

const TitleRow = styled.View`
  margin-bottom: 14px;
`;

const Title = styled.Text`
  color: #ffffff;
  font-size: 24px;
  font-weight: 800;
`;

const Subtitle = styled.Text`
  color: #e9e6ff;
  font-size: 12px;
  margin-top: 6px;
`;

const Filters = styled.View`
  background-color: #ffffff;
  border-radius: 14px;
  padding: 10px;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const Input = styled.TextInput`
  flex: 1;
  height: 40px;
  background-color: #f3f4f6;
  border-radius: 10px;
  padding: 0 12px;
  color: #111827;
`;

const SearchBtn = styled.TouchableOpacity`
  height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  background-color: #E88F14;
  align-items: center;
  justify-content: center;
`;

const BtnText = styled.Text`
  color: #fff;
  font-weight: 700;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding-top: ${Platform.OS === 'ios' ? '20px' : '0px'};
`;

const BackNav = styled.TouchableOpacity`
  height: 40px;
  width: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  margin-top: 10px;
`;

const SearchButton = styled.TouchableOpacity`
  height: 40px;
  width: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  margin-top: 10px;
`;

const SearchContainer = styled.View`
  margin-top: 10px;
  background-color: #ffffff;
  border-radius: 14px;
  padding: 10px;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const SearchInput = styled.TextInput`
  flex: 1;
  height: 40px;
  background-color: #f3f4f6;
  border-radius: 10px;
  padding: 0 12px;
  color: #111827;
`;

const TitleContainer = styled.View`
  flex: 1;
  margin-left: 10px;
`;

export default Header;

// Usage Examples:
// Type 1 (Default - without search bar):
// jsx
// <Header 
//   type="type1"
//   userName="Vishnuvardhan"
//   userId="REF12345"
//   onBellPress={() => console.log('Bell pressed')}
//   hasNotification={true}
// />
// Type 2 (With search bar - opened):
// jsx
// <Header 
//   type="type2"
//   title="🔔 Sacred Temples"
//   subtitle="Discover divine temples and book your spiritual journey with us"
//   searchValue={searchQuery}
//   onSearchChange={setSearchQuery}
//   onSearchPress={handleSearch}
// />
// Type 3 (With search bar - toggleable):
// jsx
// <Header 
//   type="type3"
//   title="Book Seva"
//   subtitle="Choose from available services"
//   showBackButton={true}
//   searchVisible={isSearchVisible}
//   searchQuery={searchQuery}
//   onSearchQueryChange={setSearchQuery}
//   onToggleSearch={toggleSearch}
//   onBackPress={handleBack}
// />