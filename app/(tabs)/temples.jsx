import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  View
} from "react-native";
import Cards from "../../components/Cards";
import Header from "../../components/Header";
import PopupCardComponent from "../../components/PopupCard";
import { getTempleList } from "../../services/productService";

const { width } = Dimensions.get("window");
const H_PADDING = 16;               
const COL_GAP = 16;                  
const CARD_W = Math.floor((width - H_PADDING * 2 - COL_GAP) / 2);

export default function Temples() {
  const router = useRouter();
  const [loc, setLoc] = useState("");
  const [minRating, setMinRating] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTemple, setSelectedTemple] = useState(null);

  const handleSearch = () => {
    // Trim and lowercase the search query
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      // If search is empty, reset any filters
      setQ('');
      return;
    }

    // Update the search state
    setQ(query);
  };

  useEffect(() => {
    const gettemplelist = async () => {
      try {
        const response = await getTempleList();

        const temples = response?.data?.map((t) => ({
          id: t.temple_id,
          name: t.name,
          email: t.email_id,
          location: t.location,
          image: t.image,
          rating: t.rating ? t.rating : 4.5,
          timings:
            t?.additional_field_list?.temple_timings?.selected_time_slots?.map(
              (ts) => `${ts.name} (${ts.start} - ${ts.end})`
            ) || [],
        }));

        setData(temples);
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };

    gettemplelist();
  }, []);

  const filtered = useMemo(() => {
  const r = parseFloat(minRating);
  const query = searchQuery.trim().toLowerCase();
  return data.filter((t) => {
    const byQ =
      !query ||
      t.name.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query);
    const byLoc = !loc || t.location.toLowerCase().includes(loc.toLowerCase());
    const byR = !r || Number(t.rating) >= r;
    return byQ && byLoc && byR;
    });
  }, [searchQuery, loc, minRating, data]);

  const openPopup = (temple) => {
    setSelectedTemple(temple);
    setShowPopup(true);
  };
  const closePopup = () => {
    setShowPopup(false);
    setSelectedTemple(null);
  };

const onHall = () => {
  const payload = selectedTemple? selectedTemple.id : "";
  router.push({
    pathname: "/screens/BookSevaScreen",
    params: { type: "HALL", temple: payload },
  });
  closePopup();
};

const onPooja = () => {
  const payload = selectedTemple ? selectedTemple.id : "";
  router.push({
    pathname: "/screens/BookSevaScreen",
    params: { type: "PUJA", temple: payload},
  });
  closePopup();
};

const onEvents = () => {
  const payload = selectedTemple ? selectedTemple.id : "";
  router.push({
    pathname: "/screens/BookSevaScreen",
    params: { type: "EVENT", temple: payload },
  });
  closePopup();
};

  if (loading) {
    return (
      <View style={[styles.screen, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#E88F14" />
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <Cards
      type="temple"
      image={item.image}
      title={item.name}
      location={item.location}
      email={item.email}
      rating={item.rating}
      timings={item.timings}
      onBookPress={() => openPopup(item)}
      width={CARD_W}
    />
  );

  const columnWrapperStyle = {
    justifyContent: "space-between",
    paddingHorizontal: H_PADDING,
    marginBottom: 16,
  };

  const contentContainerStyle = { 
    paddingTop: 12, 
    paddingBottom: 24 
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Header
        type="type2"
        userName="Vishnuvardhan"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchPress={handleSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={columnWrapperStyle}
        contentContainerStyle={contentContainerStyle}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      <PopupCardComponent
        visible={showPopup}
        selectedTemple={selectedTemple}
        onClose={closePopup}
        onHall={onHall}
        onPooja={onPooja}
        onEvents={onEvents}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  titleRow: {
    // Styles for TitleRow component
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: "#e9e6ff",
    fontSize: 12,
    marginTop: 6,
  },
  filters: {
    marginTop: 14,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#111827",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
  card: {
    width: CARD_W,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  topImage: {
    width: "100%",
    height: 120,
    overflow: "hidden",
  },
  ratingPill: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  cardBody: {
    padding: 12,
  },
  templeName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1f2937",
  },
  row: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meta: {
    flex: 1,
    color: "#6b7280",
    fontSize: 12,
  },
  sectionLabel: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },
  chips: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#eef2ff",
    borderRadius: 10,
  },
  chipText: {
    color: "#4338ca",
    fontWeight: "700",
    fontSize: 12,
  },
});