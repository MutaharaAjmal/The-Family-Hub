import { StyleSheet, View } from "react-native";
import { AppText } from "../../../src/components/AppText";
import { Ionicons } from "@expo/vector-icons";

export const TabHeader = ({
  tabType,
}: {
  tabType: "Shopping" | "Chores" | "To Do";
}) => {
  const config = {
    Shopping: {
      icon: "cart-outline",
      color: "#10B981",
      bg: "#D1FAE5",
      subtitle: "Manage your grocery list",
    },
    Chores: {
      icon: "calendar",
      color: "#1E3A8A",
      bg: "#ffffff",
      subtitle: "Track daily tasks",
    },
    "To Do": {
      icon: "checkbox-outline",
      color: "#3B82F6",
      bg: "#DBEAFE",
      subtitle: "Stay organized daily",
    },
  };

  return (
    <View style={styles.tabHeader}>
      <View
        style={[
          styles.tabIconBg,
          { backgroundColor: config[tabType]?.bg || "#EFF6FF" },
        ]}
      >
        <Ionicons
          name={(config[tabType]?.icon || "list-outline") as any}
          size={28}
          color={config[tabType]?.color || "#1E3A8A"}
        />
      </View>
      <View>
        <AppText style={styles.tabTitle}>{tabType}</AppText>
        <AppText style={styles.tabSubtitle}>
          {config[tabType]?.subtitle || "Manage your items"}
        </AppText>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    marginBottom: 8,
  },
  tabIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  tabTitle: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
  tabSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },

  statsContainer: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "800", color: "#1E3A8A" },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: "#E2E8F0" },
  progressBar: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },

  suggestionsContainer: { paddingHorizontal: 16, marginBottom: 12 },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  suggestionText: { fontSize: 13, color: "#92400E", fontWeight: "500" },

  swipeActions: { flexDirection: "row", alignItems: "center", height: "100%" },
  swipeEdit: {
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: "100%",
  },
  swipeDelete: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: "100%",
  },

  fabContainer: {
    position: "absolute",
    right: 20,
    bottom: 20,
    alignItems: "flex-end",
  },
  fabMenu: {
    marginBottom: 12,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  fabMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  quickActions: { marginTop: 20, flexDirection: "row", gap: 12 },
  quickActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: { color: "#1E3A8A", fontWeight: "600" },
});
