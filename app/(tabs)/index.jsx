import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { memo, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import styled from "styled-components/native";
import BookButton from "../../components/BookButton";
import BookingDetails from "../../components/BookingDetails";
import Header from "../../components/Header";
import StatusCards from "../../components/StatusCards";
import { getBookingList, getTempleList } from "../../services/productService";
import PopUp from "../screens/PopUp";

const { width } = Dimensions.get("window");
const Screen = styled.SafeAreaView`
  flex: 1;
  background-color: #f6f7fb;
`;
const Container = styled.View`
  flex: 1;
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
const Card = styled.TouchableOpacity`
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
  overflow: hidden;
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
const QrIconWrapper = styled.View`
  background-color: #f1edff;
  padding: 6px;
  border-radius: 8px;
  margin-left: 6px;
  justify-content: center;
  align-items: center;
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
const PromoCarousel = memo(function PromoCarouselComponent({ data = [], onBook = () => {} }) {
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
    const nextIndex = data.length ? (activeIndex + 1) % data.length : 0;
    if (data.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }
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
      <BookButton 
        onPress={() => onBook(item)} 
        title="Book now" 
        size="small" 
      />
    </ImageBackground>
  );
  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
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
function parseDDMMYYYY(str) {
  // supports "DD-MM-YYYY" and "D-M-YYYY"
  if (!str) return null;
  const [d, m, y] = str.split("-").map((v) => v.trim());
  if (!d || !m || !y) return null;
  const day = parseInt(d, 10);
  const month = parseInt(m, 10) - 1;
  const year = parseInt(y, 10);
  const dt = new Date(year, month, day);
  return isNaN(dt.getTime()) ? null : dt;
}
function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((da - db) / MS);
};
export default function Home() {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [storedUser, setStoredUser] = useState();
  const [refCode, setRefCode] = useState("");
  const [promoData, setPromoData] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [recent, setRecent] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null); // State for selected booking
  const [bookingDetailsVisible, setBookingDetailsVisible] = useState(false); // State for modal visibility
  const [searchQuery, setSearchQuery] = useState("");
  
  // Search placeholder rotation
  const placeholders = ["Search Temples", "Search Services"];
  const [index, setIndex] = useState(0);
  const bellAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const code = await AsyncStorage.getItem("ref_code");
        if (mounted) setRefCode(code || "");
      } catch (e) {
        if (mounted) setRefCode("");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  
  // Load bookings for stats and recent list
  useEffect(() => {
  (async () => {
    try {
      const userRefCode = await AsyncStorage.getItem("ref_code"); // current logged-in user
      const resp = await getBookingList();
      const list = Array.isArray(resp?.data) ? resp.data : [];

      // ✅ Filter only current user's bookings
      const userBookings = list.filter(
        (b) =>
          b.ref_code === userRefCode || 
          b.customer_data?.cust_ref_code === userRefCode
      );

      const withDates = userBookings.map((b) => ({
        ...b,
        _date: parseDDMMYYYY(b?.booking_date), // expects "DD-MM-YYYY"
      }));

      const total = withDates.length;
      const today = new Date();

      const isCompleted = (b) => {
        if (typeof b?.status === "string") {
          const s = b.status.toLowerCase();
          if (s.includes("complete")) return true;
          if (s.includes("cancel")) return true;
        }
        if (b._date && b._date < today) return true;
        return false;
      };

      const isActive = (b) => {
        if (typeof b?.status === "string") {
          const s = b.status.toLowerCase();
          if (s.includes("pending")) return true;
          if (s.includes("confirm")) return true;
          if (s.includes("book")) return true;
        }
        if (b._date && b._date >= today) return true;
        return false;
      };

      const active = withDates.filter(isActive).length;
      const completed = withDates.filter(isCompleted).length;

      // Process only this user's recent bookings
      const recentBookings = withDates
        .sort((a, b) => {
          const ta = a._date ? a._date.getTime() : -Infinity;
          const tb = b._date ? b._date.getTime() : -Infinity;
          return tb - ta;
        })
        .slice(0, 5)
        .map((b) => {
          const serviceName = b.service_data?.name || b.service_name || "Service";
          const templeName = b.service_data?.temple_name || b.temple_name || "Temple";
          const imageUrl = b.service_data?.image || null;

          return {
            id: String(b.id ?? `${b.booking_id ?? Math.random()}`),
            title: serviceName,
            date: b.booking_date || "",
            place: templeName,
            image: imageUrl,
            pillType:
              typeof b?.status === "string" && b.status.toLowerCase().includes("pending")
                ? "pending"
                : "booked",
            bookingData: b,
          };
        });

      setStats({ total, active, completed });
      setRecent(recentBookings);
    } catch (e) {
      setStats({ total: 0, active: 0, completed: 0 });
      setRecent([]);
    }
  })();
}, []);


  useEffect(() => {
    (async () => {
      try {
        const prompted = await AsyncStorage.getItem("fingerprintPrompted");
        if (!prompted) {
          // First login → show popup
          setIsPopupVisible(true);
        }
      } catch (e) {
        console.log("Error reading fingerprintPrompted:", e);
        setIsPopupVisible(true); // fallback to show popup
      }
    })();
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
  
  // Load promo slides from getTempleList
  useEffect(() => {
    (async () => {
      try {
        const res = await getTempleList();
        const temples = (res?.data || []).map((t) => ({
          id: t.temple_id,
          title: t.name,
          subtitle: t.location || "Temple",
          image: t.image ? { uri: t.image } : require("../../assets/images/Murudeshwara_Temple.png"),
          temple_id: t.temple_id,
          temple_name: t.name,
        }));
        setPromoData(temples);
      } catch (e) {
        setPromoData([]);
      }
    })();
  }, []);
  
  const onAddNew = () => {
    router.push("/(tabs)/events");
  };
  
  const onBookFromSlide = (item) => {
    // Route to Events with temple context so its events are in view
    router.push({
      pathname: "/(tabs)/events",
      params: {
        temple_id: String(item.temple_id ?? ""),
        temple_name: item.temple_name ?? item.title ?? "",
        autofocus: "1",
      },
    });
  };
  
  // Function to handle booking click - show BookingDetails modal
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking.bookingData);
    setBookingDetailsVisible(true);
  };
  
  // Function to close BookingDetails modal
  const closeBookingDetails = () => {
    setBookingDetailsVisible(false);
    setSelectedBooking(null);
  };
  
  // Helper functions for BookingDetails component
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const [day, month, year] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };
  
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return timeString;
  };
  
  const calculateTotal = (quantity, unitPrice) => {
    const qty = parseInt(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return `₹${(qty * price).toFixed(2)}`;
  };
  
  const getStatusColor = (status) => {
    if (!status) return "#6C63FF";
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes("pending")) return "#FF9800";
    if (statusLower.includes("confirm") || statusLower.includes("book")) return "#4CAF50";
    if (statusLower.includes("complete")) return "#2196F3";
    if (statusLower.includes("cancel")) return "#F44336";
    
    return "#6C63FF";
  };
  
  const handleShareDetails = () => {
    // Implement share functionality here
    console.log("Share booking details:", selectedBooking);
  };

  return (
    <Screen>
      <Container>
        <Header
            type="type1"
            userName="Vishnuvardhan"
            userId={refCode}
            bellRotate={bellRotate}
            onBellPress={() => console.log("Bell pressed")}
            hasNotification={true}
          />
        <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>

          <SearchWrap>
            <SearchBar>
              <Ionicons name="search" size={18} color="#9aa3b2" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={placeholders[index]}
                placeholderTextColor="#9aa3b2"
                style={{
                  flex: 1,
                  marginLeft: 10,
                  fontSize: 14,
                  color: "#000", // typed text color
                }}
                returnKeyType="search"
              />
            </SearchBar>
          </SearchWrap>
          <PromoCarousel data={promoData} onBook={onBookFromSlide} />
          <StatusCards 
            stats={{
              total: 15,
              active: 3,
              completed: 12
            }}
            onAddNew={() => router.push("/events")}
          />
          <SectionHeader style={{ marginTop: 6 }}>
            <SectionTitle>Recent Bookings</SectionTitle>
          </SectionHeader>
          <RecentWrap>
            {recent.length === 0 ? (
              <Card>
                <Thumb />
                <CardBody>
                  <CardTitle>No recent bookings</CardTitle>
                  <CardMetaRow>
                    <MetaText>Last 5 days</MetaText>
                    <MetaText>—</MetaText>
                  </CardMetaRow>
                </CardBody>
                <StatusPill type="pending">
                  <StatusText type="pending">—</StatusText>
                </StatusPill>
              </Card>
            ) : (
              recent.map((rb) => (
                <Card key={rb.id} onPress={() => handleBookingClick(rb)}>
                  <Thumb>
                    {rb.image ? (
                      <Image 
                        source={{ uri: rb.image }} 
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ 
                        width: '100%', 
                        height: '100%', 
                        backgroundColor: '#7b61ff',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Ionicons name="image-outline" size={20} color="#fff" />
                      </View>
                    )}
                  </Thumb>
                  <CardBody>
                    <CardTitle>{rb.title}</CardTitle>
                    <CardMetaRow>
                      <MetaText>{rb.date}</MetaText>
                      <MetaText>{rb.place}</MetaText>
                    </CardMetaRow>
                  </CardBody>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <QrIconWrapper>
                      <Ionicons name="qr-code-outline" size={16} color="#7b61ff" />
                    </QrIconWrapper>
                    <StatusPill type={rb.pillType}>
                      <StatusText type={rb.pillType}>
                        {rb.pillType === "pending" ? "Pending" : "Booked"}
                      </StatusText>
                    </StatusPill>
                  </View>

                </Card>

              ))
            )}
          </RecentWrap>
        </ScrollView>
      </Container>
      
      {/* Booking Details Modal */}
      <BookingDetails
        visible={bookingDetailsVisible}
        onClose={closeBookingDetails}
        booking={selectedBooking}
        onShareDetails={handleShareDetails}
        formatDate={formatDate}
        formatTime={formatTime}
        calculateTotal={calculateTotal}
        getStatusColor={getStatusColor}
      />
      
      <PopUp
        isVisible={isPopupVisible}
        onYes={handleYes}
        onNo={handleNo}
        message={"Would you like to enable\nFingerprint Login?"}
      />
    </Screen>
  );
}