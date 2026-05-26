import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "../../src/components/AppHeader";
import { supabase } from "../../src/api/supabase";
import { AppText } from "../../src/components/AppText";
import Toast from "react-native-toast-message";
import { useAppStore } from "../../src/store/useAppStore";

export default function ListDetailScreen() {
  const router = useRouter();
  const { categoryId, title, tabType, familyId } = useLocalSearchParams();

  const titleStr = (title as string) || "";

  let targetTable = "shopping_items";
  if (tabType === "To Do") targetTable = "tasks";
  else if (tabType === "Chores") targetTable = "chores";
  else if (tabType === "Shopping") targetTable = "shopping_items";
  else {
    if (titleStr.toLowerCase().includes("to do")) targetTable = "tasks";
    else if (titleStr.toLowerCase().includes("chore")) targetTable = "chores";
  }

  const nameColumn =
    targetTable === "tasks" || targetTable === "chores" ? "title" : "name";
  const { userProfile, familyId: storeFamilyId } = useAppStore();
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // ✅ Naya state

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (categoryId) {
      fetchItems(true);
    }
  }, [categoryId, targetTable]);

  const fetchItems = async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      // Purana getUser() wala logic hata dein
      if (!userProfile?.id || !storeFamilyId) {
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from(targetTable)
        .select("*")
        .eq("category_id", categoryId)
        .eq("family_id", storeFamilyId) // store wala ID use karein
        .order("created_at", { ascending: false });

      if (!error) {
        setItems(data || []);
      }
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItemName.trim() || !userProfile?.id) return; // ✅ Store id use ki

    const activeFamilyId = storeFamilyId; // ✅ Store familyId use ki
    const tempName = newItemName; // Backup for notification
    setNewItemName(""); // ✅ Input foran khali kar dein (Better UX)

    const insertData: any = {
      [nameColumn]: tempName,
      category_id: categoryId,
      is_completed: false,
      created_by: userProfile.id, // ✅ Store id
      family_id: activeFamilyId,
    };
    const tempId = Date.now().toString(); // Temporary ID
    setItems([{ ...insertData, id: tempId }, ...items]);
    const { error } = await supabase.from(targetTable).insert([insertData]);

    if (!error) {
      fetchItems(false);
      Toast.show({
        type: "success",
        text1: "Added Successfully! ✅",
        text2: `"${newItemName}" added to ${title}`,
      });
      // 2. Notification Logic - Yahan activeFamilyId use karein
      if (
        activeFamilyId &&
        (targetTable === "tasks" ||
          targetTable === "chores" ||
          targetTable === "shopping_items")
      ) {
        const { data: members } = await supabase
          .from("profiles")
          .select("id, expo_push_token")
          .eq("family_id", activeFamilyId)
          .neq("id", userProfile.id);

        const otherMembers =
          members?.filter((m) => m.id !== userProfile.id) || [];
        if (otherMembers.length > 0) {
          const senderName = userProfile?.username || "A family member"; // ✅ Seedha store se naam lein
          const historyEntries = otherMembers.map((member) => ({
            user_id: member.id,
            family_id: activeFamilyId,
            title: "New task added 📝",
            body: `${senderName} added "${tempName}" in ${title}`, // newItemName ki jagah tempName use karein kyunki wo khali ho chuka hoga
            status: "unread",
          }));

          // Is line ke error ko console mein check karein
          const { error: histErr } = await supabase
            .from("notifications_history")
            .insert(historyEntries);

          if (histErr)
            console.error("❌ History Table Error:", histErr.message);

          // Push Notifications...
          const pushMessages = otherMembers
            .filter((m) => m.expo_push_token)
            .map((m) => ({
              to: m.expo_push_token,
              sound: "default",
              title: `New ${targetTable === "tasks" ? "Task" : "Chore"} 📝`,
              body: `${senderName} added "${newItemName}" in ${title}`,
            }));
          if (pushMessages.length > 0) {
            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(pushMessages),
            });
          }
        }
      }

      setNewItemName("");
      fetchItems(false);
      // fetchItems();
    } else {
      fetchItems(false); // Rollback if error
      Alert.alert("Error", "Could not add item");
    }
  };
  const handleEditPress = (item: any) => {
    setEditingItem(item);
    setEditText(
      targetTable === "tasks" || targetTable === "chores"
        ? item.title
        : item.name,
    );
    setIsEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editText.trim() || !editingItem) return;
    const { error } = await supabase
      .from(targetTable)
      .update({ [nameColumn]: editText })
      .eq("id", editingItem.id);

    if (!error) {
      setIsEditModalVisible(false);
      fetchItems();
    }
  };

  const deleteItem = (item: any) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from(targetTable)
            .delete()
            .eq("id", item.id);
          if (!error) fetchItems();
        },
      },
    ]);
  };
  const toggleComplete = async (item: any) => {
    // UI foran update karein
    const updatedItems = items.map((i) =>
      i.id === item.id ? { ...i, is_completed: !i.is_completed } : i,
    );
    setItems(updatedItems);

    // Database update background mein
    await supabase
      .from(targetTable)
      .update({ is_completed: !item.is_completed })
      .eq("id", item.id);
  };
  return (
    <View style={styles.container}>
      <AppHeader title={title as string} showBack={true} />

      <Modal visible={isEditModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalHeader}>Edit Entry</AppText>
            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={setEditText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <AppText style={{ color: "red", marginRight: 25 }}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit}>
                <AppText style={{ color: "#1E3A8A", fontWeight: "bold" }}>
                  Save
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.inputArea}>
        <TouchableOpacity onPress={addItem}>
          <Ionicons name="add-circle" size={32} color="#1E3A8A" />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Add a new item..."
          value={newItemName}
          onChangeText={setNewItemName}
          onSubmitEditing={addItem}
        />
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator
          size="large"
          color="#1E3A8A"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          // contentContainerStyle={{ paddingBottom: 20 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          // 🔽 Agar scrolling smoother chahiye to ye bhi add kar sakte hain
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <TouchableOpacity
                onPress={async () => {
                  // await supabase
                  //   .from(targetTable)
                  //   .update({ is_completed: !item.is_completed })
                  //   .eq("id", item.id);
                  // fetchItems();
                  toggleComplete(item);
                }}
              >
                <Ionicons
                  name={item.is_completed ? "checkbox" : "square-outline"}
                  size={26}
                  color={item.is_completed ? "#1E3A8A" : "#CCC"}
                />
              </TouchableOpacity>

              <AppText
                style={[styles.itemText, item.is_completed && styles.strike]}
              >
                {targetTable === "tasks" || targetTable === "chores"
                  ? item.title
                  : item.name}
              </AppText>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() => handleEditPress(item)}
                  style={{ marginRight: 15 }}
                >
                  <Ionicons name="pencil-outline" size={20} color="#1E3A8A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteItem(item)}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  inputArea: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#F9F9F9",
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    height: 40,
    color: "#333",
  },
  itemRow: {
    flexDirection: "row",
    padding: 18,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  itemText: { flex: 1, marginLeft: 15, fontSize: 16, color: "#333" },
  strike: { textDecorationLine: "line-through", color: "#AAA" },
  actionButtons: { flexDirection: "row", alignItems: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    padding: 25,
    borderRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  modalInput: {
    borderBottomWidth: 2,
    borderBottomColor: "#1E3A8A",
    marginBottom: 25,
    fontSize: 18,
    paddingVertical: 5,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
