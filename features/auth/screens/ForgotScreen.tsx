import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../../../src/api/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../../src/components/AppHeader";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ForgotPasswordScreen.tsx
  async function handleResetRequest() {
    if (!email) return Alert.alert("Error", "Please enter your email address.");

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: "family-todo://reset-password", // ✅ This should match exactly
      });
      console.log(error);

      if (error) throw error;

      Alert.alert(
        "Check Email 📧",
        "A reset link has been sent to your email.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "top"]}>
      <AppHeader title="Forgot Password?" />
      <View style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.subtitle}>
            Enter your email to receive a password reset link.
          </Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="example@mail.com"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.mainBtn}
            onPress={handleResetRequest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.mainBtnText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1E3A8A" },

  container: { flex: 1, backgroundColor: "#FFFFFF" },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 30,
    lineHeight: 22,
  },
  inputGroup: { marginBottom: 20 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: "#1E293B" },
  mainBtn: {
    backgroundColor: "#1E3A8A",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mainBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
});
