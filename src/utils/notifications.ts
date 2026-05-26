import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications"; // Ye import zaroori hai
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "../api/supabase";

// 1. Notification Handler setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    // shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldSetBadge: true,
  }),
});

// 2. Permission Function
export async function requestNotificationPermissions() {
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Notification permissions denied!");
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
    return true;
  }
  return false;
}

export async function scheduleLocalBillReminders(
  billDateStr: string,
  selectedTime: Date,
) {
  const timeString = selectedTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true, //
  });
  try {
    const [year, month, day] = billDateStr.split("-").map(Number);

    // 1. Same Day Trigger (Local Time)
    const sameDayDate = new Date(
      year,
      month - 1,
      day,
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
    );

    const dayBeforeDate = new Date(sameDayDate);
    dayBeforeDate.setDate(dayBeforeDate.getDate() - 1);

    // --- A. Instant Confirmation ---
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Bill Scanned Successfully! ✅",
        body: `Reminders set for ${billDateStr} at ${timeString}`,
        sound: "default",
      },
      trigger: null,
    });

    // --- B. Schedule: Same Day ---
    const now = new Date();

    if (sameDayDate > now) {
      // Agar future ka waqt hai toh schedule karo
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Bill Due today! 📄",
          body: "Today is last date to pay your bill.Check your bill details.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          // 2. Actual date object
          date: sameDayDate,
        },
      });
    } else {
      // Agar 3:43 set tha aur ab 3:44 ho gaye hain, toh FORAN bhej do
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Bill Reminder (Right Now)! 📄",
          body: "The scheduled time has just passed. Please pay your bill soon!",
          sound: "default",
        },
        trigger: null,
      });
    }

    // --- C. Schedule: 1 Day Before ---
    if (dayBeforeDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Bill Due Tomorrow! ⏳",
          body: "Reminder! Tomorrow is the last date to pay your bill.Don't forget",
          sound: "default",
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: dayBeforeDate,
        } as any,
      });
    }

    return true;
  } catch (error) {
    console.error("Scheduling Error:", error);
    return false;
  }
}
export async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    // Aapke Expo project ki ID leta hai
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data;
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

export const updatePushToken = async (userId: string, email: string) => {
  try {
    if (!userId) return false;

    // 1. Pehle Expo Push Token lein (requestPermissions sirf true/false deta hai)
    const token = await registerForPushNotificationsAsync();

    if (!token) {
      return false;
    }
    let profileFound = false;
    for (let i = 0; i < 3; i++) {
      // 3 baar try karega
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        profileFound = true;
        break;
      }
      console.log(`Retry ${i + 1}: Profile not found yet...`);
      await new Promise((res) => setTimeout(res, 1500)); // 1.5 second wait
    }

    if (!profileFound) {
      return false;
    }

    // 3. Ab Upsert karein
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      expo_push_token: token, // Yahan ab sahi string token jayega
      email: email,
    });

    if (error) {
      console.error("❌ Supabase Upsert Error:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Push Token Error:", err);
    return false;
  }
};

// Notification history mein save karne ke liye helper
// export const saveNotificationToHistory = async (
//   title: string,
//   body: string,
//   userId: string,
//   familyId: string,
// ) => {
//   try {
//     const { error } = await supabase.from("notifications_history").insert([
//       {
//         title: title,
//         body: body,
//         user_id: userId,
//         family_id: familyId,
//         status: "unread",
//         created_at: new Date().toISOString(),
//       },
//     ]);
//     if (error) console.error("History Save Error:", error.message);
//   } catch (err) {
//     console.error("Database Error:", err);
//   }
// };

// Modified saveNotificationToHistory - send to ALL family members
// src/utils/notifications.ts - Updated without sender_id

export const saveNotificationToHistory = async (
  title: string,
  body: string,
  senderId: string,
  familyId: string,
) => {
  try {
    // Get ALL family members (including sender)
    const { data: familyMembers, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("family_id", familyId);

    if (fetchError) throw fetchError;
    if (!familyMembers || familyMembers.length === 0) return;

    const notifications = familyMembers.map((member) => ({
      title: title,
      body: body,
      user_id: member.id,
      family_id: familyId,
      // 🔥 Remove sender_id if column doesn't exist
      // sender_id: senderId,
      status: "unread",
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("notifications_history")
      .insert(notifications);

    if (insertError) {
      console.error("History Save Error:", insertError.message);
    } else {
      console.log(
        `✅ Saved ${notifications.length} notifications for all members`,
      );
    }
  } catch (err) {
    console.error("Database Error:", err);
  }
};
