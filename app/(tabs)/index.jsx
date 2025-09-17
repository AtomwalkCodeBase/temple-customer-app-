import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { memo, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import styled from "styled-components/native";
import PopUp from "../screens/PopUp";

const { width } = Dimensions.get("window");

const Screen = styled.SafeAreaView`
  flex: 1;
  background-color: #f6f7fb;
`;

const Container = styled.View`
  flex: 1;
`;

const Header = styled.View`
  padding: 10px 20px 10px 20px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #e88f14;
`;

const LeftHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.View`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background-color: #7b61ff;
`;

const UserBlock = styled.View``;

const UserName = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #1b1e28;
`;

const UserId = styled.Text`
  font-size: 12px;
  color: #4b4d50ff;
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

const SearchWrap = styled.View`
  margin: 16px 20px 14px 20px;
`;

const SearchBar = styled.View`
  height: 46px;
  border-radius: 14px;
  background-color: #efeef5;
  padding: 0px 14px;
  flex-direction: row;
  align-items: center;
`;

const SearchPlaceholder = styled.Text`
  margin-left: 10px;
  color: #9aa3b2;
  font-size: 14px;
`;

const SectionHeader = styled.View`
  margin: 10px 20px 10px 20px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 800;
  color: #1b1e28;
`;

const AddNew = styled.TouchableOpacity`
  padding: 8px 12px;
  border-radius: 12px;
  background-color: #eef7ff;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const AddNewText = styled.Text`
  color: #3a7bd5;
  font-weight: 700;
`;

const StatsRow = styled.View`
  margin: 6px 20px 6px 20px;
  flex-direction: row;
  gap: 14px;
`;

const StatCard = styled.View`
  flex: 1;
  height: 110px;
  border-radius: 16px;
  background-color: ${(p) => p.bg || "#ffffff"};
  padding: 14px;
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-opacity: 0.06;
      shadow-radius: 10px;
      shadow-offset: 0px 4px;
    `,
    android: `
      elevation: 2;
    `,
  })}
`;

const StatNumber = styled.Text`
  color: #ffffff;
  font-size: 28px;
  font-weight: 800;
`;

const StatLabel = styled.Text`
  margin-top: 8px;
  color: #ffffff;
  font-weight: 600;
  opacity: 0.9;
`;

const RecentWrap = styled.View`
  margin: 4px 20px 20px 20px;
`;

const Card = styled.View`
  background-color: #ffffff;
  border-radius: 16px;
  padding: 14px;
  margin-top: 12px;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-opacity: 0.06;
      shadow-radius: 12px;
      shadow-offset: 0px 4px;
    `,
    android: `
      elevation: 2;
    `,
  })}
`;

const Thumb = styled.View`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background-color: #7b61ff;
`;

const CardBody = styled.View`
  flex: 1;
`;

const CardTitle = styled.Text`
  color: #1b1e28;
  font-weight: 700;
  font-size: 15px;
`;

const CardMetaRow = styled.View`
  margin-top: 6px;
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

const MetaText = styled.Text`
  color: #9aa3b2;
  font-size: 12px;
`;

const StatusPill = styled.View`
  padding: 6px 10px;
  border-radius: 10px;
  background-color: ${(p) => (p.type === "booked" ? "#e8f9ef" : "#fff6e5")};
`;

const StatusText = styled.Text`
  color: ${(p) => (p.type === "booked" ? "#1f9254" : "#b25e09")};
  font-weight: 700;
  font-size: 12px;
`;

const BottomBar = styled.View`
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  background-color: #ffffff;
  border-radius: 24px;
  padding: 10px 14px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-opacity: 0.12;
      shadow-radius: 16px;
      shadow-offset: 0px -2px;
    `,
    android: `
      elevation: 8;
    `,
  })}
`;

const TabBtn = styled.TouchableOpacity`
  flex: 1;
  height: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
`;

const CenterAction = styled.View`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background-color: #f9f5ff;
  align-items: center;
  justify-content: center;
  margin-top: -28px;
  border-width: 1px;
  border-color: #efe9ff;
