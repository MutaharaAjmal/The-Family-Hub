import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HomeEmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color?: string;
  onPress: () => void;
}

export const HomeEmptyState = ({
  icon,
  title,
  subtitle,
  color = "#1E3A8A",
  onPress,
}: HomeEmptyStateProps) => {
  return (
    <TouchableOpacity style={styles.premiumEmptyState} onPress={onPress}>
      <View style={[styles.emptyIconCircle, { backgroundColor: color }]}>
        <Ionicons name={icon} size={26} color="#FFF" />
      </View>
      <Text style={styles.emptyTextMain}>{title}</Text>
      <Text style={styles.emptyTextSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  premiumEmptyState: {
    padding: 25,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTextMain: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  emptyTextSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
});
