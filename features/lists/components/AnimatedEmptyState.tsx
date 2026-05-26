import { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText } from "../../../src/components/AppText";
import { Ionicons } from "@expo/vector-icons";
import { listStyles } from "./ItemModal";

export const AnimatedEmptyState = ({
  cfg,
  onAddPress,
  onSuggestionSelect,
}: {
  cfg: any;
  onAddPress: () => void;
  onSuggestionSelect: (suggestion: string) => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        listStyles.premiumEmptyContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View
        style={{
          backgroundColor: "#EFF6FF",
          padding: 20,
          borderRadius: 50,
          marginBottom: 10,
        }}
      >
        <Ionicons name={cfg.icon} size={48} color="#1E3A8A" />
      </View>

      <AppText style={listStyles.premiumTitle}>{cfg.title}</AppText>
      <AppText style={listStyles.premiumSubtitle}>{cfg.subtitle}</AppText>

      {/* <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={onAddPress}>
          <Ionicons name="add-circle" size={20} color="#1E3A8A" />
          <AppText style={styles.quickActionText}>Add First Item</AppText>
        </TouchableOpacity>
      </View> */}

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 10,
          marginTop: 20,
        }}
      >
        {cfg.tips?.map((tip: any) => (
          <TouchableOpacity
            key={tip}
            onPress={() => onSuggestionSelect(tip)}
            style={listStyles.suggestionChip}
          >
            <Ionicons
              name="add"
              size={16}
              color="#1E3A8A"
              style={{ marginRight: 4 }}
            />
            <AppText style={listStyles.chipText}>{tip}</AppText>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={listStyles.ctaBtn}
        onPress={onAddPress}
        activeOpacity={0.8}
      >
        <AppText style={listStyles.ctaBtnText}>{cfg.cta}</AppText>
      </TouchableOpacity>
    </Animated.View>
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
