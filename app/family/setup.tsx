import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../src/api/supabase";
import { BackHandler, Alert } from "react-native";
import { useAppStore } from "../../src/store/useAppStore";

const { width } = Dimensions.get("window");

export default function FamilySetupScreen() {
  const router = useRouter();
  const { userProfile, clearStore, loading, setAuth } = useAppStore();

  useEffect(() => {
    const checkUser = async () => {
      if (!userProfile) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          // Yahan store ko bharna zaroori hai!
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profile) {
            setAuth(profile.family_id || null, profile); // Ye line store bharegi aur loader khatam karegi
          }
        } else {
          router.replace("/(auth)/loginSignup");
        }
      }
    };
    checkUser();
  }, [userProfile]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert("Exit Setup?", "Do you want to exit setup and go back?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go Back",
            style: "destructive",
            onPress: async () => {
              await supabase.auth.signOut();
              clearStore(); // ✅ Logout ke waqt store saaf karna zaroori hai
              router.replace("/(auth)/loginSignup");
            },
          },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [clearStore, router]),
  );

  if (loading || !userProfile) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section - Logo and Titles */}
      <View style={styles.header}>
        {/* Same Logo Circle as Login Screen */}
        <View style={styles.logoOuterCircle}>
          <View style={styles.logoInnerCircle}>
            <Image
              // source={require("../../assets/logo-bg-rmv.png")}
              source={require("../../assets/family-logo.png")}
              style={styles.logoImage}
            />
          </View>
        </View>

        <Text style={styles.title}>Family Setup</Text>
        <Text style={styles.subtitle}>
          Let's get you started. Would you like to create a new family or join
          an existing one?
        </Text>
      </View>

      {/* Options Section */}
      <View style={styles.optionsContainer}>
        {/* CREATE FAMILY BUTTON */}
        <TouchableOpacity
          style={styles.premiumCard}
          onPress={() => router.push("/family/create")}
          activeOpacity={0.7}
        >
          <View style={[styles.cardIconCircle, { backgroundColor: "#E0E7FF" }]}>
            <Ionicons name="add-circle" size={30} color="#1E3A8A" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Create a Family</Text>
            <Text style={styles.cardDesc}>
              Set up a unique Family ID and become the administrator.
            </Text>
          </View>
          {/* <Ionicons name="chevron-forward" size={20} color="#CBD5E1" /> */}
        </TouchableOpacity>

        {/* JOIN FAMILY BUTTON */}
        <TouchableOpacity
          style={[styles.premiumCard, styles.joinCard]}
          onPress={() => router.push("/family/join")}
          activeOpacity={0.7}
        >
          <View style={[styles.cardIconCircle, { backgroundColor: "#ECFDF5" }]}>
            <Ionicons name="enter" size={30} color="#10B981" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Join a Family</Text>
            <Text style={styles.cardDesc}>
              Already have a family code? Enter it here to link your account.
            </Text>
          </View>
          {/* <Ionicons name="chevron-forward" size={20} color="#CBD5E1" /> */}
        </TouchableOpacity>
      </View>

      {/* Footer Info */}
      <Text style={styles.footerNote}>
        You can always change your family settings later.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Match Login Background
    paddingHorizontal: 25,
    paddingVertical: 80,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  // Exact same style as AuthScreen
  logoCircle: {
    width: 95,
    height: 95,
    borderRadius: 40,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4, // Added slight shadow for premium feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  logoOuterCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#1E3A8A", // Deep blue
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF", // White border effect
    padding: 2,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },

  title: {
    fontSize: 28, // Adjusted to match AuthScreen title size
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 15,
  },
  optionsContainer: {
    gap: 16,
  },
  premiumCard: {
    backgroundColor: "#FFF",
    padding: 22,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  joinCard: {
    borderColor: "#ECFDF5",
  },
  cardIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  cardDesc: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 18,
  },
  footerNote: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 40,
    fontWeight: "500",
  },
});
