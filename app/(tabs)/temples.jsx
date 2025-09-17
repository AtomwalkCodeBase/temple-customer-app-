import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, ImageBackground, Modal, Platform } from "react-native";
import styled from "styled-components/native";
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

  const [showPopup, setShowPopup] = useState(false);
  const [selectedTemple, setSelectedTemple] = useState(null);

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
    return data.filter((t) => {
      const byQ =
        !q ||
        t.name.toLowerCase().includes(q.toLowerCase()) ||
        t.email.toLowerCase().includes(q.toLowerCase());
      const byLoc = !loc || t.location.toLowerCase().includes(loc.toLowerCase());
      const byR = !r || Number(t.rating) >= r;
      return byQ && byLoc && byR;
    });
  }, [q, loc, minRating, data]);

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

  const renderItem = ({ item }) => (
    <TempleCard temple={item} onBook={() => openPopup(item)} />
  );

  if (loading) {
    return (
      <Screen style={{ justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#E88F14" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header>
        <TitleRow>
          <Title>🔔 Sacred Temples</Title>
          <Subtitle>Discover divine temples and book your spiritual journey with us</Subtitle>
        </TitleRow>

        <Filters>
          <Input
            placeholder="Search temples"
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
          />
          <SearchBtn activeOpacity={0.9}>
            <BtnText>Search</BtnText>
          </SearchBtn>
        </Filters>
      </Header>

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

      <Modal
        visible={showPopup}
        transparent
        animationType="fade"
        onRequestClose={closePopup}
      >
        <CenterWrap>
          <Backdrop onPress={closePopup} />
          <PopupCard>
            <PopupTitle>
              Quick Bookings{selectedTemple ? ` — ${selectedTemple.name}` : ""}
            </PopupTitle>

            <Actions>
              <ActionCard activeOpacity={0.9} onPress={onHall}>
                <IconWrap style={{ backgroundColor: "#E88F14" }}>
                  <Ionicons name="home-outline" size={18} color="#fff" />
                </IconWrap>
                <ActionText>Hall Booking</ActionText>
              </ActionCard>

              <ActionCard activeOpacity={0.9} onPress={onPooja}>
                <IconWrap style={{ backgroundColor: "#dc7d0d" }}>
                  <Ionicons name="hand-left-outline" size={18} color="#fff" />
                </IconWrap>
                <ActionText>Pooja Booking</ActionText>
              </ActionCard>

              <ActionCard activeOpacity={0.9} onPress={onEvents}>
                <IconWrap style={{ backgroundColor: "#c26f0c" }}>
                  <Ionicons name="calendar-outline" size={18} color="#fff" />
                </IconWrap>
                <ActionText>Temple Events</ActionText>
              </ActionCard>
            </Actions>

            <CloseBtn onPress={closePopup}>
              <CloseText>Close</CloseText>
            </CloseBtn>
          </PopupCard>
        </CenterWrap>
      </Modal>
    </Screen>
  );
}

function TempleCard({ temple, onBook }) {
  return (
    <Card>
      <TopImage
        source={{ uri: temple.image }}
        imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <RatingPill>
          <Ionicons name="star" size={12} color="#fff" />
          <RatingText>{temple.rating.toFixed(1)}</RatingText>
        </RatingPill>
      </TopImage>

      <CardBody>
        <TempleName numberOfLines={1}>{temple.name}</TempleName>

        <Row>
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Meta numberOfLines={2}>{temple.location}</Meta>
        </Row>

        <Row style={{ marginTop: 6 }}>
          <Ionicons name="mail-outline" size={14} color="#6b7280" />
          <Meta numberOfLines={1}>{temple.email}</Meta>
        </Row>

        <SectionLabel>Temple Timings</SectionLabel>
        <Chips>
          {temple.timings.map((t, index) => (
            <Chip key={index}>
              <ChipText>{t}</ChipText>
            </Chip>
          ))}
        </Chips>

        <BookBtn activeOpacity={0.9} onPress={onBook}>
          <BookText>Book Seva</BookText>
        </BookBtn>
      </CardBody>
    </Card>
  );
}

const Screen = styled.SafeAreaView`
  flex: 1;
  background-color: #f6f7fb;
`;

const Header = styled.View`
  padding: 16px;
  padding-bottom: 12px;
  background-color: #E88F14;
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 18px;
`;

const TitleRow = styled.View``;

const Title = styled.Text`
  color: #ffffff;
  font-size: 20px;
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

const BookBtn = styled.TouchableOpacity`
  margin-top: 12px;
  height: 40px;
  border-radius: 12px;
  background-color: #E88F14;
  align-items: center;
  justify-content: center;
`;

const BookText = styled.Text`
  color: #ffffff;
  font-weight: 800;
`;

/* NEW: modal styles */
const CenterWrap = styled.View`
  flex: 1;
  position: relative;
  justify-content: center;
  align-items: center;
`;

const Backdrop = styled.Pressable`
  position: absolute;
  inset: 0px;
  background-color: rgba(0, 0, 0, 0.4);
`;

const PopupCard = styled.View`
  width: 90%;
  max-width: 420px;
  border-radius: 16px;
  background-color: #ffffff;
  padding: 16px;
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-opacity: 0.15;
      shadow-radius: 16px;
      shadow-offset: 0px 8px;
    `,
    android: `
      elevation: 8;
    `,
  })}
`;

const PopupTitle = styled.Text`
  font-size: 18px;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 12px;
`;

const Actions = styled.View`
  gap: 10px;
`;

const ActionCard = styled.TouchableOpacity`
  padding: 14px;
  border-radius: 12px;
  background-color: #fff7ec;
  border: 1px solid #fde8cc;
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

const IconWrap = styled.View`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
`;

const ActionText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #7a3800;
`;

const CloseBtn = styled.TouchableOpacity`
  margin-top: 12px;
  align-self: flex-end;
  padding: 10px 14px;
  border-radius: 10px;
  background-color: #f1f5f9;
`;

const CloseText = styled.Text`
  font-weight: 700;
  color: #111827;
`;
