import React, {
  useCallback,
  useState,
  useRef,
  useMemo,
  useEffect,
} from "react";
import {
  FlatList,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  DeviceEventEmitter,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { CategoryCard } from "../../../features/lists/components/CategoryCard";
import { supabase } from "../../../src/api/supabase";
import { useAppStore } from "../../../src/store/useAppStore";
import { ChoreCalendar } from "../../../features/lists/components/ChoresCalendar";
import { CATEGORY_COLORS, COLORS } from "../../../src/constants/theme";
import { SmartSyncBanner } from "../../../features/lists/components/SmartSyncBanner";
import { AppText } from "../../../src/components/AppText";
import { saveNotificationToHistory } from "../../../src/utils/notifications";
import ItemModal, { listStyles, SCREEN_HEIGHT } from "../components/ItemModal";
import ChoreMemberCard from "../components/ChoreMemberCard";
import MealSyncModal from "../components/MealSyncModal";
import { EMPTY_STATE_CONFIG } from "../utils/data";
import Toast from "react-native-toast-message";
import { Analytics } from "../../../src/utils/Analytics";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DeleteLoader } from "../../../src/components/DeleteLoader";
import { AnimatedEmptyState } from "../components/AnimatedEmptyState";
import { TabHeader } from "../components/TabHedaer";
import { SmartSuggestions } from "../components/SmartSuggestion";

// const COLLAPSED_HEIGHT = Platform.OS === "ios" ? 220 : 200;
// const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.7;

// Update these constants at the top
const COLLAPSED_HEIGHT = Platform.OS === "ios" ? 300 : 200; // Increased for iOS
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.8; // Increased from 0.7 to 0.8

