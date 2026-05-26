import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from "react-native";

interface Props {
  title: string;
  style?: ViewStyle | ViewStyle[] | any;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const AppButton = ({
  title,
  onPress,
  loading,
  disabled,
  style,
}: Props) => (
  <TouchableOpacity
    style={[styles.button, (disabled || loading) && styles.disabled, style]}
    // style={[styles.button, (disabled || loading) && styles.disabled]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color="#FFF" />
    ) : (
      <Text style={styles.text}>{title}</Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  disabled: { backgroundColor: "#A0B1D1" },
  text: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});
