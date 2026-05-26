import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { listStyles } from "./ItemModal";
import { AppText } from "../../../src/components/AppText";
import { useState } from "react";

import { Ionicons } from "@expo/vector-icons";

// Animated FAB Component
interface AnimatedFABProps {
  onAddPress: () => void;
  onMealSyncPress: () => void;
  showMealSync: boolean;
  tabType: string;
}
export const AnimatedFAB = ({
  onAddPress,
  onMealSyncPress,
  showMealSync,
  tabType,
}: AnimatedFABProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.fabContainer}>
      {expanded && (
        <Animated.View style={styles.fabMenu}>
          <TouchableOpacity
            style={styles.fabMenuItem}
            onPress={() => {
              onAddPress();
              setExpanded(false);
            }}
          >
            <Ionicons name="add-circle" size={24} color="#1E3A8A" />
            <AppText>Add Item</AppText>
          </TouchableOpacity>
          {showMealSync && tabType === "Shopping" && (
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => {
                onMealSyncPress();
                setExpanded(false);
              }}
            >
              <Ionicons name="restaurant" size={24} color="#1E3A8A" />
              <AppText>From Meal Plan</AppText>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
      <TouchableOpacity
        style={listStyles.fab}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.9}
      >
        <Ionicons name={expanded ? "close" : "add"} size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};
export const styles = StyleSheet.create({
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
  suggestionsContainer: { paddingHorizontal: 16, marginBottom: 8 },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF2FF",
    // backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  suggestionText: { fontSize: 13, color: "#1E3A8A", fontWeight: "500" },
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
{
  /* <AnimatedFAB
          onAddPress={openModal}
          onMealSyncPress={openMealSyncModal}
          showMealSync={tabType === "Shopping"}
          tabType={tabType}
        /> */
}
