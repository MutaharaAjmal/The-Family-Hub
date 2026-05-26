import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Switch,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../src/api/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../src/components/AppHeader";
import { useAppStore } from "../../src/store/useAppStore";
import { Analytics } from "../../src/utils/Analytics";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface SettingRowProps {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  subLabel?: string;
  isLogout?: boolean;
  onPress?: () => void;
  iconColor?: string;
  iconBgColor?: string;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (val: boolean) => void;
  hideBorder?: boolean;
  isDestructive?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  iconName,
  label,
  subLabel,
  isLogout,
  onPress,
  iconColor = "#1E3A8A",
  iconBgColor = "#EFF6FF",
  showSwitch,
  switchValue,
  onSwitchChange,
  hideBorder,
  isDestructive,
}) => (
  <TouchableOpacity
    style={[styles.row, hideBorder && { borderBottomWidth: 0 }]}
    onPress={() => {
      if (!showSwitch && onPress) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }
    }}
    activeOpacity={0.7}
    disabled={showSwitch}
  >
    <View style={styles.leftRow}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: isDestructive ? "#FEE2E2" : iconBgColor },
        ]}
      >
        <Ionicons
          name={iconName}
          size={22}
          color={isDestructive ? "#EF4444" : iconColor}
        />
      </View>
      <View style={styles.textColumn}>
        <Text
          style={[
            styles.label,
            isDestructive && { color: "#EF4444" },
            isLogout && { color: "#E53935", fontWeight: "600" },
          ]}
        >
          {label}
        </Text>
        {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
      </View>
    </View>
    {showSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={(val) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSwitchChange?.(val);
        }}
        trackColor={{ false: "#E2E8F0", true: "#1E3A8A" }}
        thumbColor="#FFF"
        ios_backgroundColor="#E2E8F0"
      />
    ) : (
      !isLogout &&
      !isDestructive && (
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      )
    )}
  </TouchableOpacity>
);

const SettingSection = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionContainer}>
    <View style={styles.sectionHeader}>
      {icon && <Ionicons name={icon} size={16} color="#64748B" />}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.card}>{children}</View>
  </View>
);

export default function SettingsScreen() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { clearStore, userProfile } = useAppStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Account ⚠️",
      "This action cannot be undone. Are you sure you want to permanently delete your account and all associated data?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setIsDeleting(true);
            try {
              Analytics.Auth.deleteAccount({ email: userProfile?.email });
              const { error } = await supabase
                .from("profiles")
                .delete()
                .eq("id", userProfile?.id);

              if (error) throw error;

              await supabase.auth.signOut();
              clearStore();
              router.replace("/(auth)/loginSignup");
            } catch (error: any) {
              console.log(error);
              Alert.alert("Error", "Couldn't delete account ..");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Logout", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          Analytics.Auth.signedOut();
          await supabase.auth.signOut();
          clearStore();
          router.replace("/(auth)/loginSignup");
        },
      },
    ]);
  };

  const openSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("mailto:support@familyhub.com?subject=Help Needed");
  };

  const userEmail = userProfile?.email || "No Email Provided";

  const userName = userProfile?.username || "Family Member";
  const avatarUrl = userProfile?.avatar_url;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <AppHeader title="Settings" />

      {(isLoggingOut || isDeleting) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.loadingText}>
              {isDeleting ? "Deleting account..." : "Logging out..."}
            </Text>
          </View>
        </View>
      )}

      <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Card */}
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.userAvatarText}>
                  {userEmail.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userEmail}</Text>
              <Text style={styles.userEmail}>{userName}</Text>
            </View>
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => router.push("/settings/profile")}
            >
              <Ionicons name="create-outline" size={18} color="#1E3A8A" />
            </TouchableOpacity>
          </View>

          <SettingSection title="Account" icon="person-outline">
            <SettingRow
              iconName="person-outline"
              label="Profile Details"
              subLabel="Name, Email & Photo"
              iconColor="#3B82F6"
              iconBgColor="#EFF6FF"
              onPress={() => router.push("/settings/profile")}
            />
            <SettingRow
              iconName="lock-closed-outline"
              label="Security"
              subLabel="Change password"
              iconColor="#8B5CF6"
              iconBgColor="#F3E8FF"
              hideBorder
              onPress={() => router.push("/(auth)/forgot-password")}
            />
          </SettingSection>

          <SettingSection title="Preferences" icon="options-outline">
            <SettingRow
              iconName="people-outline"
              label="Family Group"
              subLabel="Manage members"
              iconColor="#10B981"
              iconBgColor="#D1FAE5"
              onPress={() => router.push("/settings/family")}
            />
            <SettingRow
              iconName="notifications-outline"
              label="Notifications"
              subLabel="Manage notifications"
              iconColor="#F59E0B"
              iconBgColor="#FEF3C7"
              onPress={() => router.push("/settings/notifications")}
            />
          </SettingSection>

          <SettingSection title="Support & About" icon="help-circle-outline">
            <SettingRow
              iconName="help-circle-outline"
              label="Help & Support"
              subLabel="FAQs, contact us"
              iconColor="#06B6D4"
              iconBgColor="#CFFAFE"
              onPress={openSupport}
            />
            {/* <SettingRow
              iconName="document-text-outline"
              label="Privacy Policy"
              subLabel="Data handling"
              iconColor="#6366F1"
              iconBgColor="#E0E7FF"
              onPress={() => Linking.openURL("https://familyhub.com/privacy")}
            /> */}
            <SettingRow
              iconName="document-text-outline"
              label="Privacy Policy"
              subLabel="Data handling"
              iconColor="#6366F1"
              iconBgColor="#E0E7FF"
              onPress={() =>
                Linking.openURL(
                  "https://docs.google.com/document/d/1ufbygGB_UfaIxhdbZRHy7kXYvPolyUJxIVC-1cW33hk/edit?usp=sharing",
                )
              }
            />
            <SettingRow
              iconName="information-circle-outline"
              label="About Family Hub"
              subLabel="Version 1.0.0"
              iconColor="#64748B"
              iconBgColor="#F1F5F9"
              hideBorder
              onPress={() =>
                Alert.alert(
                  "Family Hub",
                  "Bringing families together, one task at a time.\n\n© 2026 Family Hub",
                )
              }
            />
          </SettingSection>

          {/* Danger Zone */}
          <View style={styles.dangerZoneContainer}>
            <View style={styles.dangerZoneHeader}>
              <Ionicons name="warning-outline" size={14} color="#EF4444" />
              <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
            </View>
            <View style={[styles.card, styles.dangerCard]}>
              <SettingRow
                iconName="trash-outline"
                label="Delete Account"
                subLabel="Permanently remove your data"
                iconColor="#EF4444"
                iconBgColor="#FEE2E2"
                isDestructive
                hideBorder
                onPress={handleDeleteAccount}
              />
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>Made with ❤️ for Families</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1E3A8A" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  userEmail: { fontSize: 13, color: "#64748B", marginTop: 2 },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  sectionContainer: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  leftRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textColumn: { flex: 1 },
  label: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  subLabel: { fontSize: 12, color: "#94A3B8", marginTop: 2 },

  dangerZoneContainer: { marginBottom: 20, marginTop: 8 },
  dangerZoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    marginLeft: 5,
  },
  dangerZoneTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#EF4444" },

  footerText: {
    textAlign: "center",
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 20,
    fontWeight: "500",
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingText: { fontSize: 14, color: "#1E293B", fontWeight: "500" },
});
