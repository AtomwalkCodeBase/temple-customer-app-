import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Platform } from "react-native";
import styled from "styled-components/native";

export default function PopupCardComponent({
  visible,
  selectedTemple,
  onClose,
  onHall,
  onPooja,
  onEvents,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <CenterWrap>
        <Backdrop onPress={onClose} />
        <PopupCard>
          {/* Header */}
          <PopupHeader>
            <PopupHeaderContent>
              <PopupIcon>
                <Ionicons name="flash" size={24} color="#fff" />
              </PopupIcon>
              <PopupHeaderText>
                <PopupTitle>Quick Bookings</PopupTitle>
                {selectedTemple && <PopupSubtitle>{selectedTemple.name}</PopupSubtitle>}
              </PopupHeaderText>
            </PopupHeaderContent>
            <CloseButton onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </CloseButton>
          </PopupHeader>

          {/* Actions */}
          <ActionsContainer>
            <ActionCard activeOpacity={0.8} onPress={onHall} style={{ ...styles.actionCard, ...styles.hallCard }}>
              <ActionCardContent>
                <ActionIconContainer style={styles.hallIcon}>
                  <Ionicons name="business-outline" size={24} color="#fff" />
                </ActionIconContainer>
                <ActionCardText>
                  <ActionTitle>Hall Booking</ActionTitle>
                  <ActionSubtitle>Reserve temple halls</ActionSubtitle>
                </ActionCardText>
              </ActionCardContent>
              <ActionArrow>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </ActionArrow>
            </ActionCard>

            <ActionCard activeOpacity={0.8} onPress={onPooja} style={{ ...styles.actionCard, ...styles.poojaCard }}>
              <ActionCardContent>
                <ActionIconContainer style={styles.poojaIcon}>
                  <MaterialCommunityIcons name="hands-pray" size={24} color="#fff" />
                </ActionIconContainer>
                <ActionCardText>
                  <ActionTitle>Pooja Booking</ActionTitle>
                  <ActionSubtitle>Schedule sacred rituals</ActionSubtitle>
                </ActionCardText>
              </ActionCardContent>
              <ActionArrow>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </ActionArrow>
            </ActionCard>

            <ActionCard activeOpacity={0.8} onPress={onEvents} style={{ ...styles.actionCard, ...styles.eventsCard }}>
              <ActionCardContent>
                <ActionIconContainer style={styles.eventsIcon}>
                  <Ionicons name="calendar-outline" size={24} color="#fff" />
                </ActionIconContainer>
                <ActionCardText>
                  <ActionTitle>Temple Events</ActionTitle>
                  <ActionSubtitle>Join spiritual gatherings</ActionSubtitle>
                </ActionCardText>
              </ActionCardContent>
              <ActionArrow>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </ActionArrow>
            </ActionCard>
          </ActionsContainer>

          {/* Footer */}
          <PopupFooter>
            <FooterText>Choose your Sacred Journey above</FooterText>
          </PopupFooter>
        </PopupCard>
      </CenterWrap>
    </Modal>
  );
}

// Styled components (same as your original CSS)
const CenterWrap = styled.View`
  flex: 1;
  position: relative;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Backdrop = styled.Pressable`
  position: absolute;
  inset: 0px;
  background-color: rgba(0, 0, 0, 0.6);
`;

const PopupCard = styled.View`
  width: 100%;
  max-width: 400px;
  border-radius: 24px;
  background-color: #ffffff;
  overflow: hidden;
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-opacity: 0.25;
      shadow-radius: 32px;
      shadow-offset: 0px 16px;
    `,
    android: `elevation: 16;`,
  })}
`;

const PopupHeader = styled.View`
  padding: 24px;
  padding-bottom: 20px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  background-color: #E88F14;
`;

const PopupHeaderContent = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const PopupIcon = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`;

const PopupHeaderText = styled.View`
  flex: 1;
`;

const PopupTitle = styled.Text`
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 2px;
`;

const PopupSubtitle = styled.Text`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
`;

const CloseButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: rgba(255, 255, 255, 0.15);
  align-items: center;
  justify-content: center;
  margin-left: 12px;
`;

const ActionsContainer = styled.View`
  padding: 24px 20px 16px 20px;
  gap: 12px;
`;

const ActionCard = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 20px;
  border-radius: 16px;
  background-color: #ffffff;
  border: 1px solid #E2E8F0;
`;

const ActionCardContent = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const ActionIconContainer = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`;

const ActionCardText = styled.View`
  flex: 1;
`;

const ActionTitle = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 2px;
`;

const ActionSubtitle = styled.Text`
  font-size: 13px;
  color: #64748B;
  font-weight: 500;
`;

const ActionArrow = styled.View`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const PopupFooter = styled.View`
  padding: 12px 20px 20px 20px;
  background-color: #F8FAFC;
  align-items: center;
`;

const FooterText = styled.Text`
  font-size: 13px;
  color: #64748B;
  font-weight: 500;
`;

const styles = {
  actionCard: { width: "100%" },
  hallCard: { backgroundColor: "#FEF7F0", borderColor: "#FED7AA" },
  poojaCard: { backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" },
  eventsCard: { backgroundColor: "#F7FEF0", borderColor: "#BBF7D0" },
  hallIcon: { backgroundColor: "#EA580C" },
  poojaIcon: { backgroundColor: "#0284C7" },
  eventsIcon: { backgroundColor: "#16A34A" },
};
