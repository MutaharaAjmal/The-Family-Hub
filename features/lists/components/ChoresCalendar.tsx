import { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../../../src/components/AppText";

interface ChoreCalendarProps {
  baseDate: Date;
  setBaseDate: (date: Date) => void;
  selectedFullDate: string;
  setSelectedFullDate: (date: string) => void;
}
export const ChoreCalendar = ({
  baseDate,
  setBaseDate,
  selectedFullDate,
  setSelectedFullDate,
}: ChoreCalendarProps) => {
  const dynamicDates = useMemo(() => {
    const dates = [];
    // 🚀 Check karein ke baseDate valid hai
    if (!baseDate || isNaN(new Date(baseDate).getTime())) {
      return [];
    }

    for (let i = 0; i < 7; i++) {
      const tempDate = new Date(baseDate);
      tempDate.setDate(baseDate.getDate() + i);

      dates.push({
        day: tempDate.toLocaleDateString("en-US", { weekday: "short" }),
        date: tempDate.getDate(),
        fullDate: tempDate.toISOString().split("T")[0],
      });
    }
    return dates;
  }, [baseDate]);
  // 2. Arrow Functions
  const shiftDate = (direction: "next" | "prev") => {
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + (direction === "next" ? 7 : -7));
    setBaseDate(newDate);
  };
  return (
    <View style={styles.calendarContainer}>
      {/* Left Arrow */}
      <TouchableOpacity
        onPress={() => shiftDate("prev")}
        style={styles.arrowBtn}
      >
        <Ionicons name="chevron-back" size={24} color="#1E3A8A" />
      </TouchableOpacity>

      <View style={styles.calendarStrip}>
        {dynamicDates.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedFullDate(item.fullDate)}
            style={[
              styles.dateCircle,
              selectedFullDate === item.fullDate && styles.activeDate,
            ]}
          >
            <AppText
              style={
                [
                  styles.dayText,
                  selectedFullDate === item.fullDate && styles.activeText,
                ] as any
              }
            >
              {item.day}
            </AppText>
            <AppText
              style={
                [
                  styles.dateText,
                  selectedFullDate === item.fullDate && styles.activeText,
                ] as any
              }
            >
              {item.date}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Right Arrow */}
      <TouchableOpacity
        onPress={() => shiftDate("next")}
        style={styles.arrowBtn}
      >
        <Ionicons name="chevron-forward" size={24} color="#1E3A8A" />
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  calendarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#c8dcec",
    paddingVertical: 8,
    paddingHorizontal: 2, // Thori horizontal padding
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  calendarStrip: {
    flexDirection: "row",
    flex: 1, // Yeh center mein rahega
    justifyContent: "space-between", // Dates ke darmiyan barabar jagah
    // paddingHorizontal: 0, // Arrows aur dates ke darmiyan gap
  },
  arrowBtn: {
    padding: 2,
  },
  dateCircle: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 12,
    minWidth: 40,
  },
  activeDate: {
    backgroundColor: "#1E3A8A",
  },
  dayText: { fontSize: 10, color: "#64748B" },
  dateText: { fontSize: 14, fontWeight: "bold", color: "#1E3A8A" },
  activeText: { color: "#FFF" },
});
