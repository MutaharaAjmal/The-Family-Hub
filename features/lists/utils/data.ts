import { Ionicons } from "@expo/vector-icons";

// 1. Define the Interface
interface EmptyState {
  // Using 'keyof typeof Ionicons.glyphMap' ensures only valid icon names are used
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  tips: string[];
  cta: string;
}

// 2. Define the Config with English Content
export const EMPTY_STATE_CONFIG: Record<string, EmptyState> = {
  Shopping: {
    icon: "cart",
    title: "Your Shopping List is Empty",
    subtitle: "Track your grocery items and household essentials here.",
    tips: ["Fresh vegetables", "Weekly snacks", "Dairy items"],
    cta: "Add First Item",
  },
  "To Do": {
    icon: "checkmark-circle",
    title: "No Tasks Found",
    subtitle: "Organize your family's shared goals and daily tasks.",
    tips: ["School assignments", "Bill payments", "Weekend plans"],
    cta: "Add a Task",
  },
  Chores: {
    icon: "home",
    title: "No Chores for Today",
    subtitle: "Daily family chores and responsibilities will appear here.",
    tips: ["Wash the dishes", "Clean the living room", "Do the laundry"],
    cta: "Assign a Chore",
  },
};
