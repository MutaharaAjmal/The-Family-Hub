import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { supabase } from "../../../src/api/supabase";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../../src/components/AppHeader";
import { useRouter } from "expo-router";
import { useAppStore } from "../../../src/store/useAppStore";
import { DeleteLoader } from "../../../src/components/DeleteLoader";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

export default function NotificationScreen() {
  const router = useRouter();
  const { userProfile } = useAppStore();

  const [isDeleting, setIsDeleting] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const isSelectionMode = selectedIds.length > 0;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      if (!userProfile?.id) return;

      const { data, error } = await supabase
        .from("notifications_history")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setNotifications(data || []);
      }
    } catch (err) {
      console.error("Fetch Notif Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handlePress = async (item: any) => {
    if (isSelectionMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleSelection(item.id);
    } else {
      if (item.status === "unread") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const updated = notifications.map((n) =>
          n.id === item.id ? { ...n, status: "read" } : n,
        );
        setNotifications(updated);

        const { error } = await supabase
          .from("notifications_history")
          .update({ status: "read" })
          .eq("id", item.id);

        if (error) fetchNotifications();
      }
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const deleteSelected = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Notifications",
      `Are you sure you want to delete ${selectedIds.length} notification${selectedIds.length > 1 ? "s" : ""}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await supabase
                .from("notifications_history")
                .delete()
                .in("id", selectedIds);
              if (!error) {
                setNotifications((prev) =>
                  prev.filter((n) => !selectedIds.includes(n.id)),
                );
                setSelectedIds([]);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              }
            } catch (err) {
              Alert.alert("Error", "Could not delete notifications.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const markAllAsRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const unreadIds = notifications
      .filter((n) => n.status === "unread")
      .map((n) => n.id);

    if (unreadIds.length === 0) {
      Alert.alert("All Read", "No unread notifications");
      return;
    }

    try {
      const { error } = await supabase
        .from("notifications_history")
        .update({ status: "read" })
        .in("id", unreadIds);

      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const groupNotificationsByDate = (data: any[]) => {
    const groups: { [key: string]: any[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    data.forEach((notif) => {
      const notifDate = new Date(notif.created_at);
      let dateLabel = "";

      if (notifDate.toDateString() === today.toDateString()) {
        dateLabel = "Today";
      } else if (notifDate.toDateString() === yesterday.toDateString()) {
        dateLabel = "Yesterday";
      } else if (notifDate > new Date(today.setDate(today.getDate() - 7))) {
        dateLabel = "This Week";
      } else {
        dateLabel = "Earlier";
      }

      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(notif);
    });

    const order = ["Today", "Yesterday", "This Week", "Earlier"];
    return order
      .filter((key) => groups[key])
      .map((key) => ({ title: key, data: groups[key] }));
  };

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("meal") || t.includes("recipe"))
      return { name: "restaurant-outline", color: "#10B981", bg: "#D1FAE5" };
    if (t.includes("task") || t.includes("todo"))
      return { name: "checkbox-outline", color: "#8B5CF6", bg: "#F3E8FF" };
    if (t.includes("chore"))
      return { name: "clipboard-outline", color: "#F59E0B", bg: "#FEF3C7" };
    if (t.includes("shopping"))
      return { name: "cart-outline", color: "#3B82F6", bg: "#EFF6FF" };
    if (t.includes("family"))
      return { name: "people-outline", color: "#EC4899", bg: "#FCE7F3" };
    return { name: "notifications-outline", color: "#64748B", bg: "#F1F5F9" };
  };

  const sections = groupNotificationsByDate(notifications);
  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const NotificationItem = ({
    item,
    isUnread,
    isSelected,
    onPress,
    onLongPress,
    icon,
  }: any) => {
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.spring(slideAnim, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={{
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
          opacity: slideAnim,
        }}
      >
        <TouchableOpacity
          onPress={onPress}
          onLongPress={onLongPress}
          activeOpacity={0.7}
          style={[
            styles.notifRow,
            isUnread && styles.unreadRow,
            isSelected && styles.selectedRow,
          ]}
        >
          {isSelectionMode && (
            <View style={styles.selectionCircle}>
              <View
                style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                )}
              </View>
            </View>
          )}

          <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
            <Ionicons name={icon.name as any} size={22} color={icon.color} />
          </View>

          <View style={styles.contentBox}>
            <View style={styles.textHeader}>
              <Text
                style={[styles.title, isUnread && styles.boldText]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.timeText}>
                {new Date(item.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <Text style={styles.bodyText} numberOfLines={2}>
              {item.body}
            </Text>
          </View>

          {isUnread && !isSelectionMode && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = () => (
    <Animated.View
      style={[
        styles.emptyState,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={styles.emptyIconCircle}>
        <View style={styles.bellRing}>
          <Ionicons
            name="notifications-off-outline"
            size={48}
            color="#1E3A8A"
          />
        </View>
      </View>
      <Text style={styles.emptyTitle}>All Caught Up! 🎉</Text>
      <Text style={styles.emptySubtitle}>
        When you get notifications about meals, tasks, or family activities,
        they'll appear here.
      </Text>
    </Animated.View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "top"]}>
      <AppHeader
        title={
          isSelectionMode ? `${selectedIds.length} Selected` : "Notifications"
        }
        leftIconName={isSelectionMode ? "close" : "chevron-back"}
        onLeftIconPress={
          isSelectionMode ? () => setSelectedIds([]) : () => router.back()
        }
        rightIconName={
          isSelectionMode
            ? "trash"
            : unreadCount > 0
              ? "checkmark-done"
              : undefined
        }
        onRightIconPress={isSelectionMode ? deleteSelected : markAllAsRead}
      />

      {unreadCount > 0 && !isSelectionMode && (
        <TouchableOpacity
          style={styles.unreadBanner}
          onPress={markAllAsRead}
          activeOpacity={0.7}
        >
          <Ionicons name="mail-unread-outline" size={18} color="#1E3A8A" />
          <Text style={styles.unreadBannerText}>
            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#1E3A8A" />
        </TouchableOpacity>
      )}

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchNotifications}
                tintColor="#1E3A8A"
                colors={["#1E3A8A"]}
              />
            }
            renderSectionHeader={({ section: { title } }) => (
              <SectionHeader title={title} />
            )}
            renderItem={({ item }) => {
              const isUnread = item.status === "unread";
              const isSelected = selectedIds.includes(item.id);
              const icon = getIcon(item.title);

              return (
                <NotificationItem
                  item={item}
                  isUnread={isUnread}
                  isSelected={isSelected}
                  onPress={() => handlePress(item)}
                  onLongPress={() => toggleSelection(item.id)}
                  icon={icon}
                />
              );
            }}
            ListEmptyComponent={EmptyState}
          />
        )}
      </View>
      {isDeleting && <DeleteLoader />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1E3A8A" },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  listContent: { paddingBottom: 30 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#64748B", marginTop: 10 },

  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
  },
  unreadBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#1E3A8A",
    fontWeight: "500",
  },

  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
    marginLeft: 12,
  },

  notifRow: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  unreadRow: { backgroundColor: "#F8FAFF" },
  selectedRow: { backgroundColor: "#F1F5F9" },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  contentBox: { flex: 1 },
  textHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  boldText: { fontWeight: "700", color: "#1E3A8A" },
  bodyText: { fontSize: 13, color: "#64748B", lineHeight: 18 },
  timeText: { fontSize: 11, color: "#94A3B8" },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E3A8A",
    marginLeft: 12,
  },

  selectionCircle: { marginRight: 14 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  checkboxSelected: { backgroundColor: "#1E3A8A", borderColor: "#1E3A8A" },

  emptyState: {
    flex: 1,
    marginTop: 120,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  bellRing: {
    position: "relative",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 22,
  },
});
