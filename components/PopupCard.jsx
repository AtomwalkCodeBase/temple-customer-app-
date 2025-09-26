import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
      <View style={styles.centerWrap}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.popupCard}>
          {/* Header */}
          <View style={styles.popupHeader}>
            <View style={styles.popupHeaderContent}>
              <View style={styles.popupIcon}>
                <Ionicons name="flash" size={24} color="#fff" />
              </View>
              <View style={styles.popupHeaderText}>
                <Text style={styles.popupTitle}>Quick Bookings</Text>
                {selectedTemple && <Text style={styles.popupSubtitle}>{selectedTemple.name}</Text>}
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={onHall} 
              style={[styles.actionCard, styles.hallCard]}
            >
              <View style={styles.actionCardContent}>
                <View style={[styles.actionIconContainer, styles.hallIcon]}>
                  <Ionicons name="business-outline" size={24} color="#fff" />
                </View>
                <View style={styles.actionCardText}>
                  <Text style={styles.actionTitle}>Hall Booking</Text>
                  <Text style={styles.actionSubtitle}>Reserve temple halls</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={onPooja} 
              style={[styles.actionCard, styles.poojaCard]}
            >
              <View style={styles.actionCardContent}>
                <View style={[styles.actionIconContainer, styles.poojaIcon]}>
                  <MaterialCommunityIcons name="hands-pray" size={24} color="#fff" />
                </View>
                <View style={styles.actionCardText}>
                  <Text style={styles.actionTitle}>Pooja Booking</Text>
                  <Text style={styles.actionSubtitle}>Schedule sacred rituals</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={onEvents} 
              style={[styles.actionCard, styles.eventsCard]}
            >
              <View style={styles.actionCardContent}>
                <View style={[styles.actionIconContainer, styles.eventsIcon]}>
                  <Ionicons name="calendar-outline" size={24} color="#fff" />
                </View>
                <View style={styles.actionCardText}>
                  <Text style={styles.actionTitle}>Temple Events</Text>
                  <Text style={styles.actionSubtitle}>Join spiritual gatherings</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.popupFooter}>
            <Text style={styles.footerText}>Choose your Sacred Journey above</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  popupCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 16 },
      },
      android: {
        elevation: 16,
      },
    }),
  },
  popupHeader: {
    padding: 24,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#E88F14",
  },
  popupHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  popupIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  popupHeaderText: {
    flex: 1,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 2,
  },
  popupSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  actionsContainer: {
    padding: 24,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionCardText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  actionArrow: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  popupFooter: {
    padding: 12,
    paddingBottom: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  hallCard: {
    backgroundColor: "#FEF7F0",
    borderColor: "#FED7AA",
  },
  poojaCard: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
  },
  eventsCard: {
    backgroundColor: "#F7FEF0",
    borderColor: "#BBF7D0",
  },
  hallIcon: {
    backgroundColor: "#EA580C",
  },
  poojaIcon: {
    backgroundColor: "#0284C7",
  },
  eventsIcon: {
    backgroundColor: "#16A34A",
  },
});