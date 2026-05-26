import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { AppHeader } from "../../../src/components/AppHeader";
import { supabase } from "../../../src/api/supabase";
import { HomeEmptyState } from "../../home/components/HomeEmptyState";
import { useAppStore } from "../../../src/store/useAppStore";
import { Analytics } from "../../../src/utils/Analytics";
import { DeleteLoader } from "../../../src/components/DeleteLoader";

export default function ShowEventsScreen() {
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { events, loading, fetchEvents, familyId, userProfile } = useAppStore();
  const PRIMARY_BLUE = "#1E3A8A";

  const filteredEvents = events.filter((item) => {
    const isCreator = item.user_id === userProfile?.id;
    const isAttendee = item.attendees?.includes(userProfile?.id);
    const isPublic = item.visibility === "All";

    // Sirf tab dikhao jab inme se koi ek condition true ho
    return isPublic || isCreator || isAttendee;
  });

  useFocusEffect(
    useCallback(() => {
      if (familyId) {
        fetchEvents(selectedDate);
      }
    }, [selectedDate, familyId]),
  );
  // 🔥 EVENTS REAL-TIME ENGINE (WITH REAL-TIME DELETE FIX)
  useEffect(() => {
    if (!familyId) return;

    // Pehle initial data fetch karein
    fetchEvents(selectedDate);

    // Supabase Real-time Channel setup for events table
    const eventChannel = supabase
      .channel(`family-events-${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Insert, Update, Delete sab listen karega
          schema: "public",
          table: "events",
          filter: `family_id=eq.${familyId}`, // Sirf apni family ke events
        },
        (payload) => {
          console.log("Real-time event change caught!", payload.eventType);

          if (payload.eventType === "DELETE") {
            // 🚀 Agar delete ho toh direct store se nikal do taake instant ghaib ho jaye
            useAppStore.setState((state) => ({
              events: state.events.filter((ev) => ev.id !== payload.old.id),
            }));
          } else {
            // Insert ya Update par database se fresh load karein
            fetchEvents(selectedDate);
          }
        },
      )
      .subscribe();

    // Cleanup: Screen unmount hone par listener close karein
    return () => {
      supabase.removeChannel(eventChannel);
    };
  }, [familyId, selectedDate]);
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

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "All Day";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hours12 = h % 12 || 12;
    return `${hours12}:${minutes} ${ampm}`;
  };

  const getVisibilityIcon = (status: string) => {
    switch (status) {
      case "Private":
        return "lock-closed-outline";
      case "Family Only":
        return "people-outline";
      default:
        return "earth-outline";
    }
  };

  const logActivity = async (action: string, name: string) => {
    try {
      await supabase.from("activity_logs").insert({
        family_id: familyId,
        user_name: userProfile?.username || "Someone",
        action_type: action,
        item_name: name,
        tab_type: "Events",
      });
    } catch (err) {
      console.error("Log Activity Error:", err);
    }
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;

    Alert.alert("Delete", `Delete ${selectedIds.length} selected events?`, [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);

          try {
            const itemsToDelete = events.filter((ev) =>
              selectedIds.includes(ev.id),
            );
            const { error } = await supabase
              .from("events")
              .delete()
              .in("id", selectedIds);

            if (!error) {
              const actionText =
                selectedIds.length > 1
                  ? `${selectedIds.length} events`
                  : itemsToDelete[0]?.title || "an event";
              Analytics.Event.deleted({ deleted_count: selectedIds.length });
              await logActivity("deleted", actionText);
              fetchEvents(selectedDate);
              setSelectedIds([]);
            }
          } catch (err) {
            Alert.alert("Error", "Could not delete events.");
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const renderEventItem = ({ item }: any) => {
    const isSelected = selectedIds.includes(item.id);
    const isSelectionMode = selectedIds.length > 0;

    const toggleSelection = (id: string) => {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter((i) => i !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    };

    const dayName = new Date(item.event_date).toLocaleDateString("en-US", {
      weekday: "short",
    });

    return (
      <TouchableOpacity
        style={[styles.eventCard, isSelected && styles.selectedCardStyle]}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          } else {
            router.push({
              pathname: "/events/add",
              params: { eventId: item.id, selectedDate },
            });
          }
        }}
        onLongPress={() => toggleSelection(item.id)}
      >
        {isSelectionMode && (
          <Ionicons
            name={isSelected ? "checkbox" : "square-outline"}
            size={22}
            color={PRIMARY_BLUE}
            style={{ marginRight: 10 }}
          />
        )}

        {/* 🎨 Dynamic Color Strip */}
        <View
          style={[
            styles.categoryStrip,
            { backgroundColor: item.color || PRIMARY_BLUE },
          ]}
        />

        <View style={styles.contentWrapper}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle}>{item.title}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.eventSubText}>
                📅 {dayName}, {formatDisplayDate(item.event_date)}
              </Text>

              {/* 🚀 Visibility Badge */}
              <View style={styles.visibilityBadge}>
                <Ionicons
                  name={getVisibilityIcon(item.visibility)}
                  size={12}
                  color="#64748B"
                />
                <Text style={styles.visibilityText}>
                  {item.visibility || "Everyone"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.timeTagContainer}>
            <Text style={styles.timeTagText}>
              {formatTime(item.start_time)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1E3A8A" }}
      edges={["left", "right", "top"]}
    >
      <AppHeader
        title={
          selectedIds.length > 0 ? `${selectedIds.length} Selected` : "Calendar"
        }
        leftIconName={selectedIds.length > 0 ? "close" : "chevron-back"}
        onLeftIconPress={() =>
          selectedIds.length > 0 ? setSelectedIds([]) : router.back()
        }
        rightIconName={selectedIds.length > 0 ? "trash" : undefined}
        onRightIconPress={selectedIds.length > 0 ? handleDelete : undefined}
      />
      <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
        <View style={styles.calendarWrapper}>
          <Calendar
            onDayPress={(day: any) => {
              setSelectedDate(day.dateString);
              setSelectedIds([]);
            }}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: PRIMARY_BLUE },
            }}
            theme={{
              todayTextColor: PRIMARY_BLUE,
              arrowColor: PRIMARY_BLUE,
              selectedDayBackgroundColor: PRIMARY_BLUE,
              textDayFontSize: 13,
              calendarBackground: "#F8FAFC",
            }}
            style={{ borderRadius: 15 }}
          />
        </View>

        <View style={styles.eventSection}>
          <Text style={styles.sectionTitle}>
            Events - {formatFullDate(selectedDate)}
          </Text>

          {loading && events.length === 0 ? (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <ActivityIndicator size="large" color={PRIMARY_BLUE} />
            </View>
          ) : (
            <FlatList
              data={events}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListEmptyComponent={
                !loading ? (
                  <HomeEmptyState
                    icon="calendar-outline"
                    title="No upcoming events"
                    subtitle="Tap to add important family events."
                    color="#FF9500"
                    onPress={() =>
                      router.push({
                        pathname: "/events/add",
                        params: { selectedDate },
                      })
                    }
                  />
                ) : null
              }
            />
          )}
        </View>

        {!selectedIds.length && (
          <TouchableOpacity
            style={styles.floatingActionButton}
            activeOpacity={0.8}
            onPress={() =>
              router.push({ pathname: "/events/add", params: { selectedDate } })
            }
          >
            <Ionicons name="add" size={32} color="#FFF" />
          </TouchableOpacity>
        )}
        {isDeleting && <DeleteLoader />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  calendarWrapper: {
    backgroundColor: "#F8FAFC",
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  eventSection: { flex: 1, paddingHorizontal: 20, marginTop: 15 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventCard: {
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  selectedCardStyle: {
    borderColor: "#1E3A8A",
    backgroundColor: "#F0F7FF",
    borderWidth: 1.5,
  },
  categoryStrip: {
    width: 5,
    height: 35,
    borderRadius: 3,
    marginRight: 15,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  visibilityText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  eventTitle: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
  eventSubText: { fontSize: 12, color: "#64748B" },
  timeTagContainer: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timeTagText: { fontSize: 11, fontWeight: "800", color: "#1E3A8A" },
  floatingActionButton: {
    position: "absolute",
    bottom: 30,
    right: 25,
    backgroundColor: "#1E3A8A",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
});
