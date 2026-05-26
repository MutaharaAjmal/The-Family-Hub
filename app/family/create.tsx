import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/api/supabase";
import { useAppStore } from "../../src/store/useAppStore";
import { Analytics } from "../../src/utils/Analytics";

export default function CreateFamilyScreen() {
  const [familyId, setFamilyId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { userProfile, setAuth, updateUserProfile } = useAppStore();

  const handleCreate = async () => {
    if (familyId.length < 4) {
      Alert.alert(
        "Invalid ID",
        "Family ID must be at least 4 characters long.",
      );
      return;
    }

    setLoading(true);
    try {
      const userId = userProfile?.id;
      if (!userId) throw new Error("User not found in session");

      // 1. Check if ID already exists in 'families' table
      const { data: existingFamily } = await supabase
        .from("families")
        .select("id")
        .eq("id", familyId)
        .single();

      if (existingFamily) {
        Alert.alert(
          "Unavailable",
          "This Family ID is already taken. Try another one.",
        );
        setLoading(false);
        return;
      }

      // 2. Insert into 'families' table first
      const { error: famError } = await supabase.from("families").insert([
        {
          id: familyId,
          name: `${familyId}'s Hub`, // Default name: "KhanFamily's Hub"
          created_by: userId,
        },
      ]);

      if (famError) throw famError;

      // 3. Update User's Profile with the new family_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ family_id: familyId })
        .eq("id", userId);

      if (profileError) throw profileError;
      Analytics.Family.created({
        family_id: familyId.trim(),
      });
      setAuth(familyId, userProfile);
      updateUserProfile({ family_id: familyId });
      Alert.alert("Success! 🎉", "Family created successfully.", [
        { text: "Let's Go", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
      console.log("Create Family Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#1E293B" />
      </TouchableOpacity>

      <Text style={styles.title}>Create Family</Text>
      <Text style={styles.subtitle}>
        Choose a unique ID for your family. Your members will use this to join.
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="shield-checkmark-outline"
          size={20}
          color="#1E3A8A"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="e.g. SmithFamily2026"
          value={familyId}
          onChangeText={setFamilyId}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={styles.mainBtn}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.btnText}>Create & Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 25,
    paddingTop: 60,
  },
  backBtn: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: "900", color: "#1E293B" },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 10,
    lineHeight: 22,
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 60,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 25,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontWeight: "600", color: "#1E293B" },
  mainBtn: {
    backgroundColor: "#1E3A8A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
