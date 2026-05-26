import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../../../src/components/AppText";

interface SmartSyncBannerProps {
  onPress: () => void;
  lastSyncText?: string;
}

export const SmartSyncBanner = ({
  onPress,
  lastSyncText,
}: SmartSyncBannerProps) => {
  return (
    <View style={styles.headerWrapper}>
      <TouchableOpacity
        style={styles.smartBanner}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.smartBannerLeft}>
          <View style={styles.sparkleCircle}>
            <Ionicons name="sparkles" size={18} color="#1E3A8A" />
          </View>
          <View>
            <AppText style={styles.bannerTitle}>Sync Meal Plan</AppText>
            <AppText style={styles.bannerSubtitle}>
              {lastSyncText
                ? `Last: ${lastSyncText}`
                : "Auto-add ingredients for the week"}
            </AppText>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#1E3A8A"
          opacity={0.5}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    marginBottom: 15,
  },
  smartBanner: {
    backgroundColor: "#EBF2FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D0E0FF",
    elevation: 2,
  },
  smartBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sparkleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#6295BE",
    marginTop: 1,
  },
});
