import React, { useRef } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../../../src/components/AppText";
import { Swipeable } from "react-native-gesture-handler";

export default function ChoreListItem({
  item,
  onToggle,
  onDelete,
  onPress, // Edit modal trigger
  canEdit,
  showAssignedBadge,
  assignedMember,
}: any) {
  const swipeableRef = useRef<Swipeable>(null);
  const themeColor = "#1E3A8A";

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    if (!canEdit) return null;
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete?.(item);
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={22} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      enabled={canEdit}
      renderRightActions={canEdit ? renderRightActions : undefined}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={styles.itemRow}>
        {/* 1. CHECKBOX */}
        <TouchableOpacity
          onPress={onToggle}
          activeOpacity={0.6}
          style={[
            styles.checkbox,
            item.is_completed && {
              backgroundColor: themeColor,
              borderColor: themeColor,
            },
          ]}
        >
          {item.is_completed && (
            <Ionicons name="checkmark" size={14} color="#FFF" />
          )}
        </TouchableOpacity>

        {/* 2. CONTENT AREA */}
        <TouchableOpacity
          style={styles.contentWrapper}
          onPress={onPress} // Edit modal sirf tab khulega agar parent se onPress pass hua ho
          activeOpacity={canEdit ? 0.7 : 1}
        >
          {/* 🚀 Text Container: flex: 1 aur numberOfLines zaruri hain alignment ke liye */}
          <View style={styles.textContainer}>
            {/* 🚀 Red Lock Icon for Private Visibility */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {item.visibility === "private" && (
                <Ionicons
                  name="lock-closed"
                  size={14}
                  color="#EF4444" // Red color
                  style={{ marginRight: 6 }}
                />
              )}
              <AppText
                style={[
                  styles.itemText,
                  item.is_completed && styles.itemTextCompleted,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.name || item.title || "Unnamed Chore"}
              </AppText>
            </View>
          </View>

          {/* 🚀 Right Info: Fixed width se alignment perfect ho jayegi */}
          <View style={styles.rightInfo}>
            {showAssignedBadge && assignedMember ? (
              <View style={styles.assigneeBadge}>
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: assignedMember.color || themeColor },
                  ]}
                >
                  <AppText style={styles.avatarLetter}>
                    {assignedMember.username?.charAt(0).toUpperCase()}
                  </AppText>
                </View>
                <AppText style={styles.assigneeName} numberOfLines={1}>
                  {assignedMember.username?.split(" ")[0]}
                </AppText>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    // borderBottomWidth: 0.5, // Optional: Category card jaisi line ke liye
    // borderBottomColor: "#E2E8F0",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1, // Yeh space occupy karega aur badge ko right par dhakelega
    marginRight: 8,
  },
  itemText: {
    fontSize: 15,
    color: "#1E293B",
    flex: 1,
  },
  itemTextCompleted: {
    textDecorationLine: "line-through",
    color: "#94A3B8",
  },
  rightInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", // Hamesha right side par rakhega
    minWidth: 80, // Aik minimum width taake alignment consistent rahe
  },
  deleteAction: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 70,
  },
  assigneeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  avatarLetter: {
    color: "white",
    fontSize: 9,
    fontWeight: "700",
  },
  assigneeName: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
    maxWidth: 60,
  },
});
