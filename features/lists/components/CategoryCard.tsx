import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { AppText } from "../../../src/components/AppText";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
  primary: "#6366F1",
  primaryLight: "#818CF8",
  surface: "#FFFFFF",
  text: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  success: "#10B981",
  error: "#EF4444",
};

interface ItemType {
  id: string;
  name: string;
  title: string;
  is_completed: boolean;
  quantity?: string | number;
  unit?: string;
  category_id?: string;
  assigned_to?: string;
  created_by?: string;
  visibility?: "private" | "view" | "shared";
  profiles?: {
    username: string;
    color?: string;
    avatar_url?: string;
  };
}

interface CategoryType {
  id: string;
  name?: string;
  title?: string;
  color?: string;
}

interface CategoryCardProps {
  category: CategoryType;
  items: ItemType[];
  color?: string;
  onAddItem: () => void;
  onToggleItem?: (item: ItemType) => void;
  onDeleteItem?: (item: ItemType) => void;
  onEditItem?: (item: ItemType) => void;
  onBulkDelete?: (itemIds: string[]) => void;
  currentUserId?: string;
  familyMembers?: any[];
  isReadOnly?: (task: ItemType) => boolean;
}

const SwipeableItem = ({
  item,
  color,
  onToggle,
  onDelete,
  onEdit,
  currentUserId,
  familyMembers,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}: {
  item: ItemType;
  color: string;
  onToggle?: (item: ItemType) => void;
  onDelete?: (item: ItemType) => void;
  onEdit?: (item: ItemType) => void;
  currentUserId?: string;
  familyMembers?: any[];
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (itemId: string) => void;
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const userBadgeColor = item.profiles?.color || "#6366F1";

  const creator = familyMembers?.find((m) => m.id === item.created_by);
  const creatorName =
    item.created_by === currentUserId ? "me" : creator?.username || "Someone";

  const isViewOnly =
    item.visibility === "view" && item.created_by !== currentUserId;

  const renderRightActions = (progress: any, dragX: any) => {
    if (isViewOnly || isSelectionMode) return null;
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete?.(item);
        }}
      >
        <Ionicons name="trash-outline" size={22} color="#FFF" />
      </TouchableOpacity>
    );
  };

  // 🎯 ITEM CLICK - Edit modal open karega
  const handleItemClick = () => {
    if (!isViewOnly) {
      onEdit?.(item);
    }
  };

  // 🎯 CHECKBOX CLICK - Toggle complete/incomplete karega
  const handleCheckboxClick = (e: any) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!isViewOnly && !isSelectionMode) {
      onToggle?.(item);
    }
  };

  // 🎯 LONG PRESS - Selection mode activate karega
  const handleLongPress = () => {
    if (!isSelectionMode && onSelect && !isViewOnly) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onSelect(item.id);
    }
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      enabled={!isSelectionMode && !isViewOnly}
    >
      <View
        style={[
          styles.itemRow,
          isSelectionMode && styles.selectionModeItem,
          isSelected && styles.selectedItem,
        ]}
      >
        {/* LEFT: Checkbox - Sirf checkbox click karne se toggle ho */}
        <View style={styles.leftContainer}>
          {isSelectionMode ? (
            <TouchableOpacity
              onPress={() => onSelect?.(item.id)}
              style={styles.selectionCheckboxTouchable}
            >
              <View
                style={[
                  styles.selectionCheckbox,
                  isSelected && styles.selectionCheckboxSelected,
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleCheckboxClick}
              activeOpacity={0.7}
              disabled={isViewOnly}
              style={styles.checkboxTouchable}
            >
              <View
                style={[
                  styles.checkbox,
                  item.is_completed && {
                    backgroundColor: color,
                    borderColor: color,
                  },
                  isViewOnly && { borderColor: COLORS.textMuted },
                ]}
              >
                {item.is_completed && (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* CENTER: Task Info - Click se edit modal khule */}
        <TouchableOpacity
          style={styles.centerContainer}
          onPress={handleItemClick}
          onLongPress={handleLongPress}
          activeOpacity={0.7}
          disabled={isViewOnly}
        >
          <View style={styles.titleRow}>
            <AppText
              style={[
                styles.itemText,
                item.is_completed && styles.itemTextCompleted,
              ]}
              numberOfLines={1}
            >
              {item.name || item.title || "Unnamed Task"}
            </AppText>

            {item.quantity ? (
              <View
                style={[
                  styles.quantityBadge,
                  { backgroundColor: color + "15" },
                ]}
              >
                <AppText style={[styles.quantityText, { color: color }]}>
                  {item.quantity}
                  {item.unit ? ` ${item.unit}` : ""}
                </AppText>
              </View>
            ) : null}

            {item.visibility === "private" && (
              <Ionicons
                name="lock-closed"
                size={12}
                color={COLORS.error}
                style={{ marginLeft: 6 }}
              />
            )}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.creatorPill}>
              <View style={styles.creatorIconCircle}>
                <Ionicons name="person" size={8} color="#FFF" />
              </View>
              <AppText style={styles.creatorPillText}>
                By{" "}
                <AppText style={styles.creatorPillText}>{creatorName}</AppText>
              </AppText>
            </View>

            {isViewOnly && (
              <View style={styles.viewOnlyBadge}>
                <AppText style={styles.readOnlyTag}>VIEW ONLY</AppText>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* RIGHT: Assigned User Badge */}
        {item.profiles && !isSelectionMode && (
          <View style={styles.assigneeBadge}>
            <View
              style={[styles.avatarCircle, { backgroundColor: userBadgeColor }]}
            >
              <AppText style={styles.avatarLetter}>
                {item.profiles.username.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <AppText style={styles.assigneeName} numberOfLines={1}>
              {item.profiles.username.split(" ")[0]}
            </AppText>
          </View>
        )}
      </View>
    </Swipeable>
  );
};

export const CategoryCard = ({
  category,
  items,
  color,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onEditItem,
  onBulkDelete,
  familyMembers,
  currentUserId,
  isReadOnly,
}: CategoryCardProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const isAllSelected =
    selectedItems.length === items.length && items.length > 0;
  const isAnySelected = selectedItems.length > 0;

  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;
  const hasItems = totalCount > 0;
  const categoryColor = color || category.color || COLORS.primary;
  const title = category.name || category.title || "Untitled";

  // Handle category level checkbox press
  const handleCategorySelect = () => {
    if (!hasItems) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isAllSelected) {
      // Deselect all
      setSelectedItems([]);
    } else {
      // Select all items in this category
      setSelectedItems(items.map((item) => item.id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;

    Alert.alert(
      "Delete Items",
      `Are you sure you want to delete ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} from "${title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onBulkDelete?.(selectedItems);
            setSelectedItems([]);
          },
        },
      ],
    );
  };

  // Handle individual item select
  const handleSelectItem = (itemId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  return (
    <View style={styles.card}>
      {/* Header with Category Checkbox */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Category Level Checkbox */}
          {hasItems && (
            <TouchableOpacity
              onPress={handleCategorySelect}
              style={styles.categoryCheckbox}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  isAllSelected && styles.checkboxSelected,
                  isAnySelected && !isAllSelected && styles.checkboxPartial,
                ]}
              >
                {isAllSelected && (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                )}
                {isAnySelected && !isAllSelected && (
                  <View style={styles.partialIndicator} />
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Category Title */}
          <TouchableOpacity
            style={styles.titleRow}
            onPress={onAddItem}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.colorIndicator,
                { backgroundColor: categoryColor },
              ]}
            />
            <AppText style={styles.title}>{title}</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          {/* Progress Badge */}
          {hasItems && (
            <View
              style={[
                styles.progressBadge,
                { backgroundColor: categoryColor + "15" },
              ]}
            >
              <AppText style={[styles.progressText, { color: categoryColor }]}>
                {completedCount}/{totalCount}
              </AppText>
            </View>
          )}

          {/* Bulk Delete Button - Only show when items are selected */}
          {isAnySelected && (
            <TouchableOpacity
              onPress={handleBulkDelete}
              style={styles.bulkDeleteHeaderBtn}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              <AppText style={styles.bulkDeleteHeaderText}>
                {selectedItems.length}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Selected Items Banner */}
      {isAnySelected && (
        <View style={styles.selectionBanner}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
          <AppText style={styles.selectionBannerText}>
            {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}
            selected
          </AppText>
          <TouchableOpacity
            onPress={() => setSelectedItems([])}
            style={styles.clearSelectionBtn}
          >
            <Ionicons name="close" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Items List */}
      {hasItems ? (
        <View style={styles.itemsContainer}>
          {items.map((item) => (
            <SwipeableItem
              key={item.id}
              item={item}
              color={categoryColor}
              onToggle={onToggleItem}
              onDelete={onDeleteItem}
              onEdit={onEditItem}
              currentUserId={currentUserId}
              familyMembers={familyMembers}
              isSelectionMode={isAnySelected}
              isSelected={selectedItems.includes(item.id)}
              onSelect={handleSelectItem}
            />
          ))}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.emptyState}
          onPress={onAddItem}
          activeOpacity={0.7}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={COLORS.textMuted}
          />
          <AppText style={styles.emptyText}>Add first item</AppText>
        </TouchableOpacity>
      )}

      {/* Add Item Row */}
      {hasItems && !isAnySelected && (
        <TouchableOpacity
          style={styles.addItemRow}
          onPress={onAddItem}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={categoryColor} />
          <AppText style={[styles.addItemText, { color: categoryColor }]}>
            Add item
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  checkboxTouchable: {
    padding: 2,
  },
  selectionCheckboxTouchable: {
    padding: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryCheckbox: {
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxPartial: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "20",
  },
  partialIndicator: {
    width: 10,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bulkDeleteHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  bulkDeleteHeaderText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: "600",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
  },
  selectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
  },
  selectionBannerText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
    flex: 1,
  },
  clearSelectionBtn: {
    padding: 4,
  },
  leftContainer: {
    marginRight: 12,
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  selectionCheckboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  centerContainer: {
    flex: 1,
    paddingLeft: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  selectionModeItem: {
    backgroundColor: "#F8FAFC",
  },
  selectedItem: {
    backgroundColor: "#EFF6FF",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
    flexShrink: 1,
  },
  itemTextCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textMuted,
  },
  deleteAction: {
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
    width: 70,
  },
  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  addItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  addItemText: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemsContainer: {
    paddingTop: 4,
  },
  creatorPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginTop: 4,
    alignSelf: "flex-start",
  },
  creatorIconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  creatorPillText: {
    fontSize: 10,
    color: "#4338CA",
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewOnlyBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: "#CBD5E1",
  },
  readOnlyTag: {
    fontSize: 8,
    color: "#64748B",
    fontWeight: "800",
  },
  assigneeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
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
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
    maxWidth: 50,
  },
  quantityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