type TabType = "Shopping" | "Chores" | "To Do";
export default function ListTabContent({ tabType }: { tabType: TabType }) {
  const {
    familyId: storeFamilyId,
    choresData,
    shoppingData,
    todoData,
    userProfile,
    loading,
    fetchGenericList,
    familyMembers,
    fetchFamilyDetails,
  } = useAppStore();

  const [visibility, setVisibility] = useState<"private" | "view" | "shared">(
    "private",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [itemName, setItemName] = useState("");
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [note, setNote] = useState("");
  const [baseDate, setBaseDate] = useState(new Date());
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedFullDate, setSelectedFullDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [assignedTo, setAssignedTo] = useState<any>(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAssignedPicker, setShowAssignedPicker] = useState(false);
  const [showSharedPicker, setShowSharedPicker] = useState(false);
  const [sharedMembers, setSharedMembers] = useState<string[]>([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryColor, setSelectedCategoryColor] = useState(
    CATEGORY_COLORS[0],
  );
  const [addingCategory, setAddingCategory] = useState(false);
  const [activePickerType, setActivePickerType] = useState<
    "shared" | "view" | null
  >(null);
  const [showMealSyncModal, setShowMealSyncModal] = useState(false);
  const [availableMeals, setAvailableMeals] = useState<
    { id: string; title: string; ingredients: string[] }[]
  >([]);
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const sheetHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const inputRef = useRef<TextInput>(null);
  const cfg = EMPTY_STATE_CONFIG[tabType];
  // Add with other useState declarations
  const [allCategories, setAllCategories] = useState<any[]>([]);
  useEffect(() => {
    fetchGenericList(tabType);
    // if (!storeFamilyId) return;
    const loadData = async () => {
      setIsInitialLoad(true); // Shuru mein load true karein
      await fetchGenericList(tabType);
      setIsInitialLoad(false); // Data aane ke baad false karein
    };

    loadData();
    const channel = supabase
      .channel("family-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `family_id=eq.${storeFamilyId}`,
        },
        () => fetchGenericList(tabType),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_items",
          filter: `family_id=eq.${storeFamilyId}`,
        },
        () => fetchGenericList(tabType),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chores",
          filter: `family_id=eq.${storeFamilyId}`,
        },
        () => fetchGenericList(tabType),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeFamilyId, tabType]);
  useEffect(() => {
    // Listen for category added event
    const subscription = DeviceEventEmitter.addListener(
      "categoryAdded",
      async (data) => {
        if (data.tabType === tabType) {
          // Refresh the list to get new category
          fetchGenericList(
            tabType,
            tabType === "Chores" ? selectedFullDate : undefined,
          );

          // 🔥 CRITICAL: Also refresh allCategories
          if (storeFamilyId) {
            const { data: updatedCategories } = await supabase
              .from("shopping_categories")
              .select("*")
              .eq("family_id", storeFamilyId)
              .eq("tab_type", tabType);
            if (updatedCategories) {
              setAllCategories(updatedCategories);
            }
          }
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [tabType, selectedFullDate, storeFamilyId]);

  useFocusEffect(
    useCallback(() => {
      Analytics.List.tabSwitched({
        tab_name: tabType as "Shopping" | "To Do" | "Chores",
      });
      fetchFamilyDetails();
      const refreshData = async () => {
        await fetchGenericList(
          tabType,
          tabType === "Chores" ? selectedFullDate : undefined,
        );
        setIsInitialLoad(false); // Yahan bhi false set karein
      };

      refreshData();
    }, [tabType, selectedFullDate]),
  );
  // Initialize - ensure General category exists on component mount
  useEffect(() => {
    const initializeCategories = async () => {
      if (!storeFamilyId || tabType === "Chores") return;

      const { data: existingCats } = await supabase
        .from("shopping_categories")
        .select("id")
        .eq("family_id", storeFamilyId)
        .eq("tab_type", tabType);

      if (!existingCats || existingCats.length === 0) {
        const { error } = await supabase.from("shopping_categories").insert([
          {
            title: "General",
            tab_type: tabType,
            family_id: storeFamilyId,
            color: "#1E3A8A",
          },
        ]);

        if (!error) {
          // Refresh categories
          const { data: newCats } = await supabase
            .from("shopping_categories")
            .select("*")
            .eq("family_id", storeFamilyId)
            .eq("tab_type", tabType);
          if (newCats) setAllCategories(newCats);

          // Refresh list data
          // await fetchGenericList(tabType, tabType === "Chores" ? selectedFullDate : undefined);
          await fetchGenericList(
            tabType,
            (tabType as string) === "Chores" ? selectedFullDate : undefined,
          );
        }
      }
    };

    initializeCategories();
  }, [storeFamilyId, tabType]);

  const expandSheet = () => {
    setIsExpanded(true);
    Animated.spring(sheetHeight, {
      toValue: Platform.OS === "ios" ? SCREEN_HEIGHT * 0.85 : EXPANDED_HEIGHT,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchGenericList(
      tabType,
      tabType === "Chores" ? selectedFullDate : undefined,
    );
    setRefreshing(false);
  }, [tabType, selectedFullDate]);

  const displayData = useMemo(() => {
    if (tabType === "Chores") {
      const filteredChores = choresData.filter(
        (item: any) => item.date === selectedFullDate,
      );
      const myChores = filteredChores.filter(
        (item) => item.assigned_to === userProfile?.id,
      );
      const familyChores = filteredChores.filter(
        (item) => item.assigned_to !== userProfile?.id,
      );
      return [
        { sectionTitle: "My Chores", items: myChores },
        { sectionTitle: "Family Chores", items: familyChores },
      ];
    }

    const rawData = tabType === "Shopping" ? shoppingData : todoData;
    return rawData
      .map((category: any) => {
        const filteredItems = (category.items || []).filter((item: any) => {
          const currentUserId = userProfile?.id;
          const isOwner = item.created_by === currentUserId;
          const isAssigned = item.assigned_to === currentUserId;
          const isSpecificallyShared =
            Array.isArray(item.shared_with) &&
            item.shared_with.includes(currentUserId);

          if (item.visibility === "private") return isOwner;
          if (item.visibility === "view" || item.visibility === "shared") {
            return isOwner || isAssigned || isSpecificallyShared;
          }
          return isOwner;
        });

        const sortedItems =
          tabType === "Shopping"
            ? [...filteredItems].sort((a, b) =>
                a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1,
              )
            : filteredItems;

        return { ...category, items: sortedItems };
      })
      .filter((category: any) => category.items.length > 0);
  }, [
    tabType,
    choresData,
    shoppingData,
    todoData,
    selectedFullDate,
    userProfile?.id,
  ]);

  const openModal = () => {
    if (!editingItem && !selectedCat) {
      const rawData = tabType === "Shopping" ? shoppingData : todoData;
      const generalCat = rawData.find(
        (c: any) => c.title?.toLowerCase() === "general",
      );
      setSelectedCat(generalCat || rawData[0] || null);
    }
    setIsModalOpen(true);
    expandSheet();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const closeSheet = () => {
    Keyboard.dismiss();
    setIsModalOpen(false);
    setEditingItem(null);
    setItemName("");
  };

  const resetForm = () => {
    setEditingItem(null);
    setItemName("");
    setNote("");
    setQuantity("");
    setUnit("");
    setAssignedTo(null);
    setVisibility("private");
    setSharedMembers([]);
    closeSheet();
    setBaseDate(new Date());
    setSelectedFullDate(new Date().toISOString().split("T")[0]);
    // const generalCat = displayData.find(
    //   (c: any) => c.title?.toLowerCase() === "general",
    // );
    // setSelectedCat(generalCat || displayData[0] || null);
  };

  const logActivity = async (action: string, name: string) => {
    await supabase.from("activity_logs").insert({
      family_id: storeFamilyId,
      user_name: userProfile?.username,
      action_type: action,
      item_name: name,
      tab_type: tabType,
    });
  };
  const handleAddItem = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!itemName.trim() || !storeFamilyId) return;
    setSubmitting(true);

    try {
      // 🔥 Fix: Proper type checking for tabType
      if (tabType !== "Chores") {
        let { data: existingCats, error: fetchError } = await supabase
          .from("shopping_categories")
          .select("id, title")
          .eq("family_id", storeFamilyId)
          .eq("tab_type", tabType);

        if (fetchError) throw fetchError;

        if (!existingCats || existingCats.length === 0) {
          const { data: newCat, error: insertError } = await supabase
            .from("shopping_categories")
            .insert([
              {
                title: "General",
                tab_type: tabType,
                family_id: storeFamilyId,
                color: "#1E3A8A",
              },
            ])
            .select()
            .single();

          if (insertError) throw insertError;

          setAllCategories((prev) => [newCat, ...prev]);
          setSelectedCat(newCat);
          await fetchGenericList(
            tabType,
            (tabType as string) === "Chores" ? selectedFullDate : undefined,
          );
        } else {
          let targetCat = selectedCat;
          if (!targetCat) {
            targetCat = existingCats.find(
              (c) => c.title?.toLowerCase() === "general",
            );
            if (!targetCat && existingCats.length > 0) {
              targetCat = existingCats[0];
            }
            if (targetCat) {
              setSelectedCat(targetCat);
            }
          }
        }
      }

      const table =
        tabType === "Shopping"
          ? "shopping_items"
          : tabType === "Chores"
            ? "chores"
            : "tasks";
      const assignedId =
        assignedTo && typeof assignedTo === "object"
          ? assignedTo.id
          : assignedTo;

      let targetCatId = selectedCat?.id;

      if (tabType !== "Chores" && !targetCatId) {
        const { data: cats } = await supabase
          .from("shopping_categories")
          .select("id")
          .eq("family_id", storeFamilyId)
          .eq("tab_type", tabType)
          .limit(1);

        if (cats && cats.length > 0) {
          targetCatId = cats[0].id;
        } else {
          Alert.alert("Error", "Please create a category first");
          setSubmitting(false);
          return;
        }
      }

      const payload: any = {
        [tabType === "To Do" ? "title" : "name"]: itemName.trim(),
        category_id: tabType === "Chores" ? null : targetCatId,
        family_id: storeFamilyId,
        visibility,
        shared_with:
          visibility === "shared" || visibility === "view" ? sharedMembers : [],
        assigned_to: assignedId || null,
        note,
      };

      if (tabType === "Chores") payload.date = selectedFullDate;
      if (tabType === "Shopping") {
        payload.quantity = quantity;
        payload.unit = unit;
      }

      let error;
      if (editingItem) {
        const { error: updateError } = await supabase
          .from(table)
          .update(payload)
          .eq("id", editingItem.id);
        error = updateError;
        if (!error) {
          await logActivity("updated", itemName.trim());
          Toast.show({
            type: "success",
            text1: "Item Updated! ✅",
            text2: `"${itemName}" updated`,
          });
        }
      } else {
        const insertPayload = {
          ...payload,
          created_by: userProfile?.id,
        };
        const { error: insertError } = await supabase
          .from(table)
          .insert([insertPayload]);
        error = insertError;

        if (!error) {
          await logActivity("added", itemName);
          Toast.show({
            type: "success",
            text1: "Item Added Successfully! ✅",
            text2: `${userProfile?.username || "Someone"} added "${itemName}" to  ${tabType} list`,
          });

          // 🔥 NOTIFICATION SECTION - Only for non-private items
          if (visibility !== "private") {
            try {
              // Send to all family members except sender
              const recipientIds = familyMembers
                .filter((m: any) => m.id !== userProfile?.id)
                .map((m: any) => m.id);

              if (recipientIds.length > 0) {
                const { data: profiles } = await supabase
                  .from("profiles")
                  .select("expo_push_token")
                  .in("id", recipientIds)
                  .not("expo_push_token", "is", null);

                const tokens = profiles
                  ?.map((p) => p.expo_push_token)
                  .filter(Boolean);

                if (tokens && tokens.length > 0) {
                  // Send push notifications
                  const response = await fetch(
                    "https://exp.host/--/api/v2/push/send",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(
                        tokens.map((token) => ({
                          to: token,
                          sound: "default",
                          title: `New ${tabType} Item! ✨`,
                          body: `${userProfile?.username || "Someone"} added "${itemName}" to ${tabType} list`,
                          priority: "high",
                          data: { screen: "Lists", tab: tabType },
                        })),
                      ),
                    },
                  );

                  const result = await response.json();
                  console.log("✅ Push sent:", result);
                }
              }

              // Save to notification history
              await saveNotificationToHistory(
                `New Item in ${tabType}! ✨`,
                `${userProfile?.username || "Someone"} added "${itemName}".`,
                userProfile?.id || "",
                storeFamilyId,
              );
            } catch (notiErr) {
              console.log("Notification error:", notiErr);
            }
          }
        }
      }

      if (error) throw error;

      await fetchGenericList(
        tabType,
        tabType === "Chores" ? selectedFullDate : undefined,
      );
      resetForm();
    } catch (err) {
      console.error("Insert Error:", err);
      Alert.alert("Error", "Failed to save item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  const handleToggleItem = async (item: any) => {
    Haptics.notificationAsync(
      !item.is_completed
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    );
    const currentUserId = userProfile?.id;
    if (
      tabType === "To Do" &&
      item.visibility === "view" &&
      item.created_by !== currentUserId
    ) {
      Alert.alert(
        "Read Only",
        "You have read-only access to this task. Only the creator can mark it as completed.",
      );
      return;
    }

    const table =
      tabType === "Shopping"
        ? "shopping_items"
        : tabType === "Chores"
          ? "chores"
          : "tasks";
    const { error } = await supabase
      .from(table)
      .update({ is_completed: !item.is_completed })
      .eq("id", item.id)
      .select();

    if (!error) {
      const action = !item.is_completed ? "completed" : "uncompleted";
      if (!item.is_completed) {
        Analytics.List.itemToggled({
          tab_type: tabType as any,
          item_name: item.name || item.title,
          is_completed: !item.is_completed,
        });
      }
      await logActivity(action, item.name || item.title);
      fetchGenericList(
        tabType,
        tabType === "Chores" ? selectedFullDate : undefined,
      );
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (item.visibility === "view" && item.created_by !== userProfile?.id) {
      Alert.alert(
        "Permission Denied",
        "You only have permission to view this item. You cannot delete it.",
      );
      return;
    }

    Alert.alert("Delete Item", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const table =
              tabType === "Shopping"
                ? "shopping_items"
                : tabType === "Chores"
                  ? "chores"
                  : "tasks";
            const { error } = await supabase
              .from(table)
              .delete()
              .eq("id", item.id);
            if (!error) {
              Analytics.List.itemDeleted({
                tab_type: tabType as any,
                item_name: item.name || item.title,
              });
              await logActivity("deleted", item.name || item.title);
              Toast.show({
                type: "success",
                text1: "Item Deleted Successfully! ✅",
                text2: `"${item.name}" deleted in ${tabType} list`,
              });
              fetchGenericList(
                tabType,
                tabType === "Chores" ? selectedFullDate : undefined,
              );
            }
          } catch (err) {
            console.error(err);
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };
  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !storeFamilyId) return;
    setAddingCategory(true);
    try {
      const { data, error } = await supabase
        .from("shopping_categories")
        .insert({
          title: newCategoryName.trim(),
          color: selectedCategoryColor,
          family_id: storeFamilyId,
          tab_type: tabType,
        })
        .select()
        .single();

      if (error) throw error;

      const newCategory = {
        id: data.id,
        title: newCategoryName.trim(),
        color: selectedCategoryColor,
        tab_type: tabType,
        family_id: storeFamilyId,
      };

      setAllCategories((prev) => [newCategory, ...prev]);

      Analytics.List.categoryAdded({
        tab_type: tabType,
        category_name: newCategoryName.trim(),
      });

      setShowAddCategoryModal(false);
      setNewCategoryName("");
      setSelectedCategoryColor(CATEGORY_COLORS[0]);
      setSelectedCat(data);

      Toast.show({
        type: "success",
        text1: "Category Added! ✅",
        text2: `"${newCategoryName}" category created`,
      });
    } catch (error) {
      console.error("Add category error:", error);
      Alert.alert("Error", "Failed to add category");
    } finally {
      setAddingCategory(false);
    }
  };
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      setBaseDate(selectedDate);
      setSelectedFullDate(selectedDate.toISOString().split("T")[0]);
    }
  };

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000)
      .toISOString()
      .split("T")[0];
    if (dateStr === today) return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleClearCompleted = () => {
    Alert.alert(
      "Clear Completed",
      "Are you sure you want to delete all items you selected?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            const allItems = displayData.flatMap((cat: any) => cat.items || []);
            const completedIds = allItems
              .filter((i: any) => i.is_completed)
              .map((i: any) => i.id);
            if (completedIds.length === 0) {
              Alert.alert("Nothing to clear", "No completed item yet.");
              return;
            }
            setIsDeleting(true);
            try {
              await supabase
                .from("shopping_items")
                .delete()
                .in("id", completedIds);
              Analytics.List.bulkCleared({
                tab_type: tabType,
                cleared_count: completedIds.length,
              });
              await logActivity(
                "bulk_deleted",
                `${completedIds.length} completed items`,
              );
              fetchGenericList(tabType);
            } catch (err) {
              console.error("Bulk Delete Error:", err);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleToggleAllComplete = async () => {
    const allItems = displayData.flatMap((cat: any) => cat.items || []);
    if (allItems.length === 0) return;
    const allCompleted = allItems.every((i: any) => i.is_completed);
    const ids = allItems.map((i: any) => i.id);
    await supabase
      .from("shopping_items")
      .update({ is_completed: !allCompleted })
      .in("id", ids);
    Analytics.List.bulkToggled({
      tab_type: tabType,
      total_items: ids.length,
      marked_complete: !allCompleted,
    });
    await logActivity(
      allCompleted ? "bulk_uncompleted" : "bulk_completed",
      `${ids.length} items`,
    );
    fetchGenericList(tabType);
  };

  const isFuzzyDuplicate = (
    newName: string,
    existingNames: string[],
  ): boolean => {
    const n = newName.toLowerCase().replace(/s$/, "");
    return existingNames.some((e) => {
      const ex = e.toLowerCase().replace(/s$/, "");
      return ex === n || ex.includes(n) || n.includes(ex);
    });
  };

  const guessCategory = (ingredient: string): string => {
    const name = ingredient.toLowerCase();
    if (/milk|cheese|butter|cream|yogurt|dahi|paneer/.test(name))
      return "Dairy";
    if (/apple|banana|mango|orange|lemon|grape|strawberry|fruit/.test(name))
      return "Fruits";
    if (
      /onion|tomato|potato|carrot|spinach|garlic|ginger|vegetable|sabzi/.test(
        name,
      )
    )
      return "Vegetables";
    if (/chicken|beef|mutton|fish|meat|prawn|gosht/.test(name))
      return "Meat & Fish";
    if (/rice|flour|atta|maida|bread|roti|pasta|noodle/.test(name))
      return "Grains";
    if (/oil|ghee|salt|sugar|spice|masala|sauce|vinegar/.test(name))
      return "Pantry";
    return "Weekly Plan";
  };

  const formatSyncTime = (date: Date | null): string => {
    if (!date) return "Never synced";
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    const hrs = Math.floor(diff / 60);
    return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  };

  const openMealSyncModal = async () => {
    if (!storeFamilyId) return;
    setSyncLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: plans } = await supabase
        .from("meal_plans")
        .select(`id, meal_date, recipes (title, ingredients)`)
        .eq("family_id", storeFamilyId)
        .gte("meal_date", today);
      if (!plans || plans.length === 0) {
        setSyncLoading(false);
        Alert.alert(
          "No Upcoming Meals",
          "No upcoming meals found. Please plan your meals in the meal planner first to sync list.",
        );
        return;
      }
      const meals = plans
        .filter((p: any) => p.recipes)
        .map((p: any) => ({
          id: p.id,
          title: p.recipes.title || "Untitled",
          ingredients:
            typeof p.recipes.ingredients === "string"
              ? p.recipes.ingredients
                  .split(",")
                  .map((i: string) => i.trim())
                  .filter(Boolean)
              : p.recipes.ingredients || [],
        }));
      setAvailableMeals(meals);
      setSelectedMealIds(meals.map((m) => m.id));
      setShowMealSyncModal(true);
    } catch (err) {
      Alert.alert("Error", "Couldn't load Meals..");
    } finally {
      setSyncLoading(false);
    }
  };

  const parseIngredient = (text: string) => {
    const qtyRegex = /^(\d+[\/\d\-\.]*)\s*/;
    const units = [
      "tablespoon",
      "tbsp",
      "teaspoon",
      "tsp",
      "cup",
      "gram",
      "g",
      "kg",
      "ml",
      "liter",
      "packet",
      "clove",
      "pinch",
      "ounce",
      "oz",
    ];
    const unitRegex = new RegExp(`^(${units.join("|")})s?\\b`, "i");
    let quantity = "",
      unit = "",
      name = text.trim();
    const qtyMatch = name.match(qtyRegex);
    if (qtyMatch) {
      quantity = qtyMatch[1];
      name = name.replace(qtyRegex, "").trim();
    }
    name = name.replace(/^(of|–|-)\s+/i, "").trim();
    const unitMatch = name.match(unitRegex);
    if (unitMatch) {
      unit = unitMatch[1];
      name = name.replace(unitRegex, "").trim();
    }
    name = name.replace(/^(of|–|-)\s+/i, "").trim();
    return {
      quantity,
      unit: unit.charAt(0).toUpperCase() + unit.slice(1),
      name: name.charAt(0).toUpperCase() + name.slice(1),
    };
  };

  const generateFromMealPlan = async () => {
    if (!storeFamilyId || selectedMealIds.length === 0) return;
    setSyncLoading(true);
    try {
      const selectedMeals = availableMeals.filter((m) =>
        selectedMealIds.includes(m.id),
      );
      let allIngs: string[] = [];
      selectedMeals.forEach((m) => {
        allIngs = [...allIngs, ...m.ingredients];
      });
      const uniqueIngs = [
        ...new Set(allIngs.map((i) => i.trim().toLowerCase()).filter(Boolean)),
      ];
      if (uniqueIngs.length === 0) {
        Alert.alert(
          "No Ingredients",
          "No ingredients found in selected meals..",
        );
        return;
      }
      const { data: existingItems } = await supabase
        .from("shopping_items")
        .select("name")
        .eq("family_id", storeFamilyId);
      const existingNames =
        existingItems?.map((i) => i.name.toLowerCase()) || [];
      const newIngs = uniqueIngs.filter(
        (name) => !isFuzzyDuplicate(name, existingNames),
      );
      if (newIngs.length > 0) {
        Analytics.List.mealSynced({
          items_added: newIngs.length,
          meals_selected: selectedMealIds.length,
        });
      }
      if (newIngs.length === 0) {
        Alert.alert("All Synced ✅", "All ingredients already in the list.");
        setShowMealSyncModal(false);
        return;
      }
      const grouped: Record<string, string[]> = {};
      newIngs.forEach((name) => {
        const cat = guessCategory(name);
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(name);
      });
      const memberIds =
        familyMembers
          ?.map((m) => m.id)
          .filter((id) => id !== userProfile?.id) || [];
      for (const [catTitle, ingredients] of Object.entries(grouped)) {
        let { data: cat } = await supabase
          .from("shopping_categories")
          .select("id")
          .eq("title", catTitle)
          .eq("family_id", storeFamilyId)
          .single();
        if (!cat) {
          const catColors: Record<string, string> = {
            Dairy: "#60A5FA",
            Fruits: "#F59E0B",
            Vegetables: "#34D399",
            "Meat & Fish": "#F87171",
            Grains: "#A78BFA",
            Pantry: "#FB923C",
            "Weekly Plan": "#5856D6",
          };
          const { data: newCat } = await supabase
            .from("shopping_categories")
            .insert({
              title: catTitle,
              tab_type: "Shopping",
              family_id: storeFamilyId,
              color: catColors[catTitle] || "#5856D6",
            })
            .select()
            .single();
          cat = newCat;
        }
        const insertData = ingredients.map((rawIngredient) => {
          const {
            quantity: pQty,
            unit: pUnit,
            name: pName,
          } = parseIngredient(rawIngredient);
          return {
            name: pName,
            quantity: pQty || null,
            unit: pUnit || null,
            category_id: cat?.id,
            family_id: storeFamilyId,
            is_completed: false,
            created_by: userProfile?.id,
            visibility: "shared",
            shared_with: memberIds,
          };
        });
        await supabase.from("shopping_items").insert(insertData);
      }
      setLastSyncTime(new Date());
      setShowMealSyncModal(false);
      Toast.show({
        type: "success",
        text1: "Sync Complete! ✨",
        text2: `${newIngs.length} ingredients added in ${Object.keys(grouped).length} categories`,
      });
      fetchGenericList(tabType);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Sync failed.");
    } finally {
      setSyncLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      // Refresh allCategories when returning from manage categories screen
      const refreshAllCategories = async () => {
        if (!storeFamilyId) return;
        const { data } = await supabase
          .from("shopping_categories")
          .select("*")
          .eq("family_id", storeFamilyId)
          .eq("tab_type", tabType);
        if (data) {
          setAllCategories(data);
        }
      };
      refreshAllCategories();
    }, [storeFamilyId, tabType]),
  );
  const handleEditItem = (item: any) => {
    if (item.visibility === "view" && item.created_by !== userProfile?.id) {
      Alert.alert(
        "Read Only",
        "You don't have permission to edit this item. Only the creator can make changes.",
      );
      return;
    }
    setEditingItem(item);
    setItemName(item.name || item.title);
    setNote(item.note || "");
    const validDate = item.date ? new Date(item.date) : new Date();
    setBaseDate(validDate);
    setSelectedFullDate(item.date || new Date().toISOString().split("T")[0]);
    setAssignedTo(familyMembers.find((m) => m.id === item.assigned_to) || null);
    setVisibility(item.visibility || "private");
    setSharedMembers(Array.isArray(item.shared_with) ? item.shared_with : []);
    if (item.category_id) {
      const cat = displayData.find((c: any) => c.id === item.category_id);
      setSelectedCat(cat || null);
    }
    setIsModalOpen(true);
    expandSheet();
  };

  const onSuggestionSelect = (suggestion: string) => {
    setItemName(suggestion);
    openModal();
  };

  const renderChoresByMember = () => {
    if (!familyMembers || familyMembers.length === 0) {
      return (
        <AppText style={listStyles.emptyText}>No family members found.</AppText>
      );
    }
    const sortedMembers = [...familyMembers].sort((a, b) => {
      if (a.id === userProfile?.id) return -1;
      if (b.id === userProfile?.id) return 1;
      return 0;
    });
    const allChores = Array.isArray(choresData) ? choresData : [];
    return sortedMembers.map((member) => {
      const memberItems = allChores.filter((item: any) => {
        if (item.date !== selectedFullDate) return false;
        if (item.created_by !== member.id) return false;
        const currentUserId = userProfile?.id;
        if (currentUserId === member.id) return true;
        const visibility = String(item.visibility).toLowerCase();
        if (visibility === "private") return false;
        const isSharedWithMe =
          Array.isArray(item.shared_with) &&
          item.shared_with.includes(currentUserId);
        if (visibility === "shared" || visibility === "view") {
          return item.assigned_to === currentUserId || isSharedWithMe;
        }
        return false;
      });
      const completedCount = memberItems.filter(
        (i: any) => i.is_completed,
      ).length;
      const totalCount = memberItems.length;
      return (
        <ChoreMemberCard
          key={member.id}
          member={member}
          memberItems={memberItems}
          totalCount={totalCount}
          completedCount={completedCount}
          userProfile={userProfile}
          familyMembers={familyMembers}
          handleToggleItem={handleToggleItem}
          handleDeleteItem={handleDeleteItem}
          handleEditItem={handleEditItem}
        />
      );
    });
  };
  const renderCategoryItem = ({ item }: { item: any }) => (
    <CategoryCard
      category={item}
      items={item.items || []}
      color={item.color}
      onToggleItem={handleToggleItem}
      familyMembers={familyMembers}
      currentUserId={userProfile?.id}
      isReadOnly={(task) =>
        tabType === "To Do" &&
        task.visibility === "view" &&
        task.created_by !== userProfile?.id
      }
      onDeleteItem={handleDeleteItem}
      onEditItem={handleEditItem}
      onBulkDelete={async (itemIds) => {
        setIsDeleting(true);
        try {
          // ✅ Dynamic table selection according to tabType
          let tableName = "";
          if (tabType === "Shopping") {
            tableName = "shopping_items";
          } else if (tabType === "To Do") {
            tableName = "tasks";
          } else if (tabType === "Chores") {
            tableName = "chores";
          }

          if (!tableName) {
            console.error("Unknown tab type for bulk delete:", tabType);
            setIsDeleting(false);
            return;
          }

          const { error } = await supabase
            .from(tableName)
            .delete()
            .in("id", itemIds);

          if (!error) {
            Toast.show({
              type: "success",
              text1: "Items Deleted! ✅",
              text2: `${itemIds.length} items deleted successfully from ${tabType}`,
            });
            // Refresh list after deletion
            fetchGenericList(
              tabType,
              tabType === "Chores" ? selectedFullDate : undefined,
            );
          } else {
            Toast.show({
              type: "error",
              text1: "Delete Failed",
              text2: error.message,
            });
          }
        } catch (err) {
          console.error("Bulk delete error:", err);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to delete items",
          });
        } finally {
          setIsDeleting(false);
        }
      }}
      onAddItem={() => {
        setSelectedCat(item);
        openModal();
      }}
    />
  );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={listStyles.container}>
        {tabType === "Shopping" && (
          <>
            <SmartSyncBanner
              onPress={openMealSyncModal}
              lastSyncText={formatSyncTime(lastSyncTime)}
            />
          </>
        )}

        {loading && tabType !== "Chores" && displayData.length === 0 ? (
          <View style={listStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A8A" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {tabType === "Chores" ? (
              <>
                <ChoreCalendar
                  baseDate={baseDate}
                  setBaseDate={setBaseDate}
                  selectedFullDate={selectedFullDate}
                  setSelectedFullDate={setSelectedFullDate}
                />
                {displayData.length !== 0 && <TabHeader tabType={tabType} />}

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={listStyles.listContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor="#1E3A8A"
                      colors={["#1E3A8A"]}
                    />
                  }
                >
                  {renderChoresByMember()}
                </ScrollView>
                <TouchableOpacity
                  style={listStyles.fab}
                  onPress={openModal}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={28} color="white" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ flex: 1 }}>
                {displayData.length !== 0 && <TabHeader tabType={tabType} />}

                {/* {displayData.length === 0 ? ( */}
                {displayData.length === 0 && !loading && !isInitialLoad ? (
                  <>
                    <AnimatedEmptyState
                      cfg={cfg}
                      onAddPress={openModal}
                      onSuggestionSelect={onSuggestionSelect}
                    />
                  </>
                ) : (
                  <>
                    {/* <SmartSuggestions
                      tabType={tabType}
                      onSelectSuggestion={onSuggestionSelect}
                    /> */}
                    <FlatList
                      data={displayData}
                      key={tabType}
                      keyExtractor={(item) => item.id}
                      renderItem={renderCategoryItem}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={listStyles.listContent}
                      extraData={loading}
                      refreshControl={
                        <RefreshControl
                          refreshing={refreshing}
                          onRefresh={onRefresh}
                          tintColor="#1E3A8A"
                          colors={["#1E3A8A"]}
                        />
                      }
                    />
                  </>
                )}
              </View>
            )}
          </View>
        )}

        <ItemModal
          isOpen={isModalOpen}
          closeModal={closeSheet}
          submitting={submitting}
          itemName={itemName}
          setItemName={setItemName}
          allCategories={allCategories}
          handleAddItem={handleAddItem}
          tabType={tabType}
          note={note}
          setNote={setNote}
          quantity={quantity}
          setQuantity={setQuantity}
          unit={unit}
          setUnit={setUnit}
          selectedCat={selectedCat}
          setSelectedCat={setSelectedCat}
          showCategoryPicker={showCategoryPicker}
          setShowCategoryPicker={setShowCategoryPicker}
          baseDate={baseDate}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          onDateChange={onDateChange}
          assignedTo={assignedTo}
          setAssignedTo={setAssignedTo}
          showAssignedPicker={showAssignedPicker}
          setShowAssignedPicker={setShowAssignedPicker}
          editingItem={editingItem}
          sheetHeight={sheetHeight}
          isExpanded={isExpanded}
          visibility={visibility}
          setVisibility={setVisibility}
          sharedMembers={sharedMembers}
          setSharedMembers={setSharedMembers}
          familyMembers={familyMembers}
          userProfile={userProfile}
          activePickerType={activePickerType}
          setActivePickerType={setActivePickerType}
          showSharedPicker={showSharedPicker}
          setShowSharedPicker={setShowSharedPicker}
          selectedFullDate={selectedFullDate}
          formatDate={formatDate}
          displayData={displayData}
          showAddCategoryModal={showAddCategoryModal}
          setShowAddCategoryModal={setShowAddCategoryModal}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          selectedCategoryColor={selectedCategoryColor}
          setSelectedCategoryColor={setSelectedCategoryColor}
          handleAddCategory={handleAddCategory}
          addingCategory={addingCategory}
          inputRef={inputRef}
        />

        <MealSyncModal
          isVisible={showMealSyncModal}
          onClose={() => setShowMealSyncModal(false)}
          availableMeals={availableMeals}
          selectedMealIds={selectedMealIds}
          setSelectedMealIds={setSelectedMealIds}
          syncLoading={syncLoading}
          lastSyncTime={lastSyncTime}
          formatSyncTime={formatSyncTime}
          generateFromMealPlan={generateFromMealPlan}
        />

        {isDeleting && <DeleteLoader />}
      </View>
    </GestureHandlerRootView>
  );
}
