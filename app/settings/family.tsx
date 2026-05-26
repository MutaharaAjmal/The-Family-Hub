import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  ScrollView,
  ToastAndroid,
  Platform,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useAppStore } from "../../src/store/useAppStore"; // ✅ Store import
import { Analytics } from "../../src/utils/Analytics";

export default function FamilySettings() {
  const router = useRouter();

  // ✅ Store se values
  const {
    familyId,
    familyDetails,
    familyMembers,
    loading,
    fetchFamilyDetails,
    updateFamilyNameInStore,
  } = useAppStore();

  const [updating, setUpdating] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    if (familyDetails?.name) setTempName(familyDetails.name);
  }, [familyDetails]);

  useFocusEffect(
    useCallback(() => {
      fetchFamilyDetails();
    }, [fetchFamilyDetails]),
  );

  const handleUpdate = async () => {
    if (!tempName.trim()) return Alert.alert("Error", "Name required");
    setUpdating(true);
    try {
      await updateFamilyNameInStore(tempName);
      Analytics.Family.editFamily({
        new_name: tempName.trim(),
      });
      if (Platform.OS === "android") {
        ToastAndroid.show("Updated! ✨", ToastAndroid.SHORT);
      } else {
        Alert.alert("Success", "Updated!");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Fix: renderMember function ab store ka data use karega
  const renderMember = (item: any) => (
    <View key={item.id} style={styles.memberCard}>
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.placeholderAvatar}>
          <Text style={styles.avatarText}>
            {item.username?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
      )}

      <View style={styles.memberInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.memberName}>{item.username || "Member"}</Text>
          {/* ✅ Admin Check: created_by use karein */}
          {item.id === familyDetails?.created_by && (
            <View style={styles.adminBadge}>
              <Ionicons
                name="shield-checkmark"
                size={12}
                color="#2E7D32"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberEmail}>{item.email}</Text>
      </View>
    </View>
  );

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(familyId || "");
    Platform.OS === "android"
      ? ToastAndroid.show("ID Copied!", ToastAndroid.SHORT)
      : Alert.alert("Copied!");
  };

  const shareFamilyId = async () => {
    try {
      Analytics.Family.inviteClicked({
        family_id: familyId || "N/A",
      });
      await Share.share({
        message: `Hey! Join our family group on Family Hub 🏠\n\nFamily ID: ${familyId}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Settings</Text>
        <TouchableOpacity onPress={handleUpdate} disabled={updating}>
          {updating ? (
            <ActivityIndicator size="small" color="#1E3A8A" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading && !familyDetails ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.familyCard}>
            <Text style={styles.label}>FAMILY NAME</Text>
            <TextInput
              style={styles.nameInput}
              value={tempName}
              onChangeText={setTempName}
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
            <View style={styles.divider} />
            <Text style={styles.label}>UNIQUE ID</Text>
            <View style={styles.idRow}>
              <Text style={styles.idValue}>#{familyId}</Text>
              <TouchableOpacity onPress={copyToClipboard}>
                <Ionicons name="copy-outline" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inviteContainer}>
            <View style={styles.inviteContent}>
              <Text style={styles.inviteTitle}>Grow your family! 👨‍👩‍👧‍👦</Text>
              <Text style={styles.inviteSub}>
                Share the unique ID with your members.
              </Text>
            </View>
            <TouchableOpacity style={styles.inviteBtn} onPress={shareFamilyId}>
              <Ionicons name="share-social-outline" size={20} color="#FFF" />
              <Text style={styles.inviteBtnText}>Invite</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>
              Members ({familyMembers.length})
            </Text>
            {/* ✅ Loop ko ab uncomment kar diya hai */}
            {familyMembers.map((item) => renderMember(item))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFCFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1A1A1A" },
  backBtn: { padding: 5 },
  saveBtnText: { color: "#1E3A8A", fontWeight: "700", fontSize: 16 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  familyCard: {
    backgroundColor: "#1E3A8A",
    margin: 20,
    padding: 25,
    borderRadius: 24,
    elevation: 8,
  },
  label: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  nameInput: { color: "#FFF", fontSize: 24, fontWeight: "bold", marginTop: 5 },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 15,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  idValue: { color: "#FFF", fontSize: 16, opacity: 0.9 },
  membersSection: { paddingHorizontal: 20, paddingBottom: 40 },
  inviteContainer: {
    backgroundColor: "#E0E7FF", // Light blue background
    marginHorizontal: 20,
    marginBottom: 25,
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  inviteContent: { flex: 1, marginRight: 10 },
  inviteTitle: { fontSize: 16, fontWeight: "bold", color: "#1E3A8A" },
  inviteSub: { fontSize: 12, color: "#475569", marginTop: 4, lineHeight: 18 },
  inviteBtn: {
    backgroundColor: "#1E3A8A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
  },
  inviteBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: "#333",
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  placeholderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#1E3A8A", fontWeight: "bold", fontSize: 18 },
  memberInfo: { flex: 1, marginLeft: 15 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  memberName: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
  memberEmail: { fontSize: 13, color: "#888", marginTop: 2 },
  adminBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  adminText: {
    color: "#2E7D32",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
