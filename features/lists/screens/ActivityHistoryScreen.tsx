import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../../src/store/useAppStore";
import { supabase } from "../../../src/api/supabase";
import { AppText } from "../../../src/components/AppText";
import { AppHeader } from "../../../src/components/AppHeader";

export default function ActivityHistoryScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { familyId } = useAppStore();

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [familyId]);

  const getActionStyles = (action: string) => {
    switch (action) {
      case "added":
        return { icon: "add-circle", color: "#10B981", bg: "#ECFDF5" };
      case "updated":
        return { icon: "sync-circle", color: "#3B82F6", bg: "#EFF6FF" };
      case "deleted":
        return { icon: "trash-bin", color: "#EF4444", bg: "#FEF2F2" };
      case "completed":
        return { icon: "checkmark-circle", color: "#8B5CF6", bg: "#F5F3FF" };
      default:
        return { icon: "notifications", color: "#1E3A8A", bg: "#F0F4FF" };
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1E3A8A" }}
      edges={["left", "right", "top"]}
    >
      <AppHeader title="Activity Feed" />
      <View style={styles.container}>
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchLogs} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={60} color="#CBD5E1" />
              <AppText style={{ color: "#94A3B8", marginTop: 10 }}>
                No activity recorded yet
              </AppText>
            </View>
          }
          renderItem={({ item }) => {
            const style = getActionStyles(item.action_type);
            return (
              <View style={styles.logCard}>
                <View style={[styles.iconBox, { backgroundColor: style.bg }]}>
                  <Ionicons
                    name={style.icon as any}
                    size={22}
                    color={style.color}
                  />
                </View>

                <View style={styles.textContainer}>
                  <AppText style={styles.actionText}>
                    <AppText style={styles.userName}>{item.user_name}</AppText>
                    {` ${item.action_type} `}
                    <AppText style={styles.itemName}>{item.item_name}</AppText>
                  </AppText>

                  <View style={styles.footer}>
                    <AppText style={styles.tabTag}>{item.tab_type}</AppText>
                    <AppText style={styles.timeText}>
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </AppText>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  logCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: { flex: 1 },
  userName: { fontWeight: "700", color: "#1E293B" },
  itemName: { fontWeight: "600", color: "#1E3A8A" },
  actionText: { fontSize: 14, color: "#64748B", lineHeight: 20 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  tabTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: "uppercase",
  },
  timeText: { fontSize: 11, color: "#94A3B8" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
});
