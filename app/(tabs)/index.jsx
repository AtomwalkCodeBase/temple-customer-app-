// import Ionicons from "@expo/vector-icons/Ionicons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as LocalAuthentication from "expo-local-authentication";
// import { router } from "expo-router";
// import { memo, useEffect, useRef, useState } from "react";
// import {
//   Animated,
//   Dimensions,
//   FlatList,
//   Image,
//   ImageBackground,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import Button from "../../components/Button";
// import Header from "../../components/Header";
// import StatusCards from "../../components/StatusCards";
// import { getBookingList, getTempleList } from "../../services/productService";
// import BookingDetails from "../modals/BookingDetails";
// import PopUp from "../screens/PopUp";

// const { width } = Dimensions.get("window");

// const PromoCarousel = memo(function PromoCarouselComponent({
//   data = [],
//   onBook = () => {},
// }) {
//   const [activeIndex, setActiveIndex] = useState(0);
//   const flatListRef = useRef(null);
//   const progressAnim = useRef(new Animated.Value(0)).current;
//   const animationRef = useRef(null);

//   const startProgress = () => {
//     if (animationRef.current) {
//       animationRef.current.stop();
//     }
//     progressAnim.setValue(0);
//     animationRef.current = Animated.timing(progressAnim, {
//       toValue: 1,
//       duration: 2500,
//       useNativeDriver: false,
//     });
//     animationRef.current.start(({ finished }) => {
//       if (finished) goNext();
//     });
//   };

//   const goNext = () => {
//     const nextIndex = data.length ? (activeIndex + 1) % data.length : 0;
//     if (data.length) {
//       flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
//     }
//   };

//   const onMomentumEnd = (e) => {
//     const index = Math.round(
//       e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width,
//     );
//     setActiveIndex(index);
//   };

//   useEffect(() => {
//     if (data.length > 0) {
//       startProgress();
//     }
//     return () => {
//       if (animationRef.current) animationRef.current.stop();
//     };
//   }, [activeIndex, data.length]);

//   const progressWidth = progressAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, 40],
//   });

//   const renderItem = ({ item }) => (
//     <ImageBackground
//       source={item.image}
//       style={styles.promoCard}
//       imageStyle={{ borderRadius: 20 }}
//     >
//       <View style={styles.promoOverlay} />

//       <View style={styles.promoTag}>
//         <Text style={styles.promoTagText}>Upcoming Event</Text>
//       </View>
//       <Text style={styles.promoMeta}>{item.subtitle}</Text>
//       <Text style={styles.promoTitle}>{item.title}</Text>
//       <Button
//         onPress={() => onBook(item)}
//         title="Book now"
//         size="small"
//         textStyle={{ color: "white" }}
//         width={100}
//       />
//     </ImageBackground>
//   );

//   return (
//     <View>
//       <FlatList
//         ref={flatListRef}
//         data={data}
//         renderItem={renderItem}
//         keyExtractor={(item) => String(item.id)}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         onMomentumScrollEnd={onMomentumEnd}
//         decelerationRate="fast"
//         scrollEventThrottle={16}
//         onScrollToIndexFailed={({ index }) => {
//           setTimeout(() => {
//             flatListRef.current?.scrollToIndex({ index, animated: true });
//           }, 250);
//         }}
//       />
//       <View style={styles.promoDotRow}>
//         {data.map((_, i) => {
//           if (i === activeIndex) {
//             return (
//               <View key={i} style={styles.promoDotActive}>
//                 <Animated.View
//                   style={[
//                     styles.promoProgressLine,
//                     { width: progressWidth, height: "100%" },
//                   ]}
//                 />
//               </View>
//             );
//           }
//           return <View key={i} style={styles.promoDotSmall} />;
//         })}
//       </View>
//     </View>
//   );
// });

// function parseDDMMYYYY(str) {
//   if (!str) return null;
//   const [d, m, y] = str.split("-").map((v) => v.trim());
//   if (!d || !m || !y) return null;
//   const day = parseInt(d, 10);
//   const month = parseInt(m, 10) - 1;
//   const year = parseInt(y, 10);
//   const dt = new Date(year, month, day);
//   return isNaN(dt.getTime()) ? null : dt;
// }

