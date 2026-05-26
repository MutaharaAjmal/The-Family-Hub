import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../../src/components/AppText";
import { supabase } from "../../src/api/supabase";
import { useAppStore } from "../../src/store/useAppStore";
import { useRouter } from "expo-router";
import { AppHeader } from "../../src/components/AppHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { getRecipeFromAI } from "../../features/recipes/services/recipeAi"; // Make sure path is correct

const PRIMARY_BLUE = "#1E3A8A";

export default function MagicChefScreen() {
  const router = useRouter();
  const { shoppingData, familyId } = useAppStore();

  const [availableIngredients, setAvailableIngredients] = useState<string[]>(
    [],
  );
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [matchingRecipes, setMatchingRecipes] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // 1. Load ingredients from shopping list
  useEffect(() => {
    const ings = shoppingData.flatMap((cat) =>
      cat.items.map((i: any) => i.name),
    );
    // Remove duplicates and clean names
    const uniqueIngs = [...new Set(ings.map((i) => i.trim()))].filter(Boolean);
    setAvailableIngredients(uniqueIngs);
  }, [shoppingData]);

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name],
    );
  };

  // 2. Logic to find local recipes
  const findMatches = async () => {
    if (selectedIngredients.length === 0) return;
    setSearching(true);
    setMatchingRecipes([]);

    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("family_id", familyId);

      if (error) throw error;

      if (data) {
        const matches = data.filter((recipe) => {
          const recipeIngs = recipe.ingredients?.toLowerCase() || "";
          // Return true if ANY selected ingredient is in the recipe
          return selectedIngredients.some((si) =>
            recipeIngs.includes(si.toLowerCase()),
          );
        });

        setMatchingRecipes(matches);

        // Agar koi match na miley toh AI ka option dein
        if (matches.length === 0) {
          handleNoMatches();
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not search recipes.");
    } finally {
      setSearching(false);
    }
  };

  const handleNoMatches = () => {
    Alert.alert(
      "No Match Found 🔍",
      "No similar recipes were found in your recipe book. Would you like to consult the AI Assistant?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Ask AI Chef 🪄",
          onPress: askAIChef,
        },
      ],
    );
  };

  // 3. AI Logic
  const askAIChef = async () => {
    setSearching(true);
    try {
      const prompt = `I have these ingredients: ${selectedIngredients.join(", ")}. Suggest a delicious recipe. Give me a title, ingredients list, and clear instructions.`;

      const aiResult = await getRecipeFromAI(prompt);

      if (aiResult) {
        Alert.alert("AI Found a Recipe! ✨", `How about "${aiResult.title}"?`, [
          {
            text: "Add to My Book",
            onPress: () => {
              router.push({
                pathname: "/meals/add-recipe",
                params: {
                  prefill: JSON.stringify(aiResult),
                },
              });
            },
          },
          { text: "Not interested", style: "destructive" },
        ]);
      }
    } catch (err) {
      Alert.alert("AI Error", "Chef is currently busy. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: PRIMARY_BLUE }}
      edges={["top"]}
    >
      <AppHeader title="Magic Chef Mode" />
      <View style={styles.container}>
        <View style={styles.headerBox}>
          <AppText style={styles.header}>What's in your fridge? 🪄</AppText>
          <AppText style={styles.subHeader}>
            Select ingredients to see what you can cook.
          </AppText>
        </View>

        {/* Scrollable Chips */}
        <View style={{ maxHeight: 200 }}>
          <ScrollView
            contentContainerStyle={styles.chipContainer}
            showsVerticalScrollIndicator={false}
          >
            {availableIngredients.length > 0 ? (
              availableIngredients.map((ing) => (
                <TouchableOpacity
                  key={ing}
                  style={[
                    styles.chip,
                    selectedIngredients.includes(ing) && styles.chipSelected,
                  ]}
                  onPress={() => toggleIngredient(ing)}
                >
                  <AppText
                    style={[
                      styles.chipText,
                      selectedIngredients.includes(ing) &&
                        styles.chipTextSelected,
                    ]}
                  >
                    {ing}
                  </AppText>
                </TouchableOpacity>
              ))
            ) : (
              <AppText style={styles.emptyText}>
                Your shopping list is empty.
              </AppText>
            )}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[
            styles.searchBtn,
            selectedIngredients.length === 0 && { opacity: 0.5 },
          ]}
          onPress={findMatches}
          disabled={selectedIngredients.length === 0 || searching}
        >
          {searching ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#FFF" />
              <AppText style={styles.searchBtnText}>Magic Search</AppText>
            </>
          )}
        </TouchableOpacity>

        <FlatList
          data={matchingRecipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recipeCard}
              onPress={() => router.push(`/meals/${item.id}`)}
            >
              <View style={styles.recipeIcon}>
                <Ionicons name="restaurant" size={20} color={PRIMARY_BLUE} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.recipeTitle}>{item.title}</AppText>
                <AppText style={styles.recipeCategory} numberOfLines={1}>
                  {item.category || "General"} •{" "}
                  {item.ingredients?.substring(0, 30)}...
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  headerBox: { marginBottom: 15 },
  header: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  subHeader: { fontSize: 14, color: "#64748B" },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipSelected: { backgroundColor: PRIMARY_BLUE, borderColor: PRIMARY_BLUE },
  chipText: { color: "#475569", fontWeight: "600", fontSize: 13 },
  chipTextSelected: { color: "#FFF" },
  searchBtn: {
    backgroundColor: PRIMARY_BLUE,
    padding: 16,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginVertical: 15,
    elevation: 4,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  searchBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  recipeCard: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  recipeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recipeTitle: { fontWeight: "700", color: "#1E293B", fontSize: 15 },
  recipeCategory: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#94A3B8",
    width: "100%",
  },
});
