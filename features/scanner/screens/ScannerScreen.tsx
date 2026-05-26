import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { extractDateFromBill } from "../../../features/scanner/services/scannerServices";
import {
  requestNotificationPermissions,
  scheduleLocalBillReminders,
} from "../../../src/utils/notifications";
import { pickFromGallery, takePhoto } from "../services/imagePicker";

export default function ScannerScreen() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const router = useRouter();

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const onTimeChange = (event: any, date?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (date) setSelectedTime(date);
  };

  const handleImageAction = async (type: "camera" | "gallery") => {
    try {
      const base64 =
        type === "camera" ? await takePhoto() : await pickFromGallery();
      if (!base64) return;

      setLoading(true);
      setStatus("AI is reading your bill...");

      const aiResponse = await extractDateFromBill(base64);

      if (aiResponse === "NO_DATE_FOUND" || aiResponse === "EMPTY_RESPONSE") {
        Alert.alert(
          "Date Not Found ❌",
          "Could not find a due date. Please use a clearer image.",
        );
        return;
      }

      const dateMatch = aiResponse.match(/(\d{4}-\d{2}-\d{2})/);

      if (dateMatch) {
        const billDate = dateMatch[0];
        await scheduleLocalBillReminders(billDate, selectedTime);
        const formattedTime = selectedTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        Alert.alert(
          "Reminder Set! ✅",
          `Scheduled for ${billDate} at ${formattedTime}.`,
          [{ text: "OK" }],
        );
      } else {
        Alert.alert("Error", "Invalid date format received from AI.");
      }
    } catch (error: any) {
      console.log("UI Caught:", error.message);

      if (error.message === "QUOTA_EXCEEDED") {
        Alert.alert(
          "Daily Limit Reached 🛑",
          "The free scanning limit for today has been reached. Please try again tomorrow.",
        );
      } else if (error.message === "SERVER_BUSY") {
        Alert.alert(
          "Server Busy 🤖",
          "AI is currently busy. Please try again in 10 seconds.",
        );
      } else {
        Alert.alert(
          "Service Error ⚠️",
          error.message || "An unexpected error occurred.",
        );
      }
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.fullScreenLoader}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loaderText}>Setting up Scanner...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons name="scan-circle-outline" size={100} color="#007AFF" />
      <Text style={styles.title}>Bill AI Scanner</Text>
      <Text style={styles.desc}>Select time, then scan the bill.</Text>

      <View style={styles.timeCard}>
        <Text style={styles.timeLabel}>Notification Time:</Text>
        <TouchableOpacity
          style={styles.timeDisplay}
          onPress={() => setShowPicker(true)}
        >
          <Ionicons name="time-outline" size={24} color="#007AFF" />
          <Text style={styles.timeText}>
            {selectedTime
              .toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
              .toLowerCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onTimeChange}
        />
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => handleImageAction("camera")}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.btnText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.secondaryBtn]}
            onPress={() => handleImageAction("gallery")}
          >
            <Ionicons name="images" size={24} color="white" />
            <Text style={styles.btnText}>Pick from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: { fontSize: 26, fontWeight: "bold", marginTop: 10 },
  desc: { textAlign: "center", color: "#666", marginBottom: 25 },
  timeCard: {
    backgroundColor: "#F2F2F7",
    width: "100%",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  timeLabel: { fontSize: 14, color: "#8E8E93", marginBottom: 8 },
  timeDisplay: { flexDirection: "row", alignItems: "center", gap: 10 },
  timeText: { fontSize: 24, fontWeight: "700", color: "#007AFF" },
  loadingBox: { alignItems: "center", marginVertical: 20 },
  statusText: { marginTop: 10, color: "#007AFF" },
  buttonContainer: { width: "100%", gap: 15 },
  btn: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  secondaryBtn: { backgroundColor: "#5856D6" },
  btnText: { color: "white", fontSize: 18, fontWeight: "600" },
  fullScreenLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loaderText: { marginTop: 15, fontSize: 16, color: "#007AFF" },
});
