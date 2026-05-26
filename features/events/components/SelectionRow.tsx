import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
// import { AppText } from "./AppText"; // Ya simple Text use karein
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../../../src/components/AppText";

interface SelectionRowProps {
  label: string;
  value: string;
  onPress: () => void;
  hideIcon?: boolean; // 🚀 Naya optional prop
}

export const SelectionRow = ({
  label,
  value,
  onPress,
  hideIcon,
}: SelectionRowProps) => (
  <TouchableOpacity style={styles.selector} onPress={onPress}>
    <View style={styles.leftContent}>
      <AppText style={styles.labelText}>{label}</AppText>
      <AppText style={styles.valueText}>{value}</AppText>
    </View>

    {/* Agar hideIcon true nahi hai, tabhi chevron dikhayen */}
    {!hideIcon && <Ionicons name="chevron-forward" size={18} color="#94A3B8" />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  selector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    // Note: Background aur border humne hataya hai taake
    // ye "Event Section Card" ke andar fit lage (Google Style)
  },
  leftContent: {
    flex: 1,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B", // Muted label
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valueText: {
    fontSize: 16,
    color: "#1E293B", // Dark text for value
    fontWeight: "500",
  },
});
