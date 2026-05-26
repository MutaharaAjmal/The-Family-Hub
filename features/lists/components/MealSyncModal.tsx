import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { listStyles } from "./ItemModal";
import { AppText } from "../../../src/components/AppText";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../../src/constants/theme";

interface MealSyncProps {
  isVisible: boolean;
  onClose: () => void;
  availableMeals: any[];
  selectedMealIds: string[];
  setSelectedMealIds: React.Dispatch<React.SetStateAction<string[]>>;
  syncLoading: boolean;
  lastSyncTime: string | number | Date | null;
  formatSyncTime: (time: any) => string;
  generateFromMealPlan: () => void;
}
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MealSyncModal = ({
  isVisible,
  onClose,
  availableMeals,
  selectedMealIds,
  setSelectedMealIds,
  syncLoading,
  lastSyncTime,
  formatSyncTime,
  generateFromMealPlan,
}: MealSyncProps) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={listStyles.pickerOverlay} onPress={onClose}>
        <View
          style={[
            listStyles.pickerContainer,
            { maxHeight: SCREEN_HEIGHT * 0.65, padding: 0 },
          ]}
        >
          {/* Header */}
          <View style={listStyles.syncModalHeader}>
            <View>
              <AppText style={listStyles.syncModalTitle}>Meal Sync 🍽️</AppText>
              <AppText style={listStyles.syncModalSubtitle}>
                Last: {formatSyncTime(lastSyncTime)}
              </AppText>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Select All / Deselect All */}
          <View style={listStyles.syncSelectAllRow}>
            <AppText style={listStyles.syncSelectLabel}>
              {selectedMealIds.length} of {availableMeals.length} meals selected
            </AppText>
            <TouchableOpacity
              onPress={() =>
                setSelectedMealIds(
                  selectedMealIds.length === availableMeals.length
                    ? []
                    : availableMeals.map((m) => m.id),
                )
              }
            >
              <AppText style={listStyles.syncSelectAllText}>
                {selectedMealIds.length === availableMeals.length
                  ? "Deselect All"
                  : "Select All"}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Meals List */}
          <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.35 }}>
            {availableMeals.map((meal) => {
              const isSelected = selectedMealIds.includes(meal.id);
              return (
                <TouchableOpacity
                  key={meal.id}
                  style={[
                    listStyles.syncMealItem,
                    isSelected && listStyles.syncMealItemSelected,
                  ]}
                  onPress={() =>
                    setSelectedMealIds((prev) =>
                      prev.includes(meal.id)
                        ? prev.filter((id) => id !== meal.id)
                        : [...prev, meal.id],
                    )
                  }
                >
                  <View style={listStyles.syncMealInfo}>
                    <AppText style={listStyles.syncMealTitle}>
                      {meal.title}
                    </AppText>
                    <AppText style={listStyles.syncMealIngCount}>
                      {meal.ingredients.length} ingredients
                    </AppText>
                  </View>
                  <View
                    style={[
                      listStyles.syncCheckbox,
                      isSelected && listStyles.syncCheckboxActive,
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Sync Button */}
          <View style={listStyles.syncModalFooter}>
            <TouchableOpacity
              style={[
                listStyles.createCategoryBtn,
                selectedMealIds.length === 0 &&
                  listStyles.createCategoryBtnDisabled,
              ]}
              onPress={generateFromMealPlan}
              disabled={selectedMealIds.length === 0 || syncLoading}
            >
              {syncLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <AppText style={listStyles.createCategoryBtnText}>
                  Sync {selectedMealIds.length} Meal
                  {selectedMealIds.length !== 1 ? "s" : ""}
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};
export default MealSyncModal;
