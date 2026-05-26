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
  Image,
  ScrollView,
} from "react-native";
import { supabase } from "../../../src/api/supabase";
import * as AppleAuthentication from "expo-apple-authentication"; // Ye install karna hoga
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../../src/store/useAppStore";

import * as WebBrowser from "expo-web-browser";
import * as makeRedirectUri from "expo-auth-session";
import * as Linking from "expo-linking";
import { Analytics } from "../../../src/utils/Analytics";

// Browser session ko complete karne ke liye ye zaroori hai
WebBrowser.maybeCompleteAuthSession();
export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const router = useRouter();
  const { setAuth, clearStore } = useAppStore();
  async function handleAuth() {
    if (!email || !password) {
      return Alert.alert("Required", "Please enter both email and password.");
    }

    setLoading(true);
    const cleanEmail = email.toLowerCase().trim();

    try {
      // 1. Pehle LOGIN ki koshish karein
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

      if (!signInError && signInData?.session) {
        Analytics.Auth.signedIn({
          user_id: signInData.session.user.id,
          email: cleanEmail || "",
        });
        return handlePostLoginRedirect(signInData.session.user.id);
      }
      if (signInError) {
        if (
          signInError.message.includes("Invalid login credentials") &&
          !signInError.message.includes("Email not confirmed")
        ) {
          const { data: signUpData, error: signUpError } =
            await supabase.auth.signUp({
              email: cleanEmail,
              password: password,
            });
          if (
            signUpError &&
            signUpError.message.includes("User already registered")
          ) {
            throw new Error(
              "Invalid email or password. Please check your details.",
            );
          }

          if (signUpError) throw signUpError;
          if (signUpData?.user) {
            if (signUpData.session) {
              return handlePostLoginRedirect(signUpData.user.id);
            } else {
              setLoading(false);
              return Alert.alert(
                "Verification Needed 📧",
                "Check your email for the confirmation link!",
                [{ text: "OK" }],
              );
            }
          }
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      Alert.alert("Authentication Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePostLoginRedirect(userId: string) {
    console.log("Starting Redirect Logic for:", userId);

    try {
      setLoading(true);

      // 1. Check karein ke profile exist karti hai?
      let { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // 2. AGAR PROFILE NAHI HAI (Naya Google User), TOH CREATE KAREIN
      if (!profile) {
        console.log("No profile found. Creating a new one for Google user...");

        // Google session se user metadata nikaalein (optional)
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const suggestedName =
          user?.user_metadata?.full_name ||
          user?.email?.split("@")[0].replace(/[._]/g, " ") ||
          "New User";
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              id: userId,
              email: user?.email || "",
              username: suggestedName,
              // username: user?.user_metadata?.full_name || "New User",
              avatar_url: user?.user_metadata?.avatar_url || "",
            },
          ])
          .select()
          .single();
        Analytics.Auth.signedUp({
          method: user?.app_metadata?.provider || "email",
          email: user?.email,
        });
        if (createError) {
          console.error("Error creating profile:", createError.message);
          // Agar insert fail ho tab bhi hum setup par bhej sakte hain
        } else {
          profile = newProfile;
          console.log("New profile created successfully!");
        }
      }

      // 3. Store Update aur Navigation
      setAuth(profile?.family_id || null, profile || null);

      // Loader band karein
      setLoading(false);

      if (profile?.family_id) {
        router.replace("/(tabs)");
      } else {
        router.replace("/family/setup");
      }
    } catch (err: any) {
      console.error("Redirect Crash:", err.message);
      setLoading(false);
      router.replace("/family/setup");
    }
  }
  async function handleGoogleAuth() {
    try {
      setLoading(true);
      const redirectUri = Linking.createURL("/(auth)/loginSignup");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error("Supabase OAuth Error:", error.message);
        throw error;
      }
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri,
      );

      if (result.type === "success" && result.url) {
        const cleanUrl = result.url.replace("#", "?");
        const { queryParams } = Linking.parse(cleanUrl);
        const params = queryParams as any;

        const accessToken = params.access_token;
        const refreshToken = params.refresh_token;

        // handleGoogleAuth ke andar Log 6 wali jagah ko isse replace karein
        if (accessToken) {
          try {
            // 1. Session set karein (isko await na karein agar ye hang ho raha hai)
            // Ya phir isko background mein chalne dein
            supabase.auth
              .setSession({
                access_token: accessToken,
                refresh_token: refreshToken || "",
              })
              .then(({ error }) => {
                if (error)
                  console.error("Background Session Error:", error.message);
                else console.log("Background Session Sync Done");
              });

            // 2. Token se user ki details nikaalein bina session ka wait kiye
            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser(accessToken);

            if (userError || !user) {
              console.error("User Fetch Error:", userError?.message);
              setLoading(false);
              return;
            }
            // 3. Foran redirect karein

            await handlePostLoginRedirect(user.id);
          } catch (innerError: any) {
            console.error("Critical Force-Fix Error:", innerError.message);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      Alert.alert("Google Login Error", error.message);
      setLoading(false);
    }
  }
  async function handleAppleAuth() {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });

        if (error) throw error;
        if (data.user) {
          await handlePostLoginRedirect(data.user.id);
        }
      }
    } catch (error: any) {
      if (error.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple Login Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            {/* Header Section with Improved Logo Design */}
            <View style={styles.headerSection}>
              <View style={styles.logoOuterCircle}>
                <View style={styles.logoInnerCircle}>
                  <Image
                    source={require("../../../assets/family-logo.png")}
                    style={styles.logoImage}
                  />
                </View>
              </View>
              <Text style={styles.title}>Family Hub</Text>
              <Text style={styles.subtitle}>
                Enter your details to Login or Create an account
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="example@mail.com"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    secureTextEntry={!isPasswordVisible}
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <Ionicons
                      name={
                        isPasswordVisible ? "eye-outline" : "eye-off-outline"
                      }
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
                style={styles.forgotBtn}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mainBtn}
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.mainBtnText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            {/* <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleAuth}
              disabled={loading}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color="#1E293B"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity> */}
            {/* Social Buttons Row */}
            <View style={styles.socialRow}>
              {/* Google Button */}
              <TouchableOpacity
                style={[styles.socialBtn, styles.googleBtnTheme]}
                onPress={handleGoogleAuth}
                disabled={loading}
              >
                {/* Branded Google Blue Icon */}
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text style={[styles.socialBtnText, styles.googleText]}>
                  Google
                </Text>
              </TouchableOpacity>

              {/* Apple Button */}
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={[styles.socialBtn, styles.appleBtnTheme]}
                  onPress={handleAppleAuth}
                  disabled={loading}
                >
                  <Ionicons name="logo-apple" size={20} color="white" />
                  <Text style={[styles.socialBtnText, styles.appleText]}>
                    Apple
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.infoText}>
              If you don't have an account, we'll create one for you
              automatically.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 5,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    height: 54, // Consistent height
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  // Google specific theme
  googleBtnTheme: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  // Apple specific theme
  appleBtnTheme: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  socialBtnText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
  },
  googleText: {
    color: "#1E293B", // Dark grey/blue
  },
  appleText: {
    color: "#FFFFFF", // White
  },
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  inner: { padding: 24 },
  headerSection: { alignItems: "center", marginBottom: 35 },

  // Design update: Double circle effect taake blue color nazar aaye
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
    backgroundColor: "#FFF",
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

  title: { fontSize: 28, fontWeight: "800", color: "#1E293B", marginTop: 15 },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
  form: { width: "100%" },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#475569", marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: "#1E293B" },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 20 },
  forgotText: { color: "#1E3A8A", fontSize: 13, fontWeight: "700" },
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
  mainBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
  infoText: {
    marginTop: 30,
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  googleBtn: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  googleBtnText: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "700",
  },
});
