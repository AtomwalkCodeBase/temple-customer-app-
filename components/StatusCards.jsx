import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform } from 'react-native';
import styled from 'styled-components/native';

const StatusCards = ({ stats, onAddNew }) => {
  return (
    <>
      <SectionHeader>
        <SectionTitle>Your Bookings</SectionTitle>
        <AddNew activeOpacity={0.85} onPress={onAddNew}>
          <Ionicons name="add-circle-outline" size={16} color="#3a7bd5" />
          <AddNewText>Add new</AddNewText>
        </AddNew>
      </SectionHeader>
      <StatsRow>
        <StatCard bg="#7b61ff">
          <StatNumber>{stats.total}</StatNumber>
          <StatLabel>Total Bookings</StatLabel>
        </StatCard>
        <StatCard bg="#ff7066">
          <StatNumber>{stats.active}</StatNumber>
          <StatLabel>Active Bookings</StatLabel>
        </StatCard>
        <StatCard bg="#d79b2d">
          <StatNumber>{stats.completed}</StatNumber>
          <StatLabel>Completed</StatLabel>
        </StatCard>
      </StatsRow>
    </>
  );
};

// Styled components
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

export default StatusCards;