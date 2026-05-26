import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../src/api/supabase";
import { Buffer } from "buffer";
import { useAppStore } from "../../src/store/useAppStore";
import { Analytics } from "../../src/utils/Analytics";

const { width } = Dimensions.get("window");

// Predefined Premium Colors for selection
const PROFILE_COLORS = [
  "#1E3A8A",
  "#FF9500",
  "#34C759",
  "#FF2D55",
  "#5856D6",
  "#AF52DE",
  "#007AFF",
  "#2C3E50",
];

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, updateUserProfile } = useAppStore();

  const [updating, setUpdating] = useState(false);
  const [username, setUsername] = useState(userProfile?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || "");
  const [selectedColor, setSelectedColor] = useState(
    userProfile?.color || "#1E3A8A",
  );

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username);
      setAvatarUrl(userProfile.avatar_url);
      setSelectedColor(userProfile.color || "#1E3A8A");
    }
  }, [userProfile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Gallery access is required.");

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0].base64) {
      uploadImage(result.assets[0].base64);
    }
  };

  const uploadImage = async (base64: string) => {
    setUpdating(true);
    try {
      const userId = userProfile?.id;
      const filePath = `avatars/${userId}_${Date.now()}.png`;
      const arrayBuffer = Buffer.from(base64, "base64");

      await supabase.storage.from("avatars").upload(filePath, arrayBuffer, {
        contentType: "image/png",
        upsert: true,
      });

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
    } catch (error: any) {
      Alert.alert("Upload Error", error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdate = async () => {
    if (!username.trim()) return Alert.alert("Error", "Username is required!");

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          avatar_url: avatarUrl,
          color: selectedColor, // ✅ Color update
        })
        .eq("id", userProfile?.id);

      if (error) throw error;

      updateUserProfile({
        username: username.trim(),
        avatar_url: avatarUrl,
        color: selectedColor,
      });
      const hasUsernameChanged = username.trim() !== userProfile?.username;
      const hasAvatarChanged = avatarUrl !== userProfile?.avatar_url;
      const hasColorChanged = selectedColor !== userProfile?.color;

      // Sirf tab track karein agar kuch waqai badla ho
      if (hasUsernameChanged || hasAvatarChanged || hasColorChanged) {
        Analytics.Profile.updated({
          changed_username: hasUsernameChanged,
          changed_avatar: hasAvatarChanged,
          changed_color: hasColorChanged,
        });
      }
      Alert.alert("Success ✨", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Update Error", error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* --- Premium Image Header --- */}
        <View style={[styles.headerBg]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Ionicons name="person" size={50} color="#CCC" />
              </View>
            )}
            <View style={[styles.editBadge]}>
              <Ionicons name="camera" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.displayName}>{username || "Ayesha Khan"}</Text>
          <Text style={styles.displayEmail}>{userProfile?.email}</Text>
        </View>

        <View style={styles.form}>
          {/* --- Color Selection Section --- */}
          <Text style={styles.inputLabel}>Profile Accent Color</Text>
          <View style={styles.colorRow}>
            {PROFILE_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  selectedColor === color && styles.activeColor,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>

          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={20}
              color={selectedColor}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
            />
          </View>
          <Text style={styles.inputLabel}>Family ID (Locked)</Text>
          <View style={[styles.inputWrapper, styles.disabledInput]}>
            <Ionicons
              name="people-outline"
              size={20}
              color="#AAA"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: "#AAA" }]}
              value={userProfile?.family_id || "N/A"}
              editable={false}
            />
          </View>
          <TouchableOpacity
            style={[styles.updateBtn, updating && { opacity: 0.7 }]}
            onPress={handleUpdate}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.updateBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  headerBg: {
    height: 180,
    width: "100%",
    paddingTop: 62,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#1E3A8A",
    borderBottomLeftRadius: width * 0.5,
    borderBottomRightRadius: width * 0.5,
    transform: [{ scaleX: 1.5 }], // Header curve effect
  },
  backBtn: {
    position: "absolute",
    // left: 40,
    left: "18%",
    zIndex: 10,
    top: 54,
    padding: 10,
    transform: [{ scaleX: 0.67 }],
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    transform: [{ scaleX: 0.67 }],
  },
  avatarWrapper: {
    alignItems: "center",
    marginTop: -60, // Avatar upar move kiya curve par
    marginBottom: 20,
  },
  imageContainer: {
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFF",
    backgroundColor: "#F8FAFC",
  },
  placeholderAvatar: { justifyContent: "center", alignItems: "center" },
  editBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#1E3A8A",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  displayName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 15,
  },
  displayEmail: { fontSize: 14, color: "#64748B", marginTop: 4 },
  form: { paddingHorizontal: 25, marginTop: 20 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 25,
  },
  colorCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeColor: {
    borderColor: "#FFF",
    borderWidth: 3,
    elevation: 5,
    // scale: 1.2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 55,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#333" },
  updateBtn: {
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E3A8A",
    marginTop: 10,
    marginBottom: 40,
    elevation: 5,
  },
  updateBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  disabledInput: { backgroundColor: "#F5F5F5", borderColor: "#F2F2F2" },
});
