import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../../src/api/supabase";
import { AppText } from "../../../src/components/AppText";
// import { AppHeader } from "../src/components/AppHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../../src/components/AppHeader";

interface Category {
  id: string;
  name: string;
  title: string;
  color: string;
  tab_type: string;
}

export default function ManageTabCategoriesScreen() {
  const { tabType, familyId } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, [tabType]);

  const [categories, setCategories] = useState<any[]>([]);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null); // State ko 'Category' type den
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState("#1E3A8A");

  const openModal = (category: Category | null = null) => {
    // Type 'Category | null' den
    if (category) {
      setEditingCategory(category);
      setCategoryTitle(category.title || category.name);
      setSelectedColor(category.color || "#1E3A8A");
    } else {
      setEditingCategory(null);
      setCategoryTitle("");
      setSelectedColor("#1E3A8A");
    }
    setIsModalVisible(true);
  };
  const handleDelete = async (categoryId: string) => {
    // General category ko protect karein (Optional, but recommended)
    const categoryToDelete = categories.find((c) => c.id === categoryId);
    if (categoryToDelete?.title?.toLowerCase() === "general") {
      Alert.alert(
        "Action Denied",
        "You cannot delete the default General category.",
      );
      return;
    }

    Alert.alert(
      "Delete Category",
      "Warning: All items inside this category will also be permanently deleted. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            try {
              const tableName =
                tabType === "Shopping" ? "shopping_items" : "tasks";

              // 🚀 STEP A: Pehle us category ke saare items dlt karein
              const { error: itemsError } = await supabase
                .from(tableName)
                .delete()
                .eq("category_id", categoryId);

              if (itemsError) throw itemsError;

              // 🚀 STEP B: Phir category delete karein
              const { error: catError } = await supabase
                .from("shopping_categories")
                .delete()
                .eq("id", categoryId);

              if (catError) throw catError;

              fetchCategories(); // Refresh list
              Alert.alert(
                "Deleted",
                "Category and its items have been removed.",
              );
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.categoryRow}>
      <View style={styles.leftPath}>
        <View
          style={[
            styles.colorDot,
            { backgroundColor: item.color || "#1E3A8A" },
          ]}
        />
        <View>
          <AppText style={styles.categoryName}>
            {item.title || item.name}
          </AppText>
          <AppText style={styles.itemCount}>
            {(item as any).shopping_items?.[0]?.count ||
              (item as any).tasks?.[0]?.count ||
              0}
            items
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openModal(item)}
        >
          <Ionicons name="pencil-sharp" size={18} color="#1E3A8A" />
        </TouchableOpacity>

        {/* General category ke liye delete button hide ya disable kar dein */}
        {item.title?.toLowerCase() !== "general" && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#FEE2E2" }]}
            onPress={() => handleDelete(item.id)} // 🚀 Updated call
          >
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  // ADD aur UPDATE logic
  const handleSaveCategory = async () => {
    if (!categoryTitle.trim()) return;

    const payload = {
      title: categoryTitle,
      color: selectedColor,
      tab_type: tabType,
      family_id: familyId,
    };

    let result;
    if (editingCategory) {
      // UPDATE Logic
      result = await supabase
        .from("shopping_categories")
        .update({ title: categoryTitle, color: selectedColor })
        .eq("id", editingCategory.id);
    } else {
      // INSERT Logic
      result = await supabase.from("shopping_categories").insert([payload]);
    }

    if (result.error) {
      Alert.alert("Error", result.error.message);
    } else {
      setIsModalVisible(false);
      fetchCategories();
      const DeviceEventEmitter = require("react-native").DeviceEventEmitter;
      DeviceEventEmitter.emit("categoryAdded", { tabType });
    }
  };
  const fetchCategories = async () => {
    if (!tabType || !familyId) return;
    const itemsKey = tabType === "Shopping" ? "shopping_items" : "tasks";
    const { data, error } = await supabase
      .from("shopping_categories")
      .select(
        `
      *,
      ${itemsKey}(count) 
    `,
      ) // 👈 Ye items ka count bhi layega
      // .select("*")
      .eq("tab_type", tabType)
      .eq("family_id", familyId)
      .order("title", { ascending: true });

    if (error) {
      console.error("Database Error:", error);
      return;
    }

    // 🚀 FAKE "default-general" WALI LOGIC HATA DEIN
    // Sirf database ka data set karein.
    // Agar list khali hai, toh "No categories found" wala empty state dikhayen.
    setCategories(data || []);
  };
  const filteredCategories = categories.filter((cat) =>
    (cat.title || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Statistics Calculation
  const totalCategories = categories.length;
  const totalItems = categories.reduce((acc, curr) => {
    const count =
      curr.shopping_items?.[0]?.count ||
      curr.tasks?.[0]?.count ||
      curr.chores?.[0]?.count ||
      0;
    return acc + count;
  }, 0);

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={styles.statCard}>
      <AppText style={styles.statLabel}>{title}</AppText>
      <View style={styles.statRow}>
        <AppText style={[styles.statValue, { color }]}>{value}</AppText>
        <Ionicons name={icon} size={20} color={color} opacity={0.6} />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1E3A8A" }}
      edges={["left", "right", "top"]}
    >
      <AppHeader title="Category Manager" showBack={true} />
      <View style={styles.container}>
        <ScrollView
          stickyHeaderIndices={[1]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Stats Section */}
          <View style={styles.statsContainer}>
            <StatCard
              title="TOTAL"
              value={totalCategories}
              icon="grid"
              color="#1E3A8A"
            />
            <StatCard
              title="ITEMS"
              value={totalItems}
              icon="list"
              color="#10B981"
            />
            <StatCard
              title="ACTIVE"
              value={totalCategories > 0 ? 1 : 0}
              icon="checkmark-circle"
              color="#F59E0B"
            />
          </View>

          {/* Search Bar Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#94A3B8"
                style={{ marginRight: 10 }}
              />
              <TextInput
                placeholder={`Search ${tabType} categories...`}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* List Section */}
          <View style={styles.listSection}>
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              scrollEnabled={false} // ScrollView handle karega
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons
                    name="folder-open-outline"
                    size={60}
                    color="#CBD5E1"
                  />
                  <AppText style={styles.emptyText}>
                    No categories found
                  </AppText>
                </View>
              }
            />
          </View>
        </ScrollView>
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <AppText style={styles.modalHeader}>
                {editingCategory ? "Edit Category" : "New Category"}
              </AppText>

              <TextInput
                style={styles.modalInput}
                placeholder="Category Name"
                value={categoryTitle}
                onChangeText={setCategoryTitle}
              />

              <AppText style={styles.label}>Select Color</AppText>
              <View style={styles.colorRow}>
                {[
                  "#1E3A8A",
                  "#EF4444",
                  "#10B981",
                  "#F59E0B",
                  "#6366F1",
                  "#EC4899",
                ].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColor,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsModalVisible(false)}
                >
                  <AppText style={{ color: "#64748B" }}>Cancel</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveCategory}
                >
                  <AppText style={{ color: "white", fontWeight: "bold" }}>
                    Save
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Premium Floating Action Button */}
        {/* Premium Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => openModal()} // 🚀 Ab ye empty modal khole ga new category ke liye
        >
          <Ionicons name="add" size={32} color="white" />
          <AppText style={styles.fabText}>New Category</AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 4,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "bold" },

  searchSection: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: { flex: 1, fontSize: 16, color: "#1E293B" },

  listSection: { padding: 16 },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  leftPath: { flexDirection: "row", alignItems: "center" },
  colorDot: {
    width: 45,
    height: 45,
    borderRadius: 15,
    marginRight: 15,
    opacity: 0.9,
  },
  categoryName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  itemCount: { fontSize: 12, color: "#94A3B8", marginTop: 2 },

  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  fab: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "#1E3A8A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 35,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  fabText: { color: "white", fontWeight: "bold", marginLeft: 8 },

  emptyState: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#94A3B8", marginTop: 10, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    elevation: 10,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1E3A8A",
  },
  modalInput: {
    backgroundColor: "#F1F5F9",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  colorOption: { width: 40, height: 40, borderRadius: 20 },
  selectedColor: {
    borderWidth: 3,
    borderColor: "#000",
    scaleX: 1.1,
    scaleY: 1.1,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 15 },
  cancelBtn: { padding: 15 },
  saveBtn: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
});
