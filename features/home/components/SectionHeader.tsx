import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface SectionHeaderProps {
  title: string;
  onPress: () => void;
  rightText?: string;
}

export const SectionHeader = ({
  title,
  onPress,
  rightText = "View All",
}: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.viewAll}>{rightText}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1E293B" },
  viewAll: { color: "#1E3A8A", fontWeight: "700", fontSize: 13 },
});
