import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../src/api/supabase";
import { HomeEmptyState } from "../components/HomeEmptyState";
import { CompactCard } from "../components/CompactCard";
import { SectionHeader } from "../components/SectionHeader";
import { HomeTaskItem } from "../components/HomeTaskItem";
import { useAppStore } from "../../../src/store/useAppStore";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [groceryCount, setGroceryCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const isFocused = useIsFocused();

  const {
    userProfile,
    familyId,
    fetchUserProfile,
    fetchRecipes,
    familyMembers,
    fetchMealPlans,
    fetchFamilyDetails,
    mealData,
    loading: storeLoading,
  } = useAppStore();

  const todayStr = new Date().toISOString().split("T")[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 17) return "Good Afternoon,";
    return "Good Evening, ";
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const formatTimeAMPM = (timeStr: string) => {
    if (!timeStr || timeStr === "All Day") return "All Day";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const fetchManualData = async () => {
    const currentUserId = userProfile?.id;
    if (!currentUserId || !familyId) return;
    const [tData, eventsData, cats, notifData] = await Promise.all([
      // supabase
      //   .from("tasks")
      //   .select("*")
      //   .eq("family_id", familyId)
      //   .or(
      //     `created_by.eq.${currentUserId},assigned_to.eq.${currentUserId},visibility.eq.shared,visibility.eq.view`,
      //   )
      //   .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("*")

        .eq("family_id", familyId)
        .or(
          `created_by.eq.${currentUserId},` + // Case 1: Maine banaya ho (sab dikhenge)
            `and(assigned_to.eq.${currentUserId},visibility.neq.private),` + // Case 2: Mujhe assign ho LEKIN private na ho
            `and(visibility.in.(shared,view))`, // Case 3: Sab ke liye shared ya view ho
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("events")
        .select("*")
        .eq("family_id", familyId)
        .gte("event_date", todayStr)
        .or(
          `visibility.eq.All,created_by.eq.${currentUserId},attendees.cs.{"${currentUserId}"}`,
        )
        // .or(
        //           `visibility.eq.All,created_by.eq.${currentUserId},attendees.cs.${currentUserId}`,
        //         )
        // .order("start_time", { ascending: true });
        .order("event_date", { ascending: true })
        .limit(5),
      supabase
        .from("shopping_categories")
        .select("id")
        .eq("tab_type", "Shopping"),
      supabase
        .from("notifications_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userProfile?.id)
        .eq("status", "unread"),
    ]);

    setTasks(tData.data || []);
    setUpcomingEvents(eventsData.data || []);
    setUnreadCount(notifData.count || 0);

    if (cats.data?.length) {
      const { count } = await supabase
        .from("shopping_items")
        .select("*", { count: "exact", head: true })
        .in(
          "category_id",
          cats.data.map((c) => c.id),
        )
        .eq("family_id", familyId)
        .or(
          `created_by.eq.${currentUserId},visibility.eq.shared,visibility.eq.view`,
        );

      setGroceryCount(count || 0);
    }
  };
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserProfile(),
      fetchFamilyDetails(),
      fetchMealPlans(),
      fetchRecipes(),
      fetchManualData(), // Ye add karein
    ]);
    setRefreshing(false);
  }, [familyId]);

  useEffect(() => {
    let isMounted = true; // Local variable for safety

    if (isFocused) {
      const loadData = async () => {
        if (!userProfile) await fetchUserProfile();
        if (familyId && isMounted) {
          await Promise.all([
            fetchFamilyDetails(),
            fetchMealPlans(),
            fetchRecipes(),
            fetchManualData(),
          ]);
          setIsInitialLoad(false);
        }
      };
      loadData();
    }
    return () => {
      isMounted = false;
    };
  }, [isFocused, familyId]);

  const renderEventItem = (event: any) => (
    <CompactCard
      key={event.id}
      title={event.title}
      subtitle={`📅 ${formatDisplayDate(event.event_date)}`}
      color={event.event_date === todayStr ? "#FF9500" : "#1E3A8A"}
      timeTag={formatTimeAMPM(event.start_time)}
      // onPress={() => router.push("/calendar")}
    />
  );
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1E3A8A"
        />
      }
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Premium Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <TouchableOpacity
              onPress={() => router.push("/settings/profile")}
              style={styles.avatarWrapper}
            >
              {/* Avatar Image ya Placeholder */}
              {userProfile?.avatar_url ? (
                <Image
                  source={{ uri: userProfile.avatar_url }}
                  style={styles.avatarCircle}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color="#1E3A8A" />
                </View>
              )}

              {/* Naya Camera Icon Overlay */}
              <View style={styles.cameraIconBadge}>
                <Ionicons name="camera" size={12} color="#FFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.welcomeTextGroup}>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.userNameText} numberOfLines={1}>
                {userProfile?.username || "User"} {/* ✅ Store se naam */}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notifCircle}
            onPress={() => router.push("/settings/notifications")}
          >
            <Ionicons name="notifications" size={28} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentWrapper}>
        {/* Snapshot Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Snapshot</Text>
          <View style={styles.statsRow}>
            {[
              {
                label: "Tasks",
                count: tasks.length,
                color: "#1E3A8A",
                icon: "list",
                tab: "To Do",
              },
              {
                label: "Events",
                count: upcomingEvents.length,
                color: "#FF9500",
                icon: "calendar",
                path: "/calendar",
              },
              {
                label: "Shopping",
                count: groceryCount,
                color: "#34C759",
                icon: "cart",
                tab: "Shopping",
              },
            ].map((stat, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.statCard, { borderLeftColor: stat.color }]}
                onPress={() =>
                  stat.path
                    ? router.push(stat.path as any)
                    : router.push({
                        pathname: "/lists",
                        params: { initialTab: stat.tab },
                      })
                }
              >
                <View style={styles.statInfo}>
                  <Text style={[styles.statCount, { color: stat.color }]}>
                    {stat.count}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                <Ionicons
                  name={stat.icon as any}
                  size={18}
                  color={stat.color}
                  opacity={0.5}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Tasks Section */}
        <View style={styles.section}>
          <SectionHeader
            title="Recent Tasks"
            onPress={() =>
              router.push({
                pathname: "/lists",
                params: { initialTab: "To Do" },
              })
            }
            rightText="View All"
          />
          {isInitialLoad ? (
            <ActivityIndicator color="#1E3A8A" />
          ) : tasks.length > 0 ? (
            tasks
              .slice(0, 3)
              .map((item) => (
                <HomeTaskItem
                  key={item.id}
                  title={item.title}
                  familyMembers={familyMembers}
                  creatorName={item.created_by}
                  isCompleted={item.is_completed}
                  dateText={formatTimeAMPM(item.created_at)}
                  dateTime={formatDisplayDate(item.created_at)}
                />
              ))
          ) : (
            <HomeEmptyState
              icon="checkbox-outline"
              title="No tasks yet"
              subtitle="Stay organized by adding your first task."
              onPress={() =>
                router.push({
                  pathname: "/lists",
                  params: { initialTab: "To Do" },
                })
              }
            />
          )}
        </View>
        {/* Upcoming Events Section */}
        <View style={styles.section}>
          <SectionHeader
            title="Upcoming Events"
            onPress={() => router.push("/calendar")}
            rightText="View All"
          />

          {isInitialLoad ? (
            <ActivityIndicator color="#FF9500" />
          ) : upcomingEvents.length > 0 ? (
            upcomingEvents.slice(0, 2).map((event) => renderEventItem(event))
          ) : (
            <HomeEmptyState
              icon="calendar-outline"
              title="No upcoming events"
              subtitle="Tap to add important family events."
              color="#FF9500"
              onPress={() => router.push("/calendar")}
            />
          )}
        </View>
        <View style={[styles.section, { marginBottom: 30 }]}>
          <SectionHeader
            title="Today's Meal Plan"
            onPress={() => router.push("/meals/planner")}
            rightText="Plan Week"
          />

          {isInitialLoad ? (
            <ActivityIndicator color="#34C759" />
          ) : mealData[todayStr] && mealData[todayStr].length > 0 ? (
            <View>
              {/* 1. Main Highlight Card (Sabse pehli meal dikhayega) */}
              <CompactCard
                title={mealData[todayStr][0].recipes?.title || "Planned Meal"}
                subtitle={`🍳 Next up: ${mealData[todayStr][0].meal_type}`}
                color="#1E3A8A"
                // onPress={() => router.push("/meals/planner")}
              />

              {/* 2. Status Chips Row (Yeh wala code yahan aaye ga) */}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                {["Breakfast", "Lunch", "Dinner"].map((type) => {
                  // Check karein ke is type ki meal plan mein mojud hai ya nahi
                  const isPlanned = mealData[todayStr].some(
                    (m: any) => m.meal_type === type,
                  );

                  return (
                    <View
                      key={type}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: isPlanned ? "#E8F5E9" : "#F1F5F9", // Light green if planned
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isPlanned ? "#34C75930" : "#E2E8F0",
                      }}
                    >
                      <Ionicons
                        name={
                          isPlanned ? "checkmark-circle" : "ellipse-outline"
                        }
                        size={14}
                        color={isPlanned ? "#34C759" : "#94A3B8"}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          marginLeft: 4,
                          fontWeight: "600",
                          color: isPlanned ? "#166534" : "#64748B",
                        }}
                      >
                        {type}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            // Agar koi bhi meal planned nahi hai
            <HomeEmptyState
              icon="restaurant-outline"
              title="No meal planned"
              subtitle="Tap to decide what's for dinner."
              color="#34C759"
              onPress={() => router.push("/meals/planner")}
            />
          )}
        </View>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/ai_chat")}
          activeOpacity={0.8}
        >
          {/* <Ionicons name="sparkles-outline" size={30} color="white" /> */}
          <Ionicons name="chatbubble-ellipses" size={30} color="white" />
          {/* Chota sa "AI" badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>AI</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerContainer: {
    backgroundColor: "#1E3A8A",
    paddingTop: 75,
    paddingHorizontal: 10,
    paddingBottom: 40,
    elevation: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileSection: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarWrapper: {
    width: 60, // Thoda barha diya hai taake badge sahi bethy
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative", // Zaroori hai badge ki position fix karny k liye
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#1E3A8A", // Theme color
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFF", // Border taake icon image se alag nazar aye
    elevation: 3, // Android shadow
  },
  avatarCircle: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeTextGroup: { marginLeft: 10 },
  greetingText: { fontSize: 22, color: "#ffffff", fontWeight: "700" },
  userNameText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#e4dddd",
    marginTop: 2,
  },
  notifCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#EF4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1E3A8A",
  },
  unreadText: { color: "white", fontSize: 9, fontWeight: "bold" },
  contentWrapper: { marginTop: 15, paddingHorizontal: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1E293B" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statCard: {
    backgroundColor: "#FFF",
    width: (width - 60) / 3,
    padding: 14,
    borderRadius: 18,
    borderLeftWidth: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  statInfo: { flex: 1 },
  statCount: { fontSize: 18, fontWeight: "800" },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },

  fab: {
    position: "absolute",
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    right: 20,
    bottom: 20, // Agar Bottom Tabs hain toh isay 80-90 kar dein
    backgroundColor: "#1E3A8A", // Aapka blue color
    borderRadius: 32.5,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 999, // Taake ye har cheez ke upar rahe
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#10B981", // Emerald green badge
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: "white",
  },
  badgeText: {
    color: "white",
    fontSize: 8,
    fontWeight: "bold",
  },
});
