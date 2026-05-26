// ResetPasswordScreen.tsx - WORKING VERSION
import React, { useEffect, useState } from "react";
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
import * as Linking from "expo-linking";

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const router = useRouter();

  // CRITICAL: Handle the deep link and set session
  useEffect(() => {
    const setupRecoverySession = async () => {
      try {
        // Get the URL that opened the app
        const url = await Linking.getInitialURL();
        console.log("📱 Initial URL:", url);

        if (url && url.includes("reset-password")) {
          // Extract the hash fragment
          const hashFragment = url.split("#")[1];
          console.log("🔑 Hash fragment:", hashFragment);

          if (hashFragment) {
            const params = new URLSearchParams(hashFragment);
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");

            console.log("🎫 Access token exists:", !!accessToken);
            console.log("🎫 Refresh token exists:", !!refreshToken);

            if (accessToken && refreshToken) {
              // Set the session
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (error) {
                console.error("❌ Session error:", error.message);
                Alert.alert(
                  "Error",
                  "Invalid reset link. Please request a new one.",
                );
                router.replace("/(auth)/forgot-password");
              } else {
                console.log("✅ Session set successfully!");
                setHasValidSession(true);
              }
            }
          }
        } else {
          // Check if already have a recovery session
          const {
            data: { session },
          } = await supabase.auth.getSession();
          console.log("📋 Current session:", session?.user?.email);

          if (session) {
            setHasValidSession(true);
          } else {
            // No session, user might have opened app directly
            console.log("⚠️ No recovery session found");
          }
        }
      } catch (error) {
        console.error("💥 Error:", error);
      }
    };

    setupRecoverySession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth event:", event);

      if (event === "PASSWORD_RECOVERY") {
        console.log("✅ Password recovery session active!");
        setHasValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleUpdatePassword() {
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        Alert.alert(
          "Session Expired",
          "Please request a new password reset link.",
          [
            {
              text: "Request New Link",
              onPress: () => router.replace("/(auth)/forgot-password"),
            },
          ],
        );
        return;
      }

      console.log("🔄 Updating password for:", session.user.email);

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Sign out
      await supabase.auth.signOut();

      Alert.alert(
        "Success! 🎉",
        "Your password has been updated. Please login with your new password.",
        [
          {
            text: "Login Now",
            onPress: () => router.replace("/(auth)/loginSignup"),
          },
        ],
      );
    } catch (error: any) {
      console.error("❌ Update error:", error.message);

      if (error.message.includes("session")) {
        Alert.alert(
          "Session Error",
          "Please request a new password reset link.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(auth)/forgot-password"),
            },
          ],
        );
      } else {
        Alert.alert("Update Failed", error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "top"]}>
      <AppHeader title="Reset Password" />
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.inner}>
            <Text style={styles.subtitle}>
              Create a strong password for your account.
            </Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  style={styles.input}
                  secureTextEntry={!isVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setIsVisible(!isVisible)}>
                  <Ionicons
                    name={isVisible ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  secureTextEntry={!isVisible}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.mainBtn}
              onPress={handleUpdatePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.mainBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1E3A8A" },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 30,
    lineHeight: 22,
  },
  inputGroup: { marginBottom: 18 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: "#1E293B" },
  mainBtn: {
    backgroundColor: "#1E3A8A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    elevation: 4,
  },
  mainBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
});
