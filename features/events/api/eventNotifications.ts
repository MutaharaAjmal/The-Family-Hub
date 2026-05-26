import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";

/**
 * Schedules event local alerts safely without standard runtime format parse crashes.
 * @param eventTitle Target string display name
 * @param finalTriggerDate Valid Javascript Date object computed inside safe device layout bounds
 */
export async function scheduleEventReminders(
  eventTitle: string,
  finalTriggerDate: Date,
) {
  try {
    const timeString = finalTriggerDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const dateString = finalTriggerDate.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // --- A. Instant Confirmation ---
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Event Scheduled! 📅",
        body: `"${eventTitle}" has been set for ${dateString} at ${timeString}`,
        sound: "default",
      },
      trigger: null, // Runs instantly on save
    });

    // --- B. Schedule: Event Target Trigger ---
    const now = new Date();

    // Verification checkpoint for future bounds
    if (finalTriggerDate.getTime() > now.getTime()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder: ${eventTitle} 🕒`,
          body: `Your event "${eventTitle}" is starting now!`,
          sound: "default",
          data: { screen: "Calendar" },
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: finalTriggerDate,
        } as any,
      });
      console.log(
        `Successfully scheduled target reminder for: ${finalTriggerDate.toString()}`,
      );
    } else {
      // Past execution security cleanup
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Event Update",
          body: `"${eventTitle}" was scheduled for a timeline that has already passed.`,
          sound: "default",
        },
        trigger: null,
      });
    }

    return true;
  } catch (error) {
    console.error("❌ Event Notification Sync Error:", error);
    return false;
  }
}
