import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, ImageBackground, Platform } from "react-native";
import styled from "styled-components/native";
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
  const [q, setQ] = useState("");
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
        console.log("Error fetching temples:", error);
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
      <Screen style={{ justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#E88F14" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        type="type2"
        userName="Vishnuvardhan"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchPress={handleSearch}
      />

      <List
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: H_PADDING,
          marginBottom: 16,
        }}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
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

    </Screen>
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

const Screen = styled.SafeAreaView`
  flex: 1;
  background-color: #f6f7fb;
`;

const TitleRow = styled.View``;

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
  margin-top: 14px;
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

const BtnText = styled.Text`
  color: #fff;
  font-weight: 700;
`;

const List = styled(FlatList).attrs(() => ({}))``;

const Card = styled.View`
  width: ${CARD_W}px;
  background-color: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-opacity: 0.08;
      shadow-radius: 12px;
      shadow-offset: 0px 4px;
    `,
    android: `
      elevation: 3;
    `,
  })}
`;

const TopImage = styled(ImageBackground)`
  width: 100%;
  height: 120px;
  overflow: hidden;
`;

const RatingPill = styled.View`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0,0,0,0.45);
  padding: 4px 8px;
  border-radius: 12px;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const RatingText = styled.Text`
  color: #fff;
  font-size: 12px;
  font-weight: 700;
`;

const CardBody = styled.View`
  padding: 12px;
`;

const TempleName = styled.Text`
  font-size: 15px;
  font-weight: 800;
  color: #1f2937;
`;

const Row = styled.View`
  margin-top: 6px;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const Meta = styled.Text`
  flex: 1;
  color: #6b7280;
  font-size: 12px;
`;

const SectionLabel = styled.Text`
  margin-top: 10px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
`;

const Chips = styled.View`
  margin-top: 6px;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.View`
  padding: 6px 10px;
  background-color: #eef2ff;
  border-radius: 10px;
`;

const ChipText = styled.Text`
  color: #4338ca;
  font-weight: 700;
  font-size: 12px;
`;