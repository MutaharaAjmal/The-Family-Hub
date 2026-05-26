import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../../../src/components/AppText";
import { AppButton } from "../../../src/components/AppButton";
import { AppHeader } from "../../../src/components/AppHeader";
import { eventService } from "../api/eventService";
import { useAppStore } from "../../../src/store/useAppStore";
import { supabase } from "../../../src/api/supabase";
import { saveNotificationToHistory } from "../../../src/utils/notifications";
import { scheduleEventReminders } from "../api/eventNotifications";
import Toast from "react-native-toast-message";
import { Analytics } from "../../../src/utils/Analytics";

const EVENT_COLORS = [
  "#1E3A8A",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
  "#64748B",
];

export default function AddEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;

  // --- States ---
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedColor, setSelectedColor] = useState(EVENT_COLORS[0]);
  const VISIBILITY_OPTIONS = ["All", "Only Me", "Participants Only"];
  const [visibility, setVisibility] = useState(VISIBILITY_OPTIONS[0]);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const selectedDateParam = params.selectedDate as string;
  const { familyId, userProfile } = useAppStore();

  // Load Family Members
  useEffect(() => {
    async function fetchFamilyMembers() {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, color, expo_push_token")
        .eq("family_id", familyId);

      if (data) {
        const otherMembers = data.filter((m) => m.id !== userProfile?.id);
        setFamilyMembers(otherMembers);

        if (!eventId) {
          setAttendees([]);
        }
      }
    }
    if (familyId) fetchFamilyMembers();
  }, [familyId, userProfile?.id]);

  // Load Edit Data
  useEffect(() => {
    if (eventId) loadEventData();
  }, [eventId]);

  useEffect(() => {
    setTempDate(eventDate);
    setTempTime(eventTime);
  }, [eventDate, eventTime]);

  // Handle selected date from calendar
  useEffect(() => {
    if (selectedDateParam && !eventId) {
      const [year, month, day] = selectedDateParam.split("-").map(Number);
      const d = new Date();
      d.setFullYear(year, month - 1, day);
      setEventDate(d);
      setTempDate(d);
      Analytics.Event.dateSelected({ date: selectedDateParam });
    }
  }, [selectedDateParam, eventId]);

  async function loadEventData() {
    setLoading(true);
    try {
      const data = await eventService.getEventById(eventId);
      setTitle(data.title);
      setEventDate(new Date(data.event_date));
      setTempDate(new Date(data.event_date));
      setVisibility(data.visibility || "Everyone");
      setAttendees(data.attendees || []);
      setSelectedColor(data.color || EVENT_COLORS[0]);
      setIsAllDay(data.is_all_day || false);
      if (data.start_time) {
        const [h, m] = data.start_time.split(":");
        const t = new Date();
        t.setHours(parseInt(h), parseInt(m));
        setEventTime(t);
        setTempTime(t);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleAttendee = (id: string) => {
    setAttendees((prev) => {
      const isRemoving = prev.includes(id);
      const newAttendees = isRemoving
        ? prev.filter((a) => a !== id)
        : [...prev, id];

      const otherThanMe = newAttendees.filter((uid) => uid !== userProfile?.id);
      if (otherThanMe.length > 0 && visibility === "Only Me") {
        setVisibility("Participants Only");
      }
      return newAttendees;
    });
  };

  // const handleSave = async () => {
  //   if (!title.trim()) return Alert.alert("Error", "Please add a title");
  //   if (!familyId || !userProfile?.id)
  //     return Alert.alert("Error", "Session expired.");

  //   setLoading(true);
  //   try {
  //     const isEditing = !!eventId;
  //     const finalAttendees = Array.from(
  //       new Set([...attendees, userProfile.id]),
  //     );

  //     if (isEditing) {
  //       await eventService.updateEvent(
  //         eventId,
  //         title,
  //         eventDate,
  //         eventTime,
  //         visibility,
  //         finalAttendees,
  //         selectedColor,
  //         isAllDay,
  //       );
  //       Analytics.Event.updated({ title, event_id: eventId });
  //     } else {
  //       await eventService.createEvent(
  //         title,
  //         eventDate,
  //         eventTime,
  //         familyId,
  //         userProfile.id,
  //         visibility,
  //         finalAttendees,
  //         selectedColor,
  //         isAllDay,
  //       );
  //       Analytics.Event.created({
  //         title,
  //         visibility,
  //         is_all_day: isAllDay,
  //         attendees_count: finalAttendees.length,
  //       });
  //     }

  //     // Activity Log
  //     await supabase.from("activity_logs").insert({
  //       family_id: familyId,
  //       user_name: userProfile.username,
  //       action_type: isEditing ? "updated" : "added",
  //       item_name: title,
  //       tab_type: "Events",
  //     });

  //     const timeStr = isAllDay
  //       ? "All-day"
  //       : eventTime.toLocaleTimeString([], {
  //           hour: "2-digit",
  //           minute: "2-digit",
  //           hour12: true,
  //         });

  //     const globalNotifMsg = isAllDay
  //       ? `All-day event "${title}" on ${eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
  //       : `New event "${title}" scheduled for ${eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} at ${timeStr}`;

  //     await saveNotificationToHistory(
  //       isEditing ? "Event Updated 📝" : "New Event 📅",
  //       globalNotifMsg,
  //       userProfile.id,
  //       familyId,
  //     );

  //     // --- CRITICAL FIX: Cross-Device Push Notification Integration ---
  //     const otherParticipants = attendees.filter((id) => id !== userProfile.id);
  //     if (otherParticipants.length > 0) {
  //       // const participantMsg = `${userProfile.username} ${isEditing ? "updated" : "added"} event "${title}" for ${eventDate.toLocaleDateString()} at ${timeStr}`;
  //       const participantMsg = isAllDay
  //         ? `${userProfile.username} ${isEditing ? "updated" : "added"} an all-day event "${title}" for ${eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
  //         : `${userProfile.username} ${isEditing ? "updated" : "added"} event "${title}" for ${eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} at ${timeStr}`;
  //       await saveNotificationToHistory(
  //         isEditing ? "Event Updated 📝" : "New Event Invitation 📅",
  //         participantMsg,
  //         userProfile.id,
  //         familyId,
  //       );

  //       // Target users ke direct Push Tokens filter karein database array se
  //       const targetTokens = familyMembers
  //         .filter((m) => otherParticipants.includes(m.id) && m.expo_push_token)
  //         .map((m) => m.expo_push_token);

  //       if (targetTokens.length > 0) {
  //         try {
  //           await supabase.functions.invoke("send-push-notification", {
  //             body: {
  //               tokens: targetTokens, // Edge function ab direct Array of Tokens receive karega
  //               userIds: otherParticipants, // Fallback safe keeping
  //               title: isEditing
  //                 ? "Event Updated 📝"
  //                 : "New Event Invitation 📅",
  //               body: participantMsg,
  //             },
  //           });
  //         } catch (pushErr) {
  //           console.error("Cross-device push request error:", pushErr);
  //         }
  //       }
  //     }

  //     // Schedule Local Device Alarm
  //     await triggerLocalNotification(title, eventDate, eventTime, isAllDay);

  //     Toast.show({
  //       type: "success",
  //       text1: `Event ${isEditing ? "updated" : "added"} successfully!`,
  //       text2: `Event "${title}" ${isEditing ? "updated" : "added"} by ${userProfile.username}`,
  //     });
  //     router.back();
  //   } catch (error: any) {
  //     Alert.alert("Error", error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert("Error", "Please add a title");
    if (!familyId || !userProfile?.id)
      return Alert.alert("Error", "Session expired.");

    setLoading(true);
    try {
      const isEditing = !!eventId;
      const finalAttendees = Array.from(
        new Set([...attendees, userProfile.id]),
      );

      if (isEditing) {
        await eventService.updateEvent(
          eventId,
          title,
          eventDate,
          eventTime,
          visibility,
          finalAttendees,
          selectedColor,
          isAllDay,
        );
        Analytics.Event.updated({ title, event_id: eventId });
      } else {
        await eventService.createEvent(
          title,
          eventDate,
          eventTime,
          familyId,
          userProfile.id,
          visibility,
          finalAttendees,
          selectedColor,
          isAllDay,
        );
        Analytics.Event.created({
          title,
          visibility,
          is_all_day: isAllDay,
          attendees_count: finalAttendees.length,
        });
      }

      // Activity Log
      await supabase.from("activity_logs").insert({
        family_id: familyId,
        user_name: userProfile.username,
        action_type: isEditing ? "updated" : "added",
        item_name: title,
        tab_type: "Events",
      });

      const timeStr = isAllDay
        ? "All-day"
        : eventTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

      const eventDateStr = eventDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // 🔥 FIX 1: Send to ALL family members except sender for global notification
      // const allOtherMembers = familyMembers.filter((m) => m.id !== userProfile?.id);
      const allOtherMembers = familyMembers;

      if (allOtherMembers.length > 0) {
        const globalMsg = isAllDay
          ? `${userProfile.username} ${isEditing ? "updated" : "added"} an all-day event "${title}" for ${eventDateStr}`
          : `${userProfile.username} ${isEditing ? "updated" : "added"} event "${title}" for ${eventDateStr} at ${timeStr}`;

        // Save to notification history for all members
        await saveNotificationToHistory(
          isEditing ? "Event Updated 📝" : "New Event 📅",
          globalMsg,
          userProfile.id,
          familyId,
        );

        // 🔥 FIX 2: Send push notifications using direct Expo API (no Edge Function)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("expo_push_token")
          .in(
            "id",
            allOtherMembers.map((m) => m.id),
          )
          .not("expo_push_token", "is", null);

        const tokens = profiles?.map((p) => p.expo_push_token).filter(Boolean);

        if (tokens && tokens.length > 0) {
          try {
            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(
                tokens.map((token) => ({
                  to: token,
                  sound: "default",
                  title: isEditing ? "Event Updated 📝" : "New Event 📅",
                  body: globalMsg,
                  priority: "high",
                  data: { screen: "Calendar", eventId: eventId },
                })),
              ),
            });
            console.log(`✅ Push sent to ${tokens.length} devices`);
          } catch (pushErr) {
            console.error("Push error:", pushErr);
          }
        }
      }

      // Schedule Local Device Alarm
      await triggerLocalNotification(title, eventDate, eventTime, isAllDay);

      Toast.show({
        type: "success",
        text1: `Event ${isEditing ? "updated" : "added"} successfully!`,
        text2: `Event "${title}" ${isEditing ? "updated" : "added"} by ${userProfile.username}`,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerLocalNotification = async (
    title: string,
    date: Date,
    time: Date,
    allDay: boolean,
  ) => {
    const trigger = new Date(date);
    const now = new Date();

    if (allDay) {
      // FIX: Agar aaj ki date ka all-day hai aur subah 9 baj chuke hain, toh safe testing ke liye ise immediate (10 seconds baad) run karein
      trigger.setHours(9, 0, 0, 0);
      if (trigger.getTime() <= now.getTime()) {
        trigger.setTime(now.getTime() + 10000); // 10 seconds buffer safety
      }
    } else {
      trigger.setHours(time.getHours(), time.getMinutes(), 0, 0);
      // Continuous correction check
      if (trigger.getTime() <= now.getTime()) {
        trigger.setTime(now.getTime() + 5000); // Instant execution push boundary
      }
    }

    await scheduleEventReminders(title, trigger);
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <AppHeader title={eventId ? "Edit Event" : "New Event"} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <View
              style={[styles.eventColorDot, { backgroundColor: selectedColor }]}
            />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor="#94A3B8"
              style={{
                flex: 1,
                backgroundColor: "transparent",
                borderWidth: 0,
                height: 60,
                fontSize: 18,
              }}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.rowItem}>
            <Ionicons name="time-outline" size={22} color="#64748B" />
            <AppText style={styles.rowLabel}>All Day</AppText>
            <Switch
              value={isAllDay}
              onValueChange={setIsAllDay}
              trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
              thumbColor={isAllDay ? "#1E3A8A" : "#F4F4F5"}
            />
          </View>

          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => {
              setTempDate(eventDate);
              setShowDatePicker(true);
            }}
          >
            <Ionicons name="calendar-outline" size={22} color="#64748B" />
            <AppText style={styles.labelTitle}>Date</AppText>
            <AppText style={styles.blueValue}>
              {eventDate.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </AppText>
          </TouchableOpacity>

          {!isAllDay && (
            <TouchableOpacity
              style={styles.rowItem}
              onPress={() => {
                setTempTime(eventTime);
                setShowTimePicker(true);
              }}
            >
              <Ionicons name="time-outline" size={22} color="#64748B" />
              <AppText style={styles.labelTitle}>Time</AppText>
              <AppText style={styles.blueValue}>
                {eventTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </AppText>
            </TouchableOpacity>
          )}
        </View>

        {/* With Who Section */}
        <View style={styles.sectionCard}>
          <View style={styles.rowHeader}>
            <Ionicons name="people-outline" size={22} color="#64748B" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.rowBetween}>
                <AppText style={styles.labelTitle}>With who?</AppText>
                <AppText style={styles.blueValue}>
                  {attendees.length === familyMembers.length
                    ? "Everyone"
                    : `${attendees.length} selected`}
                </AppText>
              </View>
              <View style={styles.avatarRow}>
                {familyMembers.map((member) => {
                  const isSelected = attendees.includes(member.id);
                  return (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => toggleAttendee(member.id)}
                      style={[
                        styles.avatarCircle,
                        { backgroundColor: member.color || "#92b1d7" },
                        !isSelected && { opacity: 0.4 },
                      ]}
                    >
                      <AppText style={styles.avatarText}>
                        {member.username
                          ? member.username[0].toUpperCase()
                          : "?"}
                      </AppText>
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={8} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Visibility & Color */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => setShowVisibilityModal(true)}
          >
            <Ionicons name="eye-outline" size={22} color="#64748B" />
            <AppText style={styles.labelTitle}>Visible to</AppText>
            <View style={styles.visibilityValueContainer}>
              <AppText style={styles.blueValue}>{visibility}</AppText>
              <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => setShowColorModal(true)}
          >
            <Ionicons name="bookmark" size={22} color={selectedColor} />
            <AppText style={styles.labelTitle}>Event color</AppText>
            <View
              style={[styles.colorPreview, { backgroundColor: selectedColor }]}
            />
          </TouchableOpacity>
        </View>

        <AppButton
          title={eventId ? "Update" : "Save"}
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
        />
      </ScrollView>

      {/* Color Modal */}
      <Modal visible={showColorModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowColorModal(false)}
        >
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Select Event Color</AppText>
            <View style={styles.colorGrid}>
              {EVENT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorCircleLarge, { backgroundColor: c }]}
                  onPress={() => {
                    setSelectedColor(c);
                    setShowColorModal(false);
                  }}
                />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Visibility Modal */}
      <Modal visible={showVisibilityModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowVisibilityModal(false)}
        >
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Who can see this?</AppText>
            {VISIBILITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.optionItem}
                onPress={() => {
                  setVisibility(opt);
                  setShowVisibilityModal(false);
                }}
              >
                <AppText
                  style={[
                    styles.optionText,
                    visibility === opt && {
                      color: "#1E3A8A",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {opt}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* iOS Pickers */}
      {showDatePicker && Platform.OS === "ios" && (
        <Modal visible transparent animationType="fade">
          <View style={styles.iosModalOverlay}>
            <View style={styles.iosModalContent}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                onChange={(e, d) => d && setTempDate(d)}
                minimumDate={new Date()}
              />
              <View style={styles.iosModalFooter}>
                <TouchableOpacity
                  style={styles.iosCancelBtn}
                  onPress={() => setShowDatePicker(false)}
                >
                  <AppText>Cancel</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iosOkBtn}
                  onPress={() => {
                    setEventDate(tempDate);
                    setShowDatePicker(false);
                  }}
                >
                  <AppText style={{ color: "white" }}>OK</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showTimePicker && Platform.OS === "ios" && (
        <Modal visible transparent animationType="fade">
          <View style={styles.iosModalOverlay}>
            <View style={styles.iosModalContent}>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={(e, d) => d && setTempTime(d)}
              />
              <View style={styles.iosModalFooter}>
                <TouchableOpacity
                  style={styles.iosCancelBtn}
                  onPress={() => setShowTimePicker(false)}
                >
                  <AppText>Cancel</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iosOkBtn}
                  onPress={() => {
                    setEventTime(tempTime);
                    setShowTimePicker(false);
                  }}
                >
                  <AppText style={{ color: "white" }}>OK</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android Pickers */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={eventDate}
          mode="date"
          display="default"
          onChange={(e, d) => {
            setShowDatePicker(false);
            if (d) {
              setEventDate(d);
              setTempDate(d);
            }
          }}
          minimumDate={new Date()}
        />
      )}
      {showTimePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={eventTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={(e, d) => {
            setShowTimePicker(false);
            if (d) {
              setEventTime(d);
              setTempTime(d);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iosModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  iosModalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
  },
  iosModalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    gap: 10,
  },
  iosCancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  iosOkBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
  },
  container: { flex: 1, backgroundColor: "#1E3A8A" },
  content: { paddingHorizontal: 16, backgroundColor: "#F8FAFC" },
  headerSection: { marginTop: 10, marginBottom: 10, paddingHorizontal: 4 },
  saveButton: { marginTop: 20, marginBottom: 40, backgroundColor: "#1E3A8A" },
  visibilityValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  eventColorDot: { width: 12, height: 12, borderRadius: 6 },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  rowLabel: { flex: 1, fontSize: 16, color: "#1E293B" },
  rowHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelTitle: { fontSize: 16, color: "#1E293B", flex: 1, marginLeft: 12 },
  blueValue: { color: "#3B82F6", fontWeight: "600" },
  avatarRow: { flexDirection: "row", marginTop: 12, gap: 10 },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  colorPreview: { width: 20, height: 20, borderRadius: 4 },
  avatarText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  checkBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    backgroundColor: "#10B981",
    borderRadius: 10,
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFF",
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 35 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    justifyContent: "center",
    marginBottom: 20,
  },
  colorCircleLarge: { width: 45, height: 45, borderRadius: 22.5 },
  optionItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  optionText: { fontSize: 16, textAlign: "center", color: "#1E293B" },
});