`;

const promoStyles = StyleSheet.create({
  card: {
    width: width - 40,
    height: 200,
    marginHorizontal: 20,
    padding: 16,
    justifyContent: "flex-start",
  },
  tag: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1b1e28",
  },
  meta: {
    color: "#fff",
    opacity: 0.9,
    marginTop: 8,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 10,
  },
  button: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#ffc93d",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  buttonText: {
    fontWeight: "800",
    fontSize: 14,
    color: "#3b2a00",
  },
  dotRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e0e0e0",
  },
  dotActive: {
    width: 40,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  progressLine: {
    backgroundColor: "#E88F14",
    alignSelf: "flex-start",
  },
});

const PromoCarousel = memo(function PromoCarouselComponent({ data = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  const startProgress = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    progressAnim.setValue(0);
    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    });
    animationRef.current.start(({ finished }) => {
      if (finished) goNext();
    });
  };

  const goNext = () => {
    const nextIndex = (activeIndex + 1) % data.length;
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  const onMomentumEnd = (e) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
    );
    setActiveIndex(index);
  };

  useEffect(() => {
    if (data.length > 0) {
      startProgress();
    }
    return () => {
      if (animationRef.current) animationRef.current.stop();
    };
  }, [activeIndex, data.length]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  const renderItem = ({ item }) => (
    <ImageBackground
      source={item.image}
      style={promoStyles.card}
      imageStyle={{ borderRadius: 20 }}
    >
      <View style={promoStyles.tag}>
        <Text style={promoStyles.tagText}>Upcoming Event</Text>
      </View>
      <Text style={promoStyles.meta}>{item.subtitle}</Text>
      <Text style={promoStyles.title}>{item.title}</Text>
      <TouchableOpacity style={promoStyles.button} activeOpacity={0.9}>
        <Text style={promoStyles.buttonText}>Book now</Text>
      </TouchableOpacity>
    </ImageBackground>
  );

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: true });
          }, 250);
        }}
      />

      <View style={promoStyles.dotRow}>
        {data.map((_, i) => {
          if (i === activeIndex) {
            return (
              <View key={i} style={promoStyles.dotActive}>
                <Animated.View
                  style={[
                    promoStyles.progressLine,
                    { width: progressWidth, height: "100%" },
                  ]}
                />
              </View>
            );
          }
          return <View key={i} style={promoStyles.dotSmall} />;
        })}
      </View>
    </View>
  );
});

export default function Home() {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [storedUser, setStoredUser] = useState();
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const code = await AsyncStorage.getItem("ref_code");
        if (mounted) setRefCode(code);
      } catch (e) {
        if (mounted) setRefCode("");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const checkFingerprintStatus = async () => {
      const hardwareSupported = await LocalAuthentication.hasHardwareAsync();
      const fingerprintPrompted = await AsyncStorage.getItem("fingerprintPrompted");
      const biometric = await AsyncStorage.getItem("biometric");
      const userStr = await AsyncStorage.getItem("user");
      setStoredUser(userStr);

      if (hardwareSupported && !fingerprintPrompted && biometric !== "true") {
        setIsPopupVisible(true);
      }
    };
    checkFingerprintStatus();
  }, []);

  const handleYes = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm your fingerprint",
    });

    if (result.success) {
      await AsyncStorage.setItem("biometric", "true");
    } else {
      await AsyncStorage.setItem("biometric", "false");
    }
    await AsyncStorage.setItem("fingerprintPrompted", "true");
    setIsPopupVisible(false);
  };

  const handleNo = async () => {
    await AsyncStorage.setItem("biometric", "false");
    await AsyncStorage.setItem("fingerprintPrompted", "true");
    setIsPopupVisible(false);
  };

  const placeholders = ["Search Temples", "Search Services"];
  const [index, setIndex] = useState(0);
  const bellAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % placeholders.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bellAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: -1, duration: 180, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: 0.6, duration: 140, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: -0.3, duration: 120, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const bellRotate = bellAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-15deg", "0deg", "15deg"],
  });

  const promoData = [
    {
      id: "1",
      title: "Ganesh Chaturthi",
      subtitle: "Shiv Mandir",
      image: require("../../assets/images/Murudeshwara_Temple.png"),
    },
    {
      id: "2",
      title: "Diwali Puja",
      subtitle: "Durga Mandir",
      image: require("../../assets/images/Murudeshwara_Temple.png"),
    },
    {
      id: "3",
      title: "Navratri Utsav",
      subtitle: "Kali Mandir",
      image: require("../../assets/images/Murudeshwara_Temple.png"),
    },
  ];

  return (
    <Screen>
      <Container>
        <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
          <Header>
            <LeftHeader>
              <Avatar />
              <UserBlock>
                <UserName>Vishnuvardhan</UserName>
                <UserId>{refCode}</UserId>
              </UserBlock>
            </LeftHeader>

            <BellWrap activeOpacity={0.8}>
              <Animated.View style={{ transform: [{ rotate: bellRotate }] }}>
                <Ionicons name="notifications-outline" size={22} color="#fff" />
              </Animated.View>
              <Dot />
            </BellWrap>
          </Header>

          <SearchWrap>
            <SearchBar>
              <Ionicons name="search" size={18} color="#9aa3b2" />
              <SearchPlaceholder>{placeholders[index]}</SearchPlaceholder>
            </SearchBar>
          </SearchWrap>

          <PromoCarousel data={promoData} />

          <SectionHeader>
            <SectionTitle>Your Bookings</SectionTitle>
            <AddNew activeOpacity={0.85}>
              <Ionicons name="add-circle-outline" size={16} color="#3a7bd5" />
              <AddNewText>Add new</AddNewText>
            </AddNew>
          </SectionHeader>

          <StatsRow>
            <StatCard bg="#7b61ff">
              <StatNumber>12</StatNumber>
              <StatLabel>Total Bookings</StatLabel>
            </StatCard>
            <StatCard bg="#ff7066">
              <StatNumber>10</StatNumber>
              <StatLabel>Active Bookings</StatLabel>
            </StatCard>
            <StatCard bg="#d79b2d">
              <StatNumber>2</StatNumber>
              <StatLabel>Completed</StatLabel>
            </StatCard>
          </StatsRow>

          <SectionHeader style={{ marginTop: 6 }}>
            <SectionTitle>Recent Bookings</SectionTitle>
          </SectionHeader>

          <RecentWrap>
            <Card>
              <Thumb />
              <CardBody>
                <CardTitle>Diwali Puja</CardTitle>
                <CardMetaRow>
                  <MetaText>10-09-2025</MetaText>
                  <MetaText>Ganesh Mandir</MetaText>
                </CardMetaRow>
              </CardBody>
              <StatusPill type="booked">
                <StatusText type="booked">Booked</StatusText>
              </StatusPill>
            </Card>

            <Card>
              <Thumb />
              <CardBody>
                <CardTitle>Cultural Hall</CardTitle>
                <CardMetaRow>
                  <MetaText>09-09-2025</MetaText>
                  <MetaText>Cultural Hall</MetaText>
                </CardMetaRow>
              </CardBody>
              <StatusPill type="pending">
                <StatusText type="pending">Pending</StatusText>
              </StatusPill>
            </Card>

            <Card>
              <Thumb />
              <CardBody>
                <CardTitle>Executive Hall</CardTitle>
                <CardMetaRow>
                  <MetaText>10-09-2025</MetaText>
                  <MetaText>Ganesh Mandir</MetaText>
                </CardMetaRow>
              </CardBody>
              <StatusPill type="booked">
                <StatusText type="booked">Booked</StatusText>
              </StatusPill>
            </Card>

            <Card>
              <Thumb />
              <CardBody>
                <CardTitle>Cultural Hall</CardTitle>
                <CardMetaRow>
                  <MetaText>09-09-2025</MetaText>
                  <MetaText>Cultural Hall</MetaText>
                </CardMetaRow>
              </CardBody>
              <StatusPill type="pending">
                <StatusText type="pending">Pending</StatusText>
              </StatusPill>
            </Card>
          </RecentWrap>
        </ScrollView>
      </Container>

      <PopUp
        isVisible={isPopupVisible}
        onYes={handleYes}
        onNo={handleNo}
        message={"Would you like to enable\nFingerprint Login?"}
      />
    </Screen>
  );
}