// function daysBetween(a, b) {
//   const MS = 24 * 60 * 60 * 1000;
//   const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
//   const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
//   return Math.round((da - db) / MS);
// }

// export default function Home() {
//   const [isPopupVisible, setIsPopupVisible] = useState(false);
//   const [refCode, setRefCode] = useState("");
//   const [promoData, setPromoData] = useState([]);
//   const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
//   const [recent, setRecent] = useState([]);
//   const [selectedBooking, setSelectedBooking] = useState(null);
//   const [bookingDetailsVisible, setBookingDetailsVisible] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   const placeholders = ["Search Temples", "Search Services"];
//   const [index, setIndex] = useState(0);

//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         const code = await AsyncStorage.getItem("ref_code");
//         if (mounted) setRefCode(code || "");
//       } catch (e) {
//         if (mounted) setRefCode("");
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   useEffect(() => {
//     (async () => {
//       try {
//         const userRefCode = await AsyncStorage.getItem("ref_code");
//         const resp = await getBookingList();
//         const list = Array.isArray(resp?.data) ? resp.data : [];

//         const userBookings = list.filter(
//           (b) =>
//             b.ref_code === userRefCode ||
//             b.customer_data?.cust_ref_code === userRefCode,
//         );

//         const withDates = userBookings.map((b) => ({
//           ...b,
//           _date: parseDDMMYYYY(b?.booking_date),
//         }));

//         const total = withDates.length;
//         const today = new Date();

//         const isCompleted = (b) => {
//           if (typeof b?.status === "string") {
//             const s = b.status.toLowerCase();
//             if (s.includes("complete")) return true;
//             if (s.includes("cancel")) return true;
//           }
//           if (b._date && b._date < today) return true;
//           return false;
//         };

//         const isActive = (b) => {
//           if (typeof b?.status === "string") {
//             const s = b.status.toLowerCase();
//             if (s.includes("pending")) return true;
//             if (s.includes("confirm")) return true;
//             if (s.includes("book")) return true;
//           }
//           if (b._date && b._date >= today) return true;
//           return false;
//         };

//         const active = withDates.filter(isActive).length;
//         const completed = withDates.filter(isCompleted).length;

//         const recentBookings = withDates
//           .sort((a, b) => {
//             const ta = a._date ? a._date.getTime() : -Infinity;
//             const tb = b._date ? b._date.getTime() : -Infinity;
//             return tb - ta;
//           })
//           .slice(0, 5)
//           .map((b) => {
//             const serviceName =
//               b.service_data?.name || b.service_name || "Service";
//             const templeName =
//               b.service_data?.temple_name || b.temple_name || "Temple";
//             const imageUrl = b.service_data?.image || null;

//             return {
//               id: String(b.id ?? `${b.booking_id ?? Math.random()}`),
//               title: serviceName,
//               date: b.booking_date || "",
//               place: templeName,
//               image: imageUrl,
//               pillType:
//                 typeof b?.status === "string" &&
//                 b.status.toLowerCase().includes("pending")
//                   ? "pending"
//                   : "booked",
//               bookingData: b,
//             };
//           });

//         setStats({ total, active, completed });
//         setRecent(recentBookings);
//       } catch (e) {
//         setStats({ total: 0, active: 0, completed: 0 });
//         setRecent([]);
//       }
//     })();
//   }, []);

//   useEffect(() => {
//     (async () => {
//       try {
//         const prompted = await AsyncStorage.getItem("fingerprintPrompted");
//         if (!prompted) {
//           setIsPopupVisible(true);
//         }
//       } catch (e) {
//         console.log("Error reading fingerprintPrompted:", e);
//         setIsPopupVisible(true);
//       }
//     })();
//   }, []);

//   const handleYes = async () => {
//     const result = await LocalAuthentication.authenticateAsync({
//       promptMessage: "Confirm your fingerprint",
//     });
//     if (result.success) {
//       await AsyncStorage.setItem("biometric", "true");
//     } else {
//       await AsyncStorage.setItem("biometric", "false");
//     }
//     await AsyncStorage.setItem("fingerprintPrompted", "true");
//     setIsPopupVisible(false);
//   };

//   const handleNo = async () => {
//     await AsyncStorage.setItem("biometric", "false");
//     await AsyncStorage.setItem("fingerprintPrompted", "true");
//     setIsPopupVisible(false);
//   };

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setIndex((prev) => (prev + 1) % placeholders.length);
//     }, 1500);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await getTempleList();
//         const temples = (res?.data || []).map((t) => ({
//           id: t.temple_id,
//           title: t.name,
//           subtitle: t.location || "Temple",
//           image: t.image
//             ? { uri: t.image }
//             : require("../../assets/images/Murudeshwara_Temple.png"),
//           temple_id: t.temple_id,
//           temple_name: t.name,
//         }));
//         setPromoData(temples);
//       } catch (e) {
//         setPromoData([]);
//       }
//     })();
//   }, []);

//   const onBookFromSlide = (item) => {
//     router.push({
//       pathname: "/(tabs)/events",
//       params: {
//         temple_id: String(item.temple_id ?? ""),
//         temple_name: item.temple_name ?? item.title ?? "",
//         autofocus: "1",
//       },
//     });
//   };

//   const handleBookingClick = (booking) => {
//     setSelectedBooking(booking.bookingData);
//     setBookingDetailsVisible(true);
//   };

//   const closeBookingDetails = () => {
//     setBookingDetailsVisible(false);
//     setSelectedBooking(null);
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     const [day, month, year] = dateString.split("-");
//     return `${day}/${month}/${year}`;
//   };

//   const formatTime = (timeString) => {
//     if (!timeString) return "N/A";
//     return timeString;
//   };

//   const calculateTotal = (quantity, unitPrice) => {
//     const qty = parseInt(quantity) || 0;
//     const price = parseFloat(unitPrice) || 0;
//     return `₹${(qty * price).toFixed(2)}`;
//   };

//   const getStatusColor = (status) => {
//     if (!status) return "#6C63FF";

//     const statusLower = status.toLowerCase();
//     if (statusLower.includes("pending")) return "#FF9800";
//     if (statusLower.includes("confirm") || statusLower.includes("book"))
//       return "#4CAF50";
//     if (statusLower.includes("complete")) return "#2196F3";
//     if (statusLower.includes("cancel")) return "#F44336";

//     return "#6C63FF";
//   };

//   const handleShareDetails = () => {
//     if (onShareDetails) {
//       onShareDetails(booking);
//     }
//   };

//   const getStatusPillStyle = (type) => ({
//     ...styles.statusPill,
//     backgroundColor: type === "booked" ? "#e8f9ef" : "#fff6e5",
//   });

//   const getStatusTextStyle = (type) => ({
//     ...styles.statusText,
//     color: type === "booked" ? "#1f9254" : "#b25e09",
//   });

//   const getStatCardStyle = (bg) => ({
//     ...styles.statCard,
//     backgroundColor: bg || "#ffffff",
//   });

//   return (
//     <View style={styles.screen}>
//       <View style={styles.container}>
//         <Header type="type1" userName="Ashutosh" userId={refCode} />
//         <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
//           <View style={styles.searchWrap}>
//             <View style={styles.searchBar}>
//               <Ionicons name="search" size={18} color="#9aa3b2" />
//               <TextInput
//                 value={searchQuery}
//                 onChangeText={setSearchQuery}
//                 placeholder={placeholders[index]}
//                 placeholderTextColor="#9aa3b2"
//                 style={{
//                   flex: 1,
//                   marginLeft: 10,
//                   fontSize: 14,
//                   color: "#000",
//                 }}
//                 returnKeyType="search"
//               />
//             </View>
//           </View>
//           <PromoCarousel data={promoData} onBook={onBookFromSlide} />
//           <View style={styles.calendarWrapper}>
//             <TouchableOpacity
//               style={styles.calendarCard}
//               onPress={() => router.push("/PanchangScreen")}
//               activeOpacity={0.7}
//             >
//               <View style={styles.calendarCardInner}>
//                 <View style={styles.calendarLeftSection}>
//                   <View style={styles.calendarIconContainer}>
//                     <Ionicons
//                       name="calendar-clear-outline"
//                       size={28}
//                       color="#ffb061"
//                     />
//                   </View>
//                   <View style={styles.calendarTextContainer}>
//                     <Text style={styles.calendarMainText}>
//                       Panchang Calendar
//                     </Text>
//                     <Text style={styles.calendarSubText}>
//                       View Hindu Calendar & Tithi
//                     </Text>
//                   </View>
//                 </View>

//                 <View style={styles.calendarRightSection}>
//                   <View style={styles.todayDateBadge}>
//                     <Text style={styles.todayDateDay}>
//                       {new Date().getDate()}
//                     </Text>
//                     <Text style={styles.todayDateMonth}>
//                       {new Date().toLocaleString("default", { month: "short" })}
//                     </Text>
//                   </View>
//                   <Ionicons name="chevron-forward" size={22} color="#ffb561" />
//                 </View>
//               </View>

//               {/* Quick Tithi Info */}
//               <View style={styles.tithiPreviewContainer}>
//                 <View style={styles.tithiPreviewItem}>
//                   <Ionicons name="sunny-outline" size={14} color="#fe894e" />
//                   <Text style={styles.tithiPreviewLabel}>Tithi</Text>
//                   <Text style={styles.tithiPreviewValue}>Dwadashi</Text>
//                 </View>
//                 <View style={styles.tithiDivider} />
//                 <View style={styles.tithiPreviewItem}>
//                   <Ionicons name="moon-outline" size={14} color="#f3a16f" />
//                   <Text style={styles.tithiPreviewLabel}>Nakshatra</Text>
//                   <Text style={styles.tithiPreviewValue}>U.Phalguni</Text>
//                 </View>
//               </View>
//             </TouchableOpacity>
//           </View>
//           <StatusCards
//             stats={{
//               total: 15,
//               active: 3,
//               completed: 12,
//             }}
//             onAddNew={() => router.push("/events")}
//           />
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Recent Bookings</Text>
//           </View>
//           <View style={styles.recentWrap}>
//             {recent.length === 0 ? (
//               <TouchableOpacity style={styles.card}>
//                 <View style={styles.thumb} />
//                 <View style={styles.cardBody}>
//                   <Text style={styles.cardTitle}>No recent bookings</Text>
//                   <View style={styles.cardMetaRow}>
//                     <Text style={styles.metaText}>Last 5 days</Text>
//                     <Text style={styles.metaText}>—</Text>
//                   </View>
//                 </View>
//                 <View style={getStatusPillStyle("pending")}>
//                   <Text style={getStatusTextStyle("pending")}>—</Text>
//                 </View>
//               </TouchableOpacity>
//             ) : (
//               recent.map((rb) => (
//                 <TouchableOpacity
//                   key={rb.id}
//                   style={styles.card}
//                   onPress={() => handleBookingClick(rb)}
//                 >
//                   <View style={styles.thumb}>
//                     {rb.image ? (
//                       <Image
//                         source={{ uri: rb.image }}
//                         style={{ width: "100%", height: "100%" }}
//                         resizeMode="cover"
//                       />
//                     ) : (
//                       <View
//                         style={{
//                           width: "100%",
//                           height: "100%",
//                           backgroundColor: "#7b61ff",
//                           justifyContent: "center",
//                           alignItems: "center",
//                         }}
//                       >
//                         <Ionicons name="image-outline" size={20} color="#fff" />
//                       </View>
//                     )}
//                   </View>
//                   <View style={styles.cardBody}>
//                     <Text style={styles.cardTitle}>{rb.title}</Text>
//                     <View style={styles.cardMetaRow}>
//                       <Text style={styles.metaText}>{rb.date}</Text>
//                       <Text style={styles.metaText}>{rb.place}</Text>
//                     </View>
//                   </View>
//                   <View style={{ flexDirection: "row", alignItems: "center" }}>
//                     <View style={styles.qrIconWrapper}>
//                       <Ionicons
//                         name="qr-code-outline"
//                         size={16}
//                         color="#7b61ff"
//                       />
//                     </View>
//                     <View style={getStatusPillStyle(rb.pillType)}>
//                       <Text style={getStatusTextStyle(rb.pillType)}>
//                         {rb.pillType === "pending" ? "Pending" : "Booked"}
//                       </Text>
//                     </View>
//                   </View>
//                 </TouchableOpacity>
//               ))
//             )}
//           </View>
//         </ScrollView>
//       </View>

//       <BookingDetails
//         visible={bookingDetailsVisible}
//         onClose={closeBookingDetails}
//         booking={selectedBooking}
//         onShareDetails={handleShareDetails}
//         formatDate={formatDate}
//         formatTime={formatTime}
//         calculateTotal={calculateTotal}
//         getStatusColor={getStatusColor}
//       />

//       <PopUp
//         isVisible={isPopupVisible}
//         onYes={handleYes}
//         onNo={handleNo}
//         message={"Would you like to enable\nFingerprint Login?"}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   screen: {
//     flex: 1,
//     backgroundColor: "#f6f7fb",
//   },
//   container: {
//     flex: 1,
//   },
//   calendarWrapper: {
//     marginHorizontal: 20,
//     marginVertical: 12,
//   },
//   calendarCard: {
//     backgroundColor: "#ffffff",
//     borderRadius: 20,
//     padding: 16,
//     ...Platform.select({
//       ios: {
//         shadowColor: "#7b61ff",
//         shadowOpacity: 0.15,
//         shadowRadius: 12,
//         shadowOffset: { width: 0, height: 4 },
//       },
//       android: {
//         elevation: 4,
//       },
//     }),
//   },
//   calendarCardInner: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   calendarLeftSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//   },
//   calendarIconContainer: {
//     width: 48,
//     height: 48,
//     borderRadius: 14,
//     backgroundColor: "#fff",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   calendarTextContainer: {
//     flex: 1,
//   },
//   calendarMainText: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#1b1e28",
//     marginBottom: 4,
//   },
//   calendarSubText: {
//     fontSize: 13,
//     color: "#9aa3b2",
//     fontWeight: "500",
//   },
//   calendarRightSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//   },
//   todayDateBadge: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     alignItems: "center",
//   },
//   todayDateDay: {
//     fontSize: 16,
//     fontWeight: "800",
//     color: "#ffa861",
//     lineHeight: 18,
//   },
//   todayDateMonth: {
//     fontSize: 10,
//     fontWeight: "600",
//     color: "#ffca61",
//     textTransform: "uppercase",
//   },
//   tithiPreviewContainer: {
//     flexDirection: "row",
//     backgroundColor: "#f9da98",
//     borderRadius: 14,
//     padding: 12,
//     marginTop: 4,
//   },
//   tithiPreviewItem: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//   },
//   tithiDivider: {
//     width: 1,
//     height: "100%",
//     backgroundColor: "#fecfad",
//     marginHorizontal: 8,
//   },
//   tithiPreviewLabel: {
//     fontSize: 12,
//     color: "#9aa3b2",
//     fontWeight: "500",
//   },
//   tithiPreviewValue: {
//     fontSize: 12,
//     fontWeight: "700",
//     color: "#1b1e28",
//     marginLeft: "auto",
//   },
//   searchWrap: {
//     margin: 16,
//     marginBottom: 14,
//     marginHorizontal: 20,
//   },
//   searchBar: {
//     height: 46,
//     borderRadius: 14,
//     backgroundColor: "#efeef5",
//     paddingHorizontal: 14,
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   searchPlaceholder: {
//     marginLeft: 10,
//     color: "#9aa3b2",
//     fontSize: 14,
//   },
//   sectionHeader: {
//     margin: 10,
//     marginHorizontal: 20,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "800",
//     color: "#1b1e28",
//   },
//   addNew: {
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 12,
//     backgroundColor: "#eef7ff",
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//   },
//   addNewText: {
//     color: "#3a7bd5",
//     fontWeight: "700",
//   },
//   statsRow: {
//     margin: 6,
//     marginHorizontal: 20,
//     flexDirection: "row",
//     gap: 14,
//   },
//   statCard: {
//     flex: 1,
//     height: 110,
//     borderRadius: 16,
//     backgroundColor: "#ffffff",
//     padding: 14,
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOpacity: 0.06,
//         shadowRadius: 10,
//         shadowOffset: { width: 0, height: 4 },
//       },
//       android: {
//         elevation: 2,
//       },
//     }),
//   },
//   statNumber: {
//     color: "#ffffff",
//     fontSize: 28,
//     fontWeight: "800",
//   },
//   statLabel: {
//     marginTop: 8,
//     color: "#ffffff",
//     fontWeight: "600",
//     opacity: 0.9,
//   },
//   recentWrap: {
//     margin: 4,
//     marginBottom: 20,
//     marginHorizontal: 20,
//   },
//   card: {
//     backgroundColor: "#ffffff",
//     borderRadius: 16,
//     padding: 14,
//     marginTop: 12,
//     flexDirection: "row",
//     gap: 12,
//     alignItems: "center",
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOpacity: 0.06,
//         shadowRadius: 12,
//         shadowOffset: { width: 0, height: 4 },
//       },
//       android: {
//         elevation: 2,
//       },
//     }),
//   },
//   thumb: {
//     width: 42,
//     height: 42,
//     borderRadius: 12,
//     overflow: "hidden",
//   },
//   cardBody: {
//     flex: 1,
//   },
//   cardTitle: {
//     color: "#1b1e28",
//     fontWeight: "700",
//     fontSize: 15,
//   },
//   cardMetaRow: {
//     marginTop: 6,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//   },
//   metaText: {
//     color: "#9aa3b2",
//     fontSize: 12,
//   },
//   statusPill: {
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 10,
//   },
//   statusText: {
//     fontWeight: "700",
//     fontSize: 12,
//   },
//   bottomBar: {
//     position: "absolute",
//     left: 16,
//     right: 16,
//     bottom: 16,
//     backgroundColor: "#ffffff",
//     borderRadius: 24,
//     paddingVertical: 10,
//     paddingHorizontal: 14,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOpacity: 0.12,
//         shadowRadius: 16,
//         shadowOffset: { width: 0, height: -2 },
//       },
//       android: {
//         elevation: 8,
//       },
//     }),
//   },
//   tabBtn: {
//     flex: 1,
//     height: 52,
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: 16,
//   },
//   centerAction: {
//     width: 64,
//     height: 64,
//     borderRadius: 16,
//     backgroundColor: "#f9f5ff",
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: -28,
//     borderWidth: 1,
//     borderColor: "#efe9ff",
//   },
//   qrIconWrapper: {
//     backgroundColor: "#f1edff",
//     padding: 6,
//     borderRadius: 8,
//     marginLeft: 6,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   promoCard: {
//     width: width - 40,
//     height: 200,
//     marginHorizontal: 20,
//     padding: 16,
//     justifyContent: "flex-start",
//   },
//   promoTag: {
//     alignSelf: "flex-end",
//     backgroundColor: "rgba(255,255,255,0.8)",
//     paddingVertical: 4,
//     paddingHorizontal: 10,
//     borderRadius: 16,
//   },
//   promoTagText: {
//     fontSize: 12,
//     fontWeight: "700",
//     color: "#1b1e28",
//   },
//   promoMeta: {
//     color: "#fff",
//     opacity: 0.9,
//     marginTop: 8,
//   },
//   promoTitle: {
//     color: "#fff",
//     fontSize: 22,
//     fontWeight: "800",
//     marginTop: 10,
//   },
//   promoDotRow: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 12,
//     gap: 6,
//   },
//   promoDotSmall: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: "#e0e0e0",
//   },
//   promoDotActive: {
//     width: 40,
//     height: 6,
//     borderRadius: 4,
//     backgroundColor: "#e0e0e0",
//     overflow: "hidden",
//   },
//   promoProgressLine: {
//     backgroundColor: "#E88F14",
//     alignSelf: "flex-start",
//   },
//   promoOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(0,0,0,0.3)", // thin black layer
//     borderRadius: 20,
//   },
//   promoContent: {
//     flex: 1,
//     justifyContent: "flex-start",
//   },
// });
// screens/DashboardScreen.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SunCalc from "suncalc";

const Home = ({ navigation }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sunTimes, setSunTimes] = useState(null);
  const [notifiedFestivals, setNotifiedFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [greeting, setGreeting] = useState("");

  // Fallback location (Odisha)
  const FALLBACK_LOCATION = { latitude: 20.2961, longitude: 85.8245 };

  // Update greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else if (hour < 20) setGreeting("Good Evening");
    else setGreeting("Good Night");
  }, []);

  // Format date beautifully
  const formatDate = useCallback((date) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-IN", options);
  }, []);

  // Format time
  const formatTime = useCallback((date) => {
    if (!date) return "--:-- --";
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  // Get user location
  const getUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setUserLocation(FALLBACK_LOCATION);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      console.error("Location error:", error);
      setUserLocation(FALLBACK_LOCATION);
    }
  }, []);

  // Calculate sun times
  const calculateSunTimes = useCallback(() => {
    if (!userLocation) return;

    try {
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const times = SunCalc.getTimes(
        today,
        userLocation.latitude,
        userLocation.longitude,
      );

      setSunTimes({
        sunrise: times.sunrise,
        sunset: times.sunset,
      });
    } catch (error) {
      console.error("SunCalc error:", error);
    }
  }, [userLocation]);

  // Load notified festivals from AsyncStorage
  const loadNotifiedFestivals = useCallback(async () => {
    try {
      const notifications = await AsyncStorage.getItem(
        "panchang_notifications",
      );
      if (notifications) {
        const parsed = JSON.parse(notifications);

        // Transform data into festival list
        const festivals = Object.entries(parsed).map(([key, value]) => ({
          id: key,
          date: new Date(value.date),
          formattedDate: new Date(value.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          festivals: value.panchangData?.festivals || [],
          tithi: value.panchangData?.tithi || "N/A",
          nakshatra: value.panchangData?.nakshatra || "N/A",
          sunrise: value.panchangData?.sunrise,
          sunset: value.panchangData?.sunset,
          notifiedAt: new Date(value.notifiedAt),
          calendarEventId: value.calendarEventId,
        }));

        // Sort by date (nearest first)
        festivals.sort((a, b) => a.date - b.date);

        // Separate upcoming and past
        const now = new Date();
        const upcoming = festivals.filter((f) => f.date >= now);
        const past = festivals.filter((f) => f.date < now);

        setNotifiedFestivals([...upcoming, ...past]);
      } else {
        setNotifiedFestivals([]);
      }
    } catch (error) {
      console.error("Error loading festivals:", error);
      Alert.alert("Error", "Failed to load notified festivals");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([getUserLocation(), loadNotifiedFestivals()]);
  }, [getUserLocation, loadNotifiedFestivals]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getUserLocation();
      loadNotifiedFestivals();
    }, [getUserLocation, loadNotifiedFestivals]),
  );

  // Update sun times when location changes
  useEffect(() => {
    calculateSunTimes();
  }, [userLocation, calculateSunTimes]);

  // Remove notification
  const removeNotification = useCallback(async (festivalId) => {
    Alert.alert(
      "Remove Notification",
      "Are you sure you want to remove this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const notifications = await AsyncStorage.getItem(
                "panchang_notifications",
              );
              if (notifications) {
                const parsed = JSON.parse(notifications);
                delete parsed[festivalId];
                await AsyncStorage.setItem(
                  "panchang_notifications",
                  JSON.stringify(parsed),
                );

                // Update state
                setNotifiedFestivals((prev) =>
                  prev.filter((f) => f.id !== festivalId),
                );
                Alert.alert("Success", "Notification removed successfully");
              }
            } catch (error) {
              console.error("Error removing notification:", error);
              Alert.alert("Error", "Failed to remove notification");
            }
          },
        },
      ],
    );
  }, []);

  // Render header with sun times
  const renderHeader = () => (
    <LinearGradient
      colors={["#FF9800", "#F44336"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <View intensity={20} style={styles.headerBlur}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.date}>{formatDate(currentDate)}</Text>
          </View>

          <TouchableOpacity
            style={styles.sunTimesCard}
            onPress={() => router.push("/PanchangScreen")}
            activeOpacity={0.8}
          >
            <View style={styles.sunTimeItem}>
              <Ionicons name="sunny-outline" size={24} color="#FFD700" />
              <View style={styles.sunTimeText}>
                <Text style={styles.sunTimeLabel}>Sunrise</Text>
                <Text style={styles.sunTimeValue}>
                  {sunTimes ? formatTime(sunTimes.sunrise) : "--:-- --"}
                </Text>
              </View>
            </View>

            <View style={styles.sunTimeDivider} />

            <View style={styles.sunTimeItem}>
              <Ionicons name="moon-outline" size={24} color="#E1E1E1" />
              <View style={styles.sunTimeText}>
                <Text style={styles.sunTimeLabel}>Sunset</Text>
                <Text style={styles.sunTimeValue}>
                  {sunTimes ? formatTime(sunTimes.sunset) : "--:-- --"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.locationInfo}>
            <Ionicons name="location-outline" size={14} color="#fff" /> Based on
            your location
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  // Render festival item
  const renderFestivalItem = ({ item }) => {
    const isUpcoming = item.date >= new Date();

    return (
      <TouchableOpacity
        style={styles.festivalCard}
        onPress={() =>
          router.push("/PanchangScreen", {
            selectedDate: item.date.toISOString(),
          })
        }
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isUpcoming ? ["#FFF9E6", "#FFF"] : ["#F5F5F5", "#FFF"]}
          style={styles.festivalGradient}
        >
          <View style={styles.festivalHeader}>
            <View style={styles.festivalDateContainer}>
              <Text style={styles.festivalDate}>{item.formattedDate}</Text>
              <View
                style={[
                  styles.festivalBadge,
                  isUpcoming ? styles.upcomingBadge : styles.pastBadge,
                ]}
              >
                <Text style={styles.festivalBadgeText}>
                  {isUpcoming ? "Upcoming" : "Past"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => removeNotification(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="close-circle-outline" size={22} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          {item.festivals.length > 0 ? (
            <View style={styles.festivalsList}>
              {item.festivals.map((festival, index) => (
                <View key={index} style={styles.festivalChip}>
                  <Ionicons name="star" size={14} color="#FF9800" />
                  <Text style={styles.festivalChipText}>{festival}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noFestivalText}>No festivals on this day</Text>
          )}

          <View style={styles.festivalDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.tithi}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="star-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.nakshatra}</Text>
            </View>
          </View>
          {/* 
          {item.calendarEventId && (
            <View style={styles.calendarIndicator}>
              <Ionicons name="calendar" size={14} color="#4CAF50" />
              <Text style={styles.calendarText}>Added to calendar</Text>
            </View>
          )} */}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Notified Festivals</Text>
      <Text style={styles.emptyText}>
        You haven't set any festival notifications yet. Browse festivals and tap
        "Notify Me" to get started.
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push("/PanchangScreen")}
      >
        <LinearGradient
          colors={["#FF9800", "#F44336"]}
          style={styles.exploreButtonGradient}
        >
          <Text style={styles.exploreButtonText}>Explore Festivals</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="notifications" size={22} color="#FF9800" /> Your
              Notified Festivals
            </Text>
            <Text style={styles.sectionCount}>
              {notifiedFestivals.length}{" "}
              {notifiedFestivals.length === 1 ? "item" : "items"}
            </Text>
          </View>

          {notifiedFestivals.length > 0 ? (
            <FlatList
              data={notifiedFestivals}
              renderItem={renderFestivalItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.festivalsList}
            />
          ) : (
            renderEmptyState()
          )}

          {/* Quick Action Buttons */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/PanchangScreen")}
            >
              <LinearGradient
                colors={["#4CAF50", "#45A049"]}
                style={styles.actionGradient}
              >
                <Ionicons name="calendar" size={24} color="#fff" />
                <Text style={styles.actionText}>View Panchang</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // You can implement a search or filter feature here
                Alert.alert(
                  "Coming Soon",
                  "Festival search feature coming soon!",
                );
              }}
            >
              <LinearGradient
                colors={["#2196F3", "#1976D2"]}
                style={styles.actionGradient}
              >
                <Ionicons name="search" size={24} color="#fff" />
                <Text style={styles.actionText}>Search Festivals</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerBlur: {
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 20,
  },
  greetingContainer: {
    gap: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  date: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sunTimesCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  sunTimeItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sunTimeDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 16,
  },
  sunTimeText: {
    gap: 2,
  },
  sunTimeLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "uppercase",
  },
  sunTimeValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  locationInfo: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "right",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  sectionCount: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  festivalsList: {
    gap: 16,
  },
  festivalCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    width: 370,
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  festivalGradient: {
    padding: 16,
  },
  festivalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  festivalDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  festivalDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  festivalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  upcomingBadge: {
    backgroundColor: "#4CAF50",
  },
  pastBadge: {
    backgroundColor: "#9E9E9E",
  },
  festivalBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  deleteButton: {
    padding: 4,
  },
  festivalsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  festivalChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  festivalChipText: {
    fontSize: 14,
    color: "#FF9800",
    fontWeight: "500",
  },
  noFestivalText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 12,
  },
  festivalDetails: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
  },
  calendarIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  calendarText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  exploreButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  exploreButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionGradient: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});

export default Home;
