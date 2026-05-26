import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { AppText } from "./AppText";

interface TopTabsProps {
  tabs: string[];
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export const TopTabs = ({ tabs, activeTab, onTabPress }: TopTabsProps) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabPress(tab)}
            >
              <AppText
                type="tab"
                style={{ color: isActive ? "#1E3A8A" : "#8E8E93" }}
              >
                {tab.toUpperCase()}
              </AppText>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    position: "relative", // Indicator ke liye
  },
  activeTab: {},
  tabText: {
    color: "#8E8E93",
    fontWeight: "600",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: "#1E3A8A",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -5, // Tab text ke nichay gap
    left: 15,
    right: 15,
    height: 3,
    backgroundColor: "#1E3A8A",
    borderRadius: 2,
  },
});
