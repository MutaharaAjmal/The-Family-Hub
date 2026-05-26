import React from "react";
import { Text, TextStyle, StyleSheet, TextProps } from "react-native";
// import { COLORS } from "../constants/theme"; // Aapka #1E3A8A wala color

interface Props extends TextProps {
  // 👈 TextProps inherit karne se numberOfLines khud mil jayega
  children: React.ReactNode;
  style?: any;
  type?: "header" | "label" | "value" | "body" | "tab";
  color?: string;
}

export const AppText = ({
  children,
  style,
  type = "body",
  color,
  ...rest
}: Props) => {
  return (
    <Text style={[styles[type], color ? { color } : null, style]} {...rest}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  header: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  label: { fontSize: 14, color: "#8E8E93", fontWeight: "500" },
  value: { fontSize: 16, color: "#1E3A8A", fontWeight: "bold" },
  body: { fontSize: 16, color: "#1A1A1A" },
  tab: { fontSize: 13, fontWeight: "600", letterSpacing: 0.5 },
});
