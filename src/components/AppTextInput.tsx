import React from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Yeh interface TS ka error khatam karega
interface AppTextInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  leftIcon?: any; // Icon ka naam
  style?: any; // Custom container style ke liye
  secureTextEntry?: boolean;
}

export const AppTextInput = ({
  value,
  onChangeText,
  placeholder,
  leftIcon,
  secureTextEntry = false,
  style,
  placeholderTextColor,
  ...rest
}: AppTextInputProps) => {
  return (
    <View style={styles.container}>
      {leftIcon && (
        <Ionicons
          name={leftIcon}
          size={20}
          color="#1E3A8A"
          style={styles.icon}
        />
      )}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor || "#C7C7CD"}
        secureTextEntry={secureTextEntry}
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EFEFF4",
    paddingHorizontal: 15,
    marginBottom: 5,
    height: 55,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#1A1A1A", fontWeight: "500" },
});
