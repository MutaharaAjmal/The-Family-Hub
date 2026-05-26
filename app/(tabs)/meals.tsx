import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "../../src/components/AppHeader";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function MealsScreen() {
  const router = useRouter();

  const MenuOption = ({ title, subtitle, icon, color, onPress }: any) => (
    <TouchableOpacity
      style={styles.premiumCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>

      <View style={styles.arrowCircle}>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );

  return (
    // <View style={styles.container}>
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1E3A8A" }}
      edges={["left", "right", "top"]}
    >
      <AppHeader title="Meal Management" />

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>PLAN & COOK</Text>

        <MenuOption
          title="Recipe Box"
          subtitle="Explore and save your favorite dishes"
          icon="restaurant-outline"
          color="#1E3A8A" // Primary Blue
          onPress={() => router.push("/meals/recipes")}
        />

        <MenuOption
          title="Weekly Planner"
          subtitle="Schedule your meals for the week"
          icon="calendar-outline"
          color="#FF9500" // Accent Orange
          onPress={() => router.push("/meals/planner")}
        />
        <View style={styles.infoBox}>
          <Ionicons name="bulb-outline" size={20} color="#64748B" />
          <Text style={styles.infoText}>
            Tip: Planning your meals ahead reduces food waste and saves money!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, backgroundColor: "#F8FAFC", flex: 1 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 15,
    marginLeft: 5,
  },
  premiumCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    // Premium Shadow
    elevation: 4,
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
  },
  optionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: "#1E40AF",
    lineHeight: 18,
  },
});
