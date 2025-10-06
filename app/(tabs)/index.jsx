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
  TouchableOpacity,
  View
} from "react-native";
import BookingDetails from "../modals/BookingDetails";
import Button from "../../components/Button";
import Header from "../../components/Header";
import StatusCards from "../../components/StatusCards";
import { getBookingList, getTempleList } from "../../services/productService";
import PopUp from "../screens/PopUp";

const { width } = Dimensions.get("window");

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
      style={styles.promoCard}
      imageStyle={{ borderRadius: 20 }}
    >

      <View style={styles.promoOverlay} />

      <View style={styles.promoTag}>
        <Text style={styles.promoTagText}>Upcoming Event</Text>
      </View>
      <Text style={styles.promoMeta}>{item.subtitle}</Text>
      <Text style={styles.promoTitle}>{item.title}</Text>
      <Button
        onPress={() => onBook(item)} 
        title="Book now" 
        size="small"
        textStyle={{ color: "white" }}
        width={100}
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
      <View style={styles.promoDotRow}>
        {data.map((_, i) => {
          if (i === activeIndex) {
            return (
              <View key={i} style={styles.promoDotActive}>
                <Animated.View
                  style={[
                    styles.promoProgressLine,
                    { width: progressWidth, height: "100%" },
                  ]}
                />
              </View>
            );
          }
          return <View key={i} style={styles.promoDotSmall} />;
        })}
      </View>
    </View>
  );
});

function parseDDMMYYYY(str) {
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
}

export default function Home() {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [promoData, setPromoData] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [recent, setRecent] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetailsVisible, setBookingDetailsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const placeholders = ["Search Temples", "Search Services"];
  const [index, setIndex] = useState(0);
  
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
  
  useEffect(() => {
    (async () => {
      try {
        const userRefCode = await AsyncStorage.getItem("ref_code");
        const resp = await getBookingList();
        const list = Array.isArray(resp?.data) ? resp.data : [];

        const userBookings = list.filter(
          (b) =>
            b.ref_code === userRefCode || 
            b.customer_data?.cust_ref_code === userRefCode
        );

        const withDates = userBookings.map((b) => ({
          ...b,
          _date: parseDDMMYYYY(b?.booking_date),
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
          setIsPopupVisible(true);
        }
      } catch (e) {
        console.log("Error reading fingerprintPrompted:", e);
        setIsPopupVisible(true);
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
  
  const onBookFromSlide = (item) => {
    router.push({
      pathname: "/(tabs)/events",
      params: {
        temple_id: String(item.temple_id ?? ""),
        temple_name: item.temple_name ?? item.title ?? "",
        autofocus: "1",
      },
    });
  };
  
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking.bookingData);
    setBookingDetailsVisible(true);
  };
  
  const closeBookingDetails = () => {
    setBookingDetailsVisible(false);
    setSelectedBooking(null);
  };
  
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
    if (onShareDetails) {
      onShareDetails(booking);
    }
  };

  const getStatusPillStyle = (type) => ({
    ...styles.statusPill,
    backgroundColor: type === "booked" ? "#e8f9ef" : "#fff6e5",
  });

  const getStatusTextStyle = (type) => ({
    ...styles.statusText,
    color: type === "booked" ? "#1f9254" : "#b25e09",
  });

  const getStatCardStyle = (bg) => ({
    ...styles.statCard,
    backgroundColor: bg || "#ffffff",
  });

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Header
          type="type1"
          userName="Vishnuvardhan"
          userId={refCode}
        />
        <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
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
                  color: "#000",
                }}
                returnKeyType="search"
              />
            </View>
          </View>
          
          <PromoCarousel data={promoData} onBook={onBookFromSlide} />
          
          <StatusCards 
            stats={{
              total: 15,
              active: 3,
              completed: 12
            }}
            onAddNew={() => router.push("/events")}
          />
          
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
          </View>
          
          <View style={styles.recentWrap}>
            {recent.length === 0 ? (
              <TouchableOpacity style={styles.card}>
                <View style={styles.thumb} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>No recent bookings</Text>
                  <View style={styles.cardMetaRow}>
                    <Text style={styles.metaText}>Last 5 days</Text>
                    <Text style={styles.metaText}>—</Text>
                  </View>
                </View>
                <View style={getStatusPillStyle("pending")}>
                  <Text style={getStatusTextStyle("pending")}>—</Text>
                </View>
              </TouchableOpacity>
            ) : (
              recent.map((rb) => (
                <TouchableOpacity 
                  key={rb.id} 
                  style={styles.card} 
                  onPress={() => handleBookingClick(rb)}
                >
                  <View style={styles.thumb}>
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
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{rb.title}</Text>
                    <View style={styles.cardMetaRow}>
                      <Text style={styles.metaText}>{rb.date}</Text>
                      <Text style={styles.metaText}>{rb.place}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.qrIconWrapper}>
                      <Ionicons name="qr-code-outline" size={16} color="#7b61ff" />
                    </View>
                    <View style={getStatusPillStyle(rb.pillType)}>
                      <Text style={getStatusTextStyle(rb.pillType)}>
                        {rb.pillType === "pending" ? "Pending" : "Booked"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>
      
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
    </View>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  container: {
    flex: 1,
  },
  searchWrap: {
    margin: 16,
    marginBottom: 14,
    marginHorizontal: 20,
  },
  searchBar: {
    height: 46,
    borderRadius: 14,
    backgroundColor: "#efeef5",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: "#9aa3b2",
    fontSize: 14,
  },
  sectionHeader: {
    margin: 10,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b1e28",
  },
  addNew: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#eef7ff",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addNewText: {
    color: "#3a7bd5",
    fontWeight: "700",
  },
  statsRow: {
    margin: 6,
    marginHorizontal: 20,
    flexDirection: "row",
    gap: 14,
  },
  statCard: {
    flex: 1,
    height: 110,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statNumber: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    marginTop: 8,
    color: "#ffffff",
    fontWeight: "600",
    opacity: 0.9,
  },
  recentWrap: {
    margin: 4,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: "#1b1e28",
    fontWeight: "700",
    fontSize: 15,
  },
  cardMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaText: {
    color: "#9aa3b2",
    fontSize: 12,
  },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 12,
  },
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -2 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBtn: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  centerAction: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#f9f5ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    borderWidth: 1,
    borderColor: "#efe9ff",
  },
  qrIconWrapper: {
    backgroundColor: "#f1edff",
    padding: 6,
    borderRadius: 8,
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  promoCard: {
    width: width - 40,
    height: 200,
    marginHorizontal: 20,
    padding: 16,
    justifyContent: "flex-start",
  },
  promoTag: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  promoTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1b1e28",
  },
  promoMeta: {
    color: "#fff",
    opacity: 0.9,
    marginTop: 8,
  },
  promoTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 10,
  },
  promoDotRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  promoDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e0e0e0",
  },
  promoDotActive: {
    width: 40,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  promoProgressLine: {
    backgroundColor: "#E88F14",
    alignSelf: "flex-start",
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)", // thin black layer
    borderRadius: 20,
  },
  promoContent: {
    flex: 1,
    justifyContent: "flex-start",
  },
});
