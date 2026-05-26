import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../../../src/components/AppText";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface PickerModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode; // Is mein list items ayenge
  selectedId?: string | number;
}

export const PickerModal = ({
  visible,
  title,
  onClose,
  children,
}: PickerModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <AppText style={styles.title}>{title}</AppText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: SCREEN_WIDTH - 48,
    maxHeight: SCREEN_HEIGHT * 0.6,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  title: { fontSize: 18, fontWeight: "600" },
  list: { padding: 8 },
});
