import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/api/supabase";
import { useAppStore } from "../../src/store/useAppStore";
import { Analytics } from "../../src/utils/Analytics";

export default function JoinFamilyScreen() {
  const [joinCode, setJoinCode] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const isButtonDisabled = joinCode.trim().length === 0 || loading;
  const router = useRouter();
  const { userProfile, setAuth, updateUserProfile, fetchUserProfile } =
    useAppStore();

  useEffect(() => {
    if (userProfile?.username) {
      setUserName(userProfile.username);
    } else if (userProfile?.email) {
      const suggested = userProfile.email.split("@")[0].replace(/[._]/g, " ");
      const capitalized = suggested.replace(/\b\w/g, (l) => l.toUpperCase());
      setUserName(capitalized);
    }
  }, [userProfile?.username, userProfile?.email]); // Specific dependencies

  const handleJoin = async () => {
    if (!joinCode || !userName) return;
    setLoading(true);
    try {
      const userId = userProfile?.id;
      if (!userId) throw new Error("User session not found");
      // 1. Pehle Profile mein username update karein
      const { error: nameError } = await supabase
        .from("profiles")
        .update({ username: userName.trim() })
        .eq("id", userId);

      if (nameError) throw nameError;
      // 2. Verify if this family exists
      const { data: familyExists, error: fetchError } = await supabase
        .from("families")
        .select("id")
        .eq("id", joinCode.trim())
        .single();

      if (!familyExists) {
        Alert.alert(
          "Not Found",
          "No family found with this ID. Please check the code.",
        );
        setLoading(false);
        return;
      }
      // 3. Link user to this family
      const { error: linkError } = await supabase
        .from("profiles")
        .update({ family_id: joinCode.trim() })
        .eq("id", userId);

      if (linkError) throw linkError;
      // 2. Link user to this family
      Analytics.Family.joined({
        family_id: joinCode.trim(),
      });
      setAuth(joinCode.trim(), userProfile);
      updateUserProfile({ family_id: joinCode.trim() });
      await fetchUserProfile(); // Refresh store with new data

      Alert.alert("Welcome! ✨", `Hi ${userName}, you've joined the family!`, [
        { text: "Continue", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#1E293B" />
      </TouchableOpacity>

      <Text style={[styles.title, { color: "#10B981" }]}>Almost There! 👋</Text>
      <Text style={styles.subtitle}>
        Confirm your display name and enter the family code.
      </Text>

      {/* --- Section 1: User Profile --- */}
      <View style={styles.inputLabelGroup}>
        <Text style={styles.inputLabel}>Your Display Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#10B981"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="e.g. Ayesha Khan"
            value={userName}
            onChangeText={setUserName}
          />
        </View>
        <Text style={styles.hintText}>
          This is how your family will see you.
        </Text>
      </View>

      {/* --- Section 2: Family Code --- */}
      <View style={styles.inputLabelGroup}>
        <Text style={styles.inputLabel}>Family Invite Code</Text>
        <View style={[styles.inputContainer, { borderColor: "#ECFDF5" }]}>
          <Ionicons
            name="key-outline"
            size={20}
            color="#10B981"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Paste code here"
            placeholderTextColor="#94A3B8"
            value={joinCode}
            onChangeText={setJoinCode}
            autoCapitalize="none"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.mainBtn, isButtonDisabled && styles.disabledBtn]}
        onPress={handleJoin}
        disabled={isButtonDisabled}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.btnText}>Join Family Group</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 25,
    paddingTop: 60,
  },
  backBtn: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { fontSize: 15, color: "#64748B", marginTop: 8, marginBottom: 30 },
  inputLabelGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
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
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontWeight: "600", color: "#1E293B" },
  hintText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 6,
    fontStyle: "italic",
    marginLeft: 4,
  },
  mainBtn: {
    backgroundColor: "#10B981",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledBtn: { backgroundColor: "#A7F3D0", elevation: 0 },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
