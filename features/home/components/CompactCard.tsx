import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface CompactCardProps {
  title: string;
  subtitle: string;
  color: string;
  // onPress: () => void;
  timeTag?: string;
}

export const CompactCard = ({
  title,
  subtitle,
  color,
  // onPress,
  timeTag,
}: CompactCardProps) => (
  <View style={styles.compactEventCard}>
    <View style={[styles.miniDecoration, { backgroundColor: color }]} />
    <View style={styles.eventContent}>
      <View style={{ flex: 1 }}>
        <Text style={styles.compactEventTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.eventMiniText}>{subtitle}</Text>
      </View>
      {timeTag && (
        <View style={styles.timeTagContainer}>
          <Text style={styles.timeTagText}>{timeTag}</Text>
        </View>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  compactEventCard: {
    backgroundColor: "#FFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  miniDecoration: { width: 4, height: 30, borderRadius: 2, marginRight: 15 },
  eventContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactEventTitle: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  eventMiniText: { fontSize: 12, color: "#64748B", marginTop: 2 },
  timeTagContainer: { marginTop: 15 },
  timeTagText: { fontSize: 11, color: "#64748B" },
});
