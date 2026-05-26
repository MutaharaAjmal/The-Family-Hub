// import React from "react";
// import { View, Text, StyleSheet } from "react-native";

// interface HomeTaskItemProps {
//   title: string;
//   isCompleted: boolean;
//   dateText: string;
//   creatorName?: string; // 🚀 New Prop
//   creatorColor?: string; // 🚀 New Prop
// }

// export const HomeTaskItem = ({
//   title,
//   isCompleted,
//   dateText,
//   creatorName,
//   creatorColor,
// }: HomeTaskItemProps) => {
//   console.log(creatorName);

//   return (
//     <View style={styles.taskItem}>
//       <View style={styles.taskInfo}>
//         <View
//           style={[
//             styles.dot,
//             { backgroundColor: isCompleted ? "#34C759" : "#1E3A8A" },
//           ]}
//         />
//         <Text style={styles.taskText}>{title}</Text>
//         <View style={styles.metaRow}>
//           {creatorName && (
//             <View
//               style={[
//                 styles.creatorBadge,
//                 { backgroundColor: creatorColor || "#CBD5E1" },
//               ]}
//             >
//               <Text style={styles.creatorInitial}>
//                 {creatorName[0].toUpperCase()}
//               </Text>
//             </View>
//           )}
//           <Text style={styles.taskDateText}>{dateText}</Text>
//         </View>
//       </View>
//       <Text style={styles.taskDateText}>{dateText}</Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   taskItem: {
//     backgroundColor: "#FFF",
//     paddingVertical: 14,
//     paddingHorizontal: 15,
//     borderRadius: 15,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 10,
//     elevation: 1,
//   },
//   taskInfo: { flexDirection: "row", alignItems: "center" },
//   dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
//   taskText: { fontSize: 15, fontWeight: "600", color: "#334155" },
//   taskDateText: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
//   metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
//   creatorBadge: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 6,
//   },
//   creatorInitial: {
//     fontSize: 10,
//     color: "#FFF",
//     fontWeight: "bold",
//   },
// });

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HomeTaskItemProps {
  title: string;
  isCompleted: boolean;
  dateText: string;
  dateTime: string;
  creatorName?: string;
  familyMembers?: any[];
}

export const HomeTaskItem = ({
  title,
  isCompleted,
  dateText,
  dateTime,
  creatorName: creatorId, // Hum isey creatorId ki tarah treat karenge
  familyMembers,
}: HomeTaskItemProps) => {
  const member = familyMembers?.find((m) => m.id === creatorId);

  // Agar member mil gaya toh uska naam, warna "User"
  const displayName = member?.username || "Someone";
  const creatorColor = member?.color || "#1E3A8A";
  // const todayStr = new Date().toISOString().split("T")[0];
  // console.log(todayStr);
  const todayStr = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");

  return (
    <View style={[styles.taskItem, isCompleted && styles.completedItem]}>
      <View style={styles.leftSection}>
        {/* 🚀 Dynamic Icon Indicator instead of Dot */}
        <View style={styles.iconContainer}>
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={22} color="#34C759" />
          ) : (
            <Ionicons name="ellipse-outline" size={20} color="#E2E8F0" />
            /* Note: Aapne jo red icon maanga wo niche hai, 
               lekin standard apps mein ellipse zyada clean lagta hai. 
               Red ke liye: <Ionicons name="checkmark-circle" size={18} color="#d71717" /> */
          )}
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[styles.taskText, isCompleted && styles.completedText]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {displayName && (
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.creatorBadge,
                  { backgroundColor: `${creatorColor || "#1E3A8A"}15` },
                  { borderColor: `${creatorColor || "#1E3A8A"}30` },
                ]}
              >
                <View
                  style={[
                    styles.innerDot,
                    { backgroundColor: creatorColor || "#1E3A8A" },
                  ]}
                />
                <Text
                  style={[
                    styles.creatorName,
                    { color: creatorColor || "#1E3A8A" },
                  ]}
                >
                  {displayName}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Right Side Date Section */}
      <View style={styles.dateContainer}>
        <Text style={[styles.dateText, isCompleted && styles.completedText]}>
          {dateTime}
          {"  "}
          {dateText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  taskItem: {
    backgroundColor: "#FFF",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  completedItem: {
    backgroundColor: "#F8FAFC",
    borderColor: "transparent",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  taskText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    letterSpacing: -0.2,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#94A3B8",
    fontWeight: "400",
  },
  metaRow: {
    marginTop: 6,
  },
  creatorBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  innerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 5,
  },
  creatorName: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  dateContainer: {
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  dateText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
