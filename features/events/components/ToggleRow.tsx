import React from "react";
import { View, Switch, StyleSheet } from "react-native";
import { AppText } from "../../../src/components/AppText";

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (newValue: boolean) => void;
}

export const ToggleRow = ({ label, value, onValueChange }: ToggleRowProps) => {
  return (
    <View style={styles.selectorRow}>
      <AppText type="label">{label}</AppText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#D1D1D6", true: "#1E3A8A" }}
        thumbColor="#FFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  selectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5, // Thori si spacing ke liye
  },
});
