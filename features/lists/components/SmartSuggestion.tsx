import { ScrollView, TouchableOpacity } from "react-native";
import { styles } from "./AnimatedFAB";
import { AppText } from "../../../src/components/AppText";

import { Ionicons } from "@expo/vector-icons";

// Smart Suggestions Component
interface SmartSuggestionsProps {
  tabType: string;
  onSelectSuggestion: (suggestion: string) => void;
}

export const SmartSuggestions = ({
  tabType,
  onSelectSuggestion,
}: SmartSuggestionsProps) => {
  const suggestions: Record<string, string[]> = {
    Shopping: ["Milk", "Bread", "Eggs", "Vegetables"],
    Chores: ["Clean kitchen", "Take out trash", "Water plants"],
    "To Do": ["Call plumber", "Pay bills", "Schedule meeting"],
  };

  const currentSuggestions = suggestions[tabType] || suggestions["Shopping"];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.suggestionsContainer}
    >
      {currentSuggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          style={styles.suggestionItem}
          onPress={() => onSelectSuggestion(suggestion)}
        >
          <Ionicons name="bulb-outline" size={16} color="#1E3A8A" />
          <AppText style={styles.suggestionText}>{suggestion}</AppText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
