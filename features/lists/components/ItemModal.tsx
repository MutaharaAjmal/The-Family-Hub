import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  //   listStylesheet,
  ScrollView,
  Platform,
  Pressable,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PickerModal } from "./PickerModal";
import { CATEGORY_COLORS, COLORS } from "../../../src/constants/theme";
import { AppText } from "../../../src/components/AppText";

export const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
  Dimensions.get("window");

interface ItemModalProps {
  isOpen: boolean;
  closeModal: () => void; // <--- Yahan 'closeSheet' ko 'closeModal' kar dein
  submitting: boolean;
  itemName: string;
  setItemName: (val: string) => void;
  handleAddItem: () => void;
  tabType: string;
  note: string;
  setNote: (val: string) => void;
  quantity: string;
  setQuantity: (val: string) => void;
  unit: string;
  setUnit: (val: string) => void;
  selectedCat: any;
  setSelectedCat: (cat: any) => void;
  setShowCategoryPicker: (val: boolean) => void;
  showCategoryPicker: boolean;
  baseDate: Date;
  showDatePicker: boolean;
  setShowDatePicker: (val: boolean) => void;
  onDateChange: (event: any, date?: Date) => void;
  assignedTo: any;
  setAssignedTo: (member: any) => void;
  setShowAssignedPicker: (val: boolean) => void;
  showAssignedPicker: boolean;
  editingItem: any;
  sheetHeight: any;
  isExpanded: boolean;
  visibility: string;
  setVisibility: (val: "private" | "view" | "shared") => void;
  sharedMembers: string[];
  setSharedMembers: (val: string[]) => void;
  familyMembers: any[];
  userProfile: any;
  activePickerType: any;
  setActivePickerType: (val: any) => void;
  showSharedPicker: boolean;
  setShowSharedPicker: (val: boolean) => void;
  selectedFullDate: any;
  formatDate: (date: any) => string;
  displayData: any[];
  showAddCategoryModal: boolean;
  setShowAddCategoryModal: (val: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (val: string) => void;
  selectedCategoryColor: string;
  setSelectedCategoryColor: (val: string) => void;
  handleAddCategory: () => void;
  addingCategory: boolean;
  inputRef: any;
  allCategories: any[];
}

const ItemModal = (props: ItemModalProps) => {
  const {
    isOpen,
    closeModal,
    submitting,
    itemName,
    setItemName,
    handleAddItem,
    tabType,
    note,
    setNote,
    quantity,
    setQuantity,
    unit,
    setUnit,
    selectedCat,
    setSelectedCat,
    setShowCategoryPicker,
    showCategoryPicker,
    baseDate,
    showDatePicker,
    setShowDatePicker,
    onDateChange,
    assignedTo,
    setAssignedTo,
    setShowAssignedPicker,
    showAssignedPicker,
    editingItem,
    sheetHeight,
    isExpanded,
    visibility,
    setVisibility,
    sharedMembers,
    setSharedMembers,
    familyMembers,
    userProfile,
    activePickerType,
    setActivePickerType,
    showSharedPicker,
    setShowSharedPicker,
    selectedFullDate,
    formatDate,
    displayData,
    showAddCategoryModal,
    setShowAddCategoryModal,
    newCategoryName,
    setNewCategoryName,
    selectedCategoryColor,
    setSelectedCategoryColor,
    handleAddCategory,
    addingCategory,
    inputRef,
    allCategories,
  } = props;
  // Add this inside ItemModal component before return
  const otherMembers = familyMembers.filter((m) => m.id !== userProfile?.id);
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={closeModal}
    >
      <Pressable style={listStyles.overlay} onPress={closeModal}>
        {/* <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={listStyles.modalKeyboardAvoiding}
        > */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          style={listStyles.modalKeyboardAvoiding}
        >
          {/* <Animated.View
            style={[listStyles.sheet, { height: sheetHeight }]}
            onStartShouldSetResponder={() => true}
            onResponderRelease={(e) => e.stopPropagation()}
          > */}
          <Animated.View
            style={[
              listStyles.sheet,
              {
                height: sheetHeight,
                // Add maxHeight for iOS
                maxHeight:
                  Platform.OS === "ios" ? SCREEN_HEIGHT - 50 : undefined,
              },
            ]}
            onStartShouldSetResponder={() => true}
            onResponderRelease={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <View style={listStyles.dragHandleContainer}>
              <View style={listStyles.dragHandle} />
            </View>

            {/* Header */}
            <View style={listStyles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <AppText style={listStyles.modalTitle}>
                {editingItem ? "Edit Item" : "Add an item"}
              </AppText>
              <TouchableOpacity
                onPress={handleAddItem}
                disabled={!itemName.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons
                    name="checkmark"
                    size={24}
                    color={itemName.trim() ? COLORS.primary : COLORS.textMuted}
                  />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              style={listStyles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Title Input */}
              <View style={listStyles.inputRow}>
                <View style={listStyles.checkbox}>
                  <View style={listStyles.checkboxInner} />
                </View>
                <TextInput
                  ref={inputRef}
                  style={listStyles.titleInput}
                  placeholder="Title"
                  placeholderTextColor={COLORS.textMuted}
                  value={itemName}
                  onChangeText={setItemName}
                  onSubmitEditing={handleAddItem}
                  returnKeyType="done"
                />
              </View>

              {/* Expanded Content */}
              {isExpanded && (
                <View style={listStyles.expandedContent}>
                  {/* Visibility */}
                  <View style={listStyles.visibilityRow}>
                    <AppText style={listStyles.sectionLabel}>
                      Who can see this?
                    </AppText>
                    <View style={listStyles.visibilityToggleContainer}>
                      {[
                        { id: "private", icon: "lock-outline", label: "Me" },
                        {
                          id: "view",
                          icon: "eye-outline",
                          label: "View Only",
                        },
                        {
                          id: "shared",
                          icon: "account-multiple-outline",
                          label: "Can Edit",
                        },
                      ].map((opt) => {
                        const isActive = visibility === opt.id;
                        const isEveryoneSelected =
                          sharedMembers.length > 0 &&
                          sharedMembers.length ===
                            familyMembers.filter(
                              (m) => m.id !== userProfile?.id,
                            ).length;

                        let displayLabel = opt.label;
                        if (
                          isActive &&
                          (opt.id === "shared" || opt.id === "view")
                        ) {
                          if (isEveryoneSelected) {
                            displayLabel =
                              opt.id === "view" ? "View (All)" : "Shared (All)";
                          } else if (sharedMembers.length > 0) {
                            displayLabel = `${sharedMembers.length} Selected`;
                          }
                        }

                        return (
                          <TouchableOpacity
                            key={opt.id}
                            style={[
                              listStyles.visOption,
                              isActive && listStyles.visOptionActive,
                            ]}
                            onPress={() => {
                              setVisibility(opt.id as any);
                              if (opt.id === "shared" || opt.id === "view") {
                                setActivePickerType(opt.id);
                                setShowSharedPicker(true);
                              } else {
                                setSharedMembers([]);
                                setActivePickerType(null);
                              }
                            }}
                          >
                            <MaterialCommunityIcons
                              name={opt.icon as any}
                              size={18}
                              color={isActive ? "white" : COLORS.textSecondary}
                            />
                            <AppText
                              style={[
                                listStyles.visText,
                                {
                                  color: isActive
                                    ? "white"
                                    : COLORS.textSecondary,
                                },
                              ]}
                            >
                              {displayLabel}
                            </AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Quantity & Unit (Shopping only) */}
                  {tabType === "Shopping" && (
                    <View style={listStyles.inputGroupRow}>
                      <View
                        style={[
                          listStyles.optionRow,
                          { flex: 1, borderBottomWidth: 0 },
                        ]}
                      >
                        <View
                          style={[
                            listStyles.optionIcon,
                            { backgroundColor: "#1E3A8A" },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="numeric"
                            size={16}
                            color="white"
                          />
                        </View>
                        <TextInput
                          style={listStyles.optionText}
                          placeholder="Qty"
                          placeholderTextColor={COLORS.textMuted}
                          keyboardType="numeric"
                          value={quantity}
                          onChangeText={setQuantity}
                        />
                      </View>
                      <View
                        style={[
                          listStyles.optionRow,
                          { flex: 1.2, borderBottomWidth: 0 },
                        ]}
                      >
                        <View
                          style={[
                            listStyles.optionIcon,
                            { backgroundColor: "#1E3A8A" },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="scale"
                            size={16}
                            color="white"
                          />
                        </View>
                        <TextInput
                          style={listStyles.optionText}
                          placeholder="Unit (kg, ml...)"
                          placeholderTextColor={COLORS.textMuted}
                          value={unit}
                          onChangeText={setUnit}
                        />
                      </View>
                    </View>
                  )}

                  {/* Category (Shopping & To Do) */}
                  {(tabType === "Shopping" || tabType === "To Do") && (
                    <TouchableOpacity
                      style={listStyles.optionRow}
                      onPress={() => setShowCategoryPicker(true)}
                    >
                      <View
                        style={[
                          listStyles.optionIcon,
                          {
                            backgroundColor: selectedCat?.color || "#1E3A8A",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="tag"
                          size={16}
                          color="white"
                        />
                      </View>
                      <AppText style={listStyles.optionText}>
                        {selectedCat?.title || "General"}
                      </AppText>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  )}

                  {/* Assign To */}
                  <TouchableOpacity
                    style={listStyles.optionRow}
                    onPress={() => setShowAssignedPicker(true)}
                  >
                    <View
                      style={[
                        listStyles.avatarPlaceholder,
                        { backgroundColor: assignedTo?.color || "#1E3A8A" },
                      ]}
                    >
                      <AppText style={listStyles.avatarText}>
                        {assignedTo?.username?.charAt(0)?.toUpperCase() || "?"}
                      </AppText>
                    </View>
                    <AppText
                      style={[
                        listStyles.optionText,
                        !assignedTo && listStyles.optionPlaceholder,
                      ]}
                    >
                      {assignedTo?.username || "Assigned to"}
                    </AppText>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>

                  {/* Date */}
                  <TouchableOpacity
                    style={listStyles.optionRow}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <View
                      style={[
                        listStyles.optionIcon,
                        { backgroundColor: COLORS.textMuted },
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="white"
                      />
                    </View>
                    <AppText style={listStyles.optionText}>
                      {formatDate(selectedFullDate)}
                    </AppText>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>

                  {/* Note */}
                  <View style={listStyles.optionRow}>
                    <View
                      style={[
                        listStyles.optionIcon,
                        { backgroundColor: COLORS.textMuted },
                      ]}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color="white"
                      />
                    </View>
                    <TextInput
                      style={[listStyles.optionText, listStyles.noteInput]}
                      placeholder="Add note"
                      placeholderTextColor={COLORS.textMuted}
                      value={note}
                      onChangeText={setNote}
                      multiline
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Android Date Picker */}
            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={baseDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* iOS Date Picker Modal */}
            <Modal
              visible={showDatePicker && Platform.OS === "ios"}
              transparent
              animationType="fade"
            >
              <View style={listStyles.fullScreenOverlay}>
                <View style={listStyles.iosModalContent}>
                  <View style={listStyles.pickerHeader}>
                    <AppText style={{ fontWeight: "bold", fontSize: 18 }}>
                      Select Date
                    </AppText>
                  </View>
                  <View style={listStyles.datePickerWrapper}>
                    <DateTimePicker
                      value={baseDate}
                      mode="date"
                      display="inline"
                      onChange={onDateChange}
                      minimumDate={new Date()}
                      themeVariant="light"
                      style={{ width: "100%" }}
                    />
                  </View>
                  <View style={listStyles.pickerFooter}>
                    <TouchableOpacity
                      style={[listStyles.footerBtn, listStyles.cancelBtn]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <AppText style={listStyles.cancelBtnText}>Cancel</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[listStyles.footerBtn, listStyles.okBtn]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <AppText style={listStyles.okBtnText}>OK</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Category Picker */}
            <PickerModal
              visible={showCategoryPicker}
              title="Select Category"
              onClose={() => setShowCategoryPicker(false)}
            >
              {allCategories
                .filter((c: any) => c.tab_type === tabType)
                .map((cat) => {
                  const isSelected = selectedCat?.id === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        listStyles.pickerItem,
                        isSelected && { backgroundColor: "#F1F5F9" },
                        { flexDirection: "row", alignItems: "center" },
                      ]}
                      onPress={() => {
                        setSelectedCat(cat);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <View
                        style={[
                          listStyles.dot,
                          { backgroundColor: cat.color || "#1E3A8A" },
                        ]}
                      />
                      <AppText style={{ flex: 1 }}>{cat.title}</AppText>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color="#1E3A8A" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              <TouchableOpacity
                style={listStyles.addCategoryBtn}
                onPress={() => {
                  setShowCategoryPicker(false);
                  setShowAddCategoryModal(true);
                }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={COLORS.primary}
                />
                <AppText style={listStyles.addCategoryText}>
                  Add New Category
                </AppText>
              </TouchableOpacity>
            </PickerModal>

            {/* Share Picker */}
            {/* <Modal
              visible={showSharedPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowSharedPicker(false)}
            >
              <Pressable
                style={listStyles.pickerOverlay}
                onPress={() => setShowSharedPicker(false)}
              >
                <View style={listStyles.pickerContainer}>
                  <View style={listStyles.pickerHeader}>
                    <AppText style={listStyles.pickerTitle}>
                      {visibility === "view"
                        ? "View only with..."
                        : "Share with..."}
                    </AppText>
                    <TouchableOpacity
                      onPress={() => setShowSharedPicker(false)}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={listStyles.pickerList}>
                    <TouchableOpacity
                      style={[
                        listStyles.pickerItem,
                        sharedMembers.length === familyMembers.length &&
                          listStyles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        const otherMembers = familyMembers.filter(
                          (m) => m.id !== userProfile?.id,
                        );

                        if (sharedMembers.length === otherMembers.length) {
                          setSharedMembers([]);
                        } else {
                          setSharedMembers(otherMembers.map((m) => m.id));
                          setVisibility(activePickerType as any);
                        }
                      }}
                    >
                      <View
                        style={[
                          listStyles.avatarPlaceholder,
                          { backgroundColor: "#64748B" },
                        ]}
                      >
                        <Ionicons name="people" size={18} color="white" />
                      </View>
                      <AppText style={listStyles.pickerItemText}>
                        View All (Everyone)
                      </AppText>
                      {sharedMembers.length === familyMembers.length && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>

                    <View
                      style={{
                        height: 1,
                        backgroundColor: "#eee",
                        marginVertical: 8,
                      }}
                    />

                    {familyMembers
                      .filter((member) => member.id !== userProfile?.id)
                      .map((member) => {
                        const isSelected = sharedMembers.includes(member.id);
                        return (
                          <TouchableOpacity
                            key={member.id}
                            style={[
                              listStyles.pickerItem,
                              isSelected && listStyles.pickerItemSelected,
                            ]}
                            onPress={() => {
                              const updatedMembers = isSelected
                                ? sharedMembers.filter((id) => id !== member.id)
                                : [...sharedMembers, member.id];
                              setSharedMembers(updatedMembers);
                              setVisibility(
                                updatedMembers.length > 0
                                  ? (activePickerType as any)
                                  : "private",
                              );
                            }}
                          >
                            <View
                              style={[
                                listStyles.avatarPlaceholder,
                                { backgroundColor: member.color || "#1E3A8A" },
                              ]}
                            >
                              <AppText style={listStyles.avatarText}>
                                {member.username?.charAt(0).toUpperCase()}
                              </AppText>
                            </View>
                            <AppText style={listStyles.pickerItemText}>
                              {member.username}
                            </AppText>
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={20}
                                color={COLORS.primary}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>

                  <TouchableOpacity
                    style={[listStyles.createCategoryBtn, { margin: 15 }]}
                    onPress={() => {
                      setVisibility(
                        sharedMembers.length > 0
                          ? (activePickerType as any)
                          : "private",
                      );
                      setShowSharedPicker(false);
                    }}
                  >
                    <AppText style={listStyles.createCategoryBtnText}>
                      Done
                    </AppText>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal> */}
            <Modal
              visible={showSharedPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowSharedPicker(false)}
            >
              <Pressable
                style={listStyles.pickerOverlay}
                onPress={() => setShowSharedPicker(false)}
              >
                <View style={listStyles.pickerContainer}>
                  <View style={listStyles.pickerHeader}>
                    <AppText style={listStyles.pickerTitle}>
                      {visibility === "view"
                        ? "View only with..."
                        : visibility === "shared"
                          ? "Can Edit with..."
                          : "Share with..."}
                    </AppText>
                    <TouchableOpacity
                      onPress={() => setShowSharedPicker(false)}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={listStyles.pickerList}>
                    {/* Only show "Everyone" option for VIEW mode */}
                    {visibility === "view" && (
                      <>
                        <TouchableOpacity
                          style={[
                            listStyles.pickerItem,
                            sharedMembers.length === otherMembers.length &&
                              listStyles.pickerItemSelected,
                          ]}
                          onPress={() => {
                            const otherMembers = familyMembers.filter(
                              (m) => m.id !== userProfile?.id,
                            );
                            if (sharedMembers.length === otherMembers.length) {
                              setSharedMembers([]);
                            } else {
                              setSharedMembers(otherMembers.map((m) => m.id));
                              setVisibility(activePickerType as any);
                            }
                          }}
                        >
                          <View
                            style={[
                              listStyles.avatarPlaceholder,
                              { backgroundColor: "#64748B" },
                            ]}
                          >
                            <Ionicons name="people" size={18} color="white" />
                          </View>
                          <AppText style={listStyles.pickerItemText}>
                            View All (Everyone)
                          </AppText>
                          {sharedMembers.length === otherMembers.length && (
                            <Ionicons
                              name="checkmark-circle"
                              size={22}
                              color={COLORS.primary}
                            />
                          )}
                        </TouchableOpacity>

                        <View
                          style={{
                            height: 1,
                            backgroundColor: "#eee",
                            marginVertical: 8,
                          }}
                        />
                      </>
                    )}

                    {/* For SHARED mode - show explanation text */}
                    {visibility === "shared" && (
                      <View style={listStyles.infoBanner}>
                        <Ionicons
                          name="information-circle"
                          size={20}
                          color="#1E3A8A"
                        />
                        <AppText style={listStyles.infoBannerText}>
                          Selected members can edit this item
                        </AppText>
                      </View>
                    )}

                    {familyMembers
                      .filter((member) => member.id !== userProfile?.id)
                      .map((member) => {
                        const isSelected = sharedMembers.includes(member.id);
                        return (
                          <TouchableOpacity
                            key={member.id}
                            style={[
                              listStyles.pickerItem,
                              isSelected && listStyles.pickerItemSelected,
                            ]}
                            onPress={() => {
                              const updatedMembers = isSelected
                                ? sharedMembers.filter((id) => id !== member.id)
                                : [...sharedMembers, member.id];
                              setSharedMembers(updatedMembers);
                              setVisibility(
                                updatedMembers.length > 0
                                  ? (activePickerType as any)
                                  : "private",
                              );
                            }}
                          >
                            <View
                              style={[
                                listStyles.avatarPlaceholder,
                                { backgroundColor: member.color || "#1E3A8A" },
                              ]}
                            >
                              <AppText style={listStyles.avatarText}>
                                {member.username?.charAt(0).toUpperCase()}
                              </AppText>
                            </View>
                            <AppText style={listStyles.pickerItemText}>
                              {member.username}
                            </AppText>
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={20}
                                color={COLORS.primary}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>

                  <TouchableOpacity
                    style={[listStyles.createCategoryBtn, { margin: 15 }]}
                    onPress={() => {
                      setVisibility(
                        sharedMembers.length > 0
                          ? (activePickerType as any)
                          : "private",
                      );
                      setShowSharedPicker(false);
                    }}
                  >
                    <AppText style={listStyles.createCategoryBtnText}>
                      Done
                    </AppText>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
            {/* Assign To Picker */}
            {/* <PickerModal
              visible={showAssignedPicker}
              title="Assign To"
              onClose={() => setShowAssignedPicker(false)}
            >
              <TouchableOpacity
                style={[
                  listStyles.pickerItem,
                  !assignedTo && { backgroundColor: "#F1F5F9" },
                ]}
                onPress={() => {
                  setAssignedTo(null);
                  setShowAssignedPicker(false);
                }}
              >
                <View style={listStyles.avatarPlaceholder}>
                  <Ionicons name="person-outline" size={18} color="#64748B" />
                </View>
                <AppText style={{ flex: 1 }}>Unassigned</AppText>
                {!assignedTo && (
                  <Ionicons name="checkmark" size={20} color="#1E3A8A" />
                )}
              </TouchableOpacity>

              {familyMembers.map((member) => {
                const isSelected = assignedTo?.id === member.id;
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      listStyles.pickerItem,
                      isSelected && { backgroundColor: "#F1F5F9" },
                    ]}
                    onPress={() => {
                      setAssignedTo(member);
                      setShowAssignedPicker(false);
                    }}
                  >
                    <View
                      style={[
                        listStyles.avatarPlaceholder,
                        { backgroundColor: member.color || "#1E3A8A" },
                      ]}
                    >
                      <AppText style={listStyles.avatarText}>
                        {member.username?.charAt(0).toUpperCase()}
                      </AppText>
                    </View>
                    <AppText style={{ flex: 1 }}>{member.username}</AppText>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#1E3A8A" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </PickerModal> */}
            {/* Assign To Picker */}
            <PickerModal
              visible={showAssignedPicker}
              title="Assign To"
              onClose={() => setShowAssignedPicker(false)}
            >
              <TouchableOpacity
                style={[
                  listStyles.pickerItem,
                  !assignedTo && { backgroundColor: "#F1F5F9" },
                ]}
                onPress={() => {
                  setAssignedTo(null);
                  setShowAssignedPicker(false);
                }}
              >
                <View style={listStyles.avatarPlaceholder}>
                  <Ionicons name="person-outline" size={18} color="#64748B" />
                </View>
                <AppText style={{ flex: 1 }}>Unassigned</AppText>
                {!assignedTo && (
                  <Ionicons name="checkmark" size={20} color="#1E3A8A" />
                )}
              </TouchableOpacity>

              {/* Show Owner (current user) first with highlight */}
              {userProfile && (
                <TouchableOpacity
                  style={[
                    listStyles.pickerItem,
                    assignedTo?.id === userProfile.id && {
                      backgroundColor: "#EFF6FF",
                    },
                    listStyles.ownerItem,
                  ]}
                  onPress={() => {
                    setAssignedTo(userProfile);
                    setShowAssignedPicker(false);
                  }}
                >
                  <View
                    style={[
                      listStyles.avatarPlaceholder,
                      { backgroundColor: "#1E3A8A" },
                    ]}
                  >
                    <AppText style={listStyles.avatarText}>
                      {userProfile.username?.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <AppText
                    style={[listStyles.pickerItemText, listStyles.ownerText]}
                  >
                    {userProfile.username} (Me - Owner)
                  </AppText>
                  {assignedTo?.id === userProfile.id && (
                    <Ionicons name="checkmark" size={20} color="#1E3A8A" />
                  )}
                </TouchableOpacity>
              )}

              {/* Show other family members (excluding owner) */}
              {familyMembers
                .filter((member) => member.id !== userProfile?.id)
                .map((member) => {
                  const isSelected = assignedTo?.id === member.id;
                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        listStyles.pickerItem,
                        isSelected && { backgroundColor: "#F1F5F9" },
                      ]}
                      onPress={() => {
                        setAssignedTo(member);
                        setShowAssignedPicker(false);
                      }}
                    >
                      <View
                        style={[
                          listStyles.avatarPlaceholder,
                          { backgroundColor: member.color || "#1E3A8A" },
                        ]}
                      >
                        <AppText style={listStyles.avatarText}>
                          {member.username?.charAt(0).toUpperCase()}
                        </AppText>
                      </View>
                      <AppText style={{ flex: 1 }}>{member.username}</AppText>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color="#1E3A8A" />
                      )}
                    </TouchableOpacity>
                  );
                })}
            </PickerModal>

            {/* Add Category Modal */}
            <Modal
              visible={showAddCategoryModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowAddCategoryModal(false)}
            >
              <Pressable
                style={listStyles.pickerOverlay}
                onPress={() => setShowAddCategoryModal(false)}
              >
                <View
                  style={[
                    listStyles.pickerContainer,
                    listStyles.addCategoryModal,
                  ]}
                >
                  <View style={listStyles.pickerHeader}>
                    <AppText style={listStyles.pickerTitle}>
                      New Category
                    </AppText>
                    <TouchableOpacity
                      onPress={() => setShowAddCategoryModal(false)}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={listStyles.addCategoryContent}>
                    <View style={listStyles.categoryPreview}>
                      <View
                        style={[
                          listStyles.previewDot,
                          { backgroundColor: selectedCategoryColor },
                        ]}
                      />
                      <AppText style={listStyles.previewText}>
                        {newCategoryName || "Category Name"}
                      </AppText>
                    </View>

                    <TextInput
                      style={listStyles.categoryNameInput}
                      placeholder="Enter category name"
                      placeholderTextColor={COLORS.textMuted}
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      autoFocus
                    />

                    <AppText style={listStyles.colorPickerLabel}>
                      Choose Color
                    </AppText>
                    <View style={listStyles.colorPicker}>
                      {CATEGORY_COLORS.map((color) => (
                        <TouchableOpacity
                          key={color}
                          style={[
                            listStyles.colorOption,
                            { backgroundColor: color },
                            selectedCategoryColor === color &&
                              listStyles.colorOptionSelected,
                          ]}
                          onPress={() => setSelectedCategoryColor(color)}
                        >
                          {selectedCategoryColor === color && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="white"
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[
                        listStyles.createCategoryBtn,
                        !newCategoryName.trim() &&
                          listStyles.createCategoryBtnDisabled,
                      ]}
                      onPress={handleAddCategory}
                      disabled={!newCategoryName.trim() || addingCategory}
                    >
                      {addingCategory ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <AppText style={listStyles.createCategoryBtnText}>
                          Create Category
                        </AppText>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            </Modal>
          </Animated.View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};
export const listStyles = StyleSheet.create({
  suggestionChip: {
    backgroundColor: "#F8FAFC", // Lighter, cleaner background
    borderRadius: 10, // Slightly less rounded for a modern look
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0", // Subtle border
    flexDirection: "row",
    alignItems: "center",
  },
  chipText: {
    color: "#475569", // Slate gray for a softer feel
    fontSize: 13,
    fontWeight: "600",
  },
  ctaBtn: {
    marginTop: 24,
    backgroundColor: "#1E3A8A",
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    // Soft Shadow/Elevation
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  ownerItem: {
    borderWidth: 1,
    borderColor: "#1E3A8A20",
    backgroundColor: "#EFF6FF",
    marginBottom: 8,
  },
  ownerText: {
    fontWeight: "600",
    color: "#1E3A8A",
  },
  infoBannerText: {
    fontSize: 13,
    color: "#1E3A8A",
    fontWeight: "500",
    flex: 1,
  },
  ctaBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  premiumEmptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "white",
    borderRadius: 24, // Card-like feel
    marginHorizontal: 16,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E3A8A",
    marginTop: 16,
    textAlign: "center",
  },
  premiumSubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  //   ctaBtnText: { color: "white", fontWeight: "600", fontSize: 15 },
  dot: { width: 16, height: 16, borderRadius: 8, marginRight: 12 },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
    gap: 10,
  },
  datePickerWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  okBtn: { backgroundColor: "#1E3A8A" },
  cancelBtnText: { color: "#4B5563", fontWeight: "600", fontSize: 16 },
  okBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  iosModalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
    width: "100%",
  },
  // sheet: {
  //   backgroundColor: "white",
  //   borderTopLeftRadius: 25,
  //   borderTopRightRadius: 25,
  //   paddingBottom: 40,
  //   width: "100%",
  // },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: Platform.OS === "ios" ? 50 : 40, // More padding for iOS
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  //   premiumEmptyContainer: {
  //     flex: 1,
  //     alignItems: "center",
  //     justifyContent: "center",
  //     backgroundColor: "#FFFFFF",
  //   },
  contentBox: { width: "85%", alignItems: "center", padding: 20 },
  inputGroupRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  noteInput: { flex: 1, paddingTop: 0, textAlignVertical: "center" },
  glowCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  innerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  //   premiumTitle: {
  //     fontSize: 24,
  //     fontWeight: "900",
  //     color: "#1E293B",
  //     marginBottom: 10,
  //     letterSpacing: -0.5,
  //   },
  //   premiumSubtitle: {
  //     fontSize: 16,
  //     color: "#64748B",
  //     textAlign: "center",
  //     lineHeight: 24,
  //     paddingHorizontal: 10,
  //     marginBottom: 40,
  //   },
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, paddingBottom: 100 },
  itemsContainer: { paddingTop: 5, paddingBottom: 10 },
  emptyStateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    marginTop: 5,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalKeyboardAvoiding: { width: "100%" },
  dragHandleContainer: { alignItems: "center", paddingVertical: 12 },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: Platform.OS === "ios" ? 8 : 0, // Add top padding for iOS

    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: { fontSize: 17, fontWeight: "600", color: COLORS.text },
  content: { flexGrow: 1, paddingHorizontal: 16 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxInner: { width: 12, height: 12, borderRadius: 3 },
  titleInput: { flex: 1, fontSize: 17, color: COLORS.text, padding: 0 },
  expandedContent: { paddingTop: 8 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  optionIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionText: { flex: 1, fontSize: 16, color: COLORS.text },
  optionPlaceholder: { color: COLORS.textMuted },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    width: SCREEN_WIDTH - 48,
    maxHeight: SCREEN_HEIGHT * 0.5,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    padding: 16,
  },
  pickerTitle: { fontSize: 18, fontWeight: "600", color: COLORS.text },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: { fontSize: 12, fontWeight: "700" },
  pickerList: { paddingHorizontal: 8, paddingVertical: 8 },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  pickerItemSelected: { backgroundColor: COLORS.primary + "10" },
  pickerItemText: { flex: 1, fontSize: 16, color: COLORS.text },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: { color: "white", fontSize: 14, fontWeight: "600" },
  addCategoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 10,
  },
  addCategoryText: { fontSize: 16, color: COLORS.primary, fontWeight: "500" },
  addCategoryModal: { maxHeight: SCREEN_HEIGHT * 0.6 },
  addCategoryContent: { padding: 20 },
  categoryPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewDot: { width: 24, height: 24, borderRadius: 12, marginRight: 12 },
  previewText: { fontSize: 16, fontWeight: "500", color: COLORS.text },
  categoryNameInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
  },
  colorPickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createCategoryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  createCategoryBtnDisabled: { backgroundColor: COLORS.textMuted },
  createCategoryBtnText: { color: "white", fontSize: 16, fontWeight: "600" },
  visibilityRow: { marginTop: 15, marginBottom: 10 },
  sectionLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    marginLeft: 5,
  },
  visibilityToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
  },
  visOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  visOptionActive: { backgroundColor: "#1E3A8A" },
  visText: { fontSize: 13, fontWeight: "500" },
  memberCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  avatarLetter: { color: "white", fontSize: 14, fontWeight: "bold" },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    borderLeftWidth: 4,
    paddingLeft: 10,
  },
  memberName: { fontSize: 16, fontWeight: "700", color: "#1E3A8A" },
  emptyMemberText: {
    fontSize: 13,
    color: "#94A3B8",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },

  // Bulk Actions Bar
  bulkActionsBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 6,
    marginTop: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bulkBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    gap: 7,
  },
  bulkBtnActive: { backgroundColor: "#EFF6FF" },
  bulkIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  bulkIconWrapActive: { backgroundColor: "#1E3A8A" },
  bulkBtnText: { fontSize: 12, fontWeight: "700", color: "#1E3A8A" },
  bulkDivider: { width: 1, height: 32, backgroundColor: "#E2E8F0" },

  // Meal Sync Modal
  syncModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  syncModalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  syncModalSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  syncSelectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
  },
  syncSelectLabel: { fontSize: 13, color: COLORS.textSecondary },
  syncSelectAllText: { fontSize: 13, fontWeight: "600", color: "#1E3A8A" },
  syncMealItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  syncMealItemSelected: { backgroundColor: "#EFF6FF" },
  syncMealInfo: { flex: 1 },
  syncMealTitle: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  syncMealIngCount: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  syncCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  syncCheckboxActive: { backgroundColor: "#1E3A8A", borderColor: "#1E3A8A" },
  syncModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  // Add to listStyles
  choresHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  choresListContent: {
    padding: 16,
    paddingBottom: 100,
  },

  tabIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  tabTitle: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
  tabSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
});
export default ItemModal;
