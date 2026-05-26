import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { useRouter } from "expo-router";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  leftIconName?: keyof typeof Ionicons.glyphMap | string; // ✅ Naya prop
  onLeftIconPress?: () => void; // ✅ Naya prop
  rightIconName?: keyof typeof Ionicons.glyphMap | string;
  onRightIconPress?: () => void;
  tabs?: string[];
  activeTab?: string;
  onTabPress?: (tab: string) => void;
  backgroundColor?: string;
}

export const AppHeader = ({
  title,
  showBack = true,
  leftIconName, // ✅ Destructure kiya
  onLeftIconPress, // ✅ Destructure kiya
  rightIconName,
  onRightIconPress,
  tabs,
  activeTab,
  onTabPress,
  backgroundColor,
}: AppHeaderProps) => {
  const router = useRouter();

  // Back handling logic
  const handleLeftPress = () => {
    if (onLeftIconPress) {
      onLeftIconPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: backgroundColor || "#1E3A8A" },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Top Row: Left Icon, Title, Right Icon */}
      <View style={styles.topRow}>
        <View style={styles.sideContainer}>
          {/* ✅ Check karein ke leftIconName hai ya sirf showBack true hai */}
          {(showBack || leftIconName) && (
            <TouchableOpacity
              onPress={handleLeftPress}
              style={styles.iconButton}
            >
              <Ionicons
                name={(leftIconName as any) || "chevron-back"}
                size={28}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
        </View>

        <AppText type="header" style={styles.titleText}>
          {title}
        </AppText>

        <View style={styles.sideContainer}>
          {rightIconName ? (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.iconButton}
            >
              <Ionicons name={rightIconName as any} size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Tabs Row */}
      {tabs && (
        <View style={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => onTabPress && onTabPress(tab)}
            >
              <AppText
                type="tab"
                style={{ color: activeTab === tab ? "#FFFFFF" : "#A0B1D1" }}
              >
                {tab.toUpperCase()}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    // paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    backgroundColor: "#1E3A8A",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    // height: 80,
    paddingVertical: 10,
    height: Platform.OS === "ios" ? 60 : 80,
    marginTop: Platform.OS === "ios" ? 0 : 0, // Thoda gap dein
    marginBottom: Platform.OS === "ios" ? 10 : 0, // Thoda gap dein
  },
  sideContainer: { width: 45, alignItems: "center", justifyContent: "center" }, // Thoda width barhaya
  iconButton: {
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 0,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#FFFFFF",
  },
});
