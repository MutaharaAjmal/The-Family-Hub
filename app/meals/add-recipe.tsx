import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router"; // 👈 Update this
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/api/supabase";
import { AppHeader } from "../../src/components/AppHeader";
import { useAppStore } from "../../src/store/useAppStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { Analytics } from "../../src/utils/Analytics";

export default function AddRecipeScreen() {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams(); // 👈 Params uthayein
  const { familyId, userProfile, fetchRecipes } = useAppStore();
  const PRIMARY_BLUE = "#1E3A8A";
  const ACCENT_ORANGE = "#FF9500";
  const isUrdu = (text: string) => /[\u0600-\u06FF]/.test(text);

  useEffect(() => {
    if (params.prefill) {
      try {
        const data = JSON.parse(params.prefill as string);
        if (data.title) setTitle(data.title);

        // Agar ingredients array hai toh line break ke sath join karein
        if (data.ingredients) {
          const ingText = Array.isArray(data.ingredients)
            ? data.ingredients.join("\n")
            : data.ingredients;
          setIngredients(ingText);
        }

        // Instructions handle karein
        if (data.instructions) {
          const instText = Array.isArray(data.instructions)
            ? data.instructions.join("\n")
            : data.instructions;
          setInstructions(instText);
        }
      } catch (e) {
        console.error("Failed to parse prefill data", e);
      }
    }
  }, [params.prefill]);
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a recipe name");
      return;
    }
    if (!familyId) {
      Alert.alert("Error", "No family found.");
      return;
    }

    setLoading(true);
    try {
      const recipeData = {
        title: title.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        created_by: userProfile?.id,
      };

      // 🚀 1. Pehla Insert: User ki apni family ke liye
      const { data: newRecipeData, error: familyError } = await supabase
        .from("recipes")
        .insert({
          ...recipeData,
          family_id: familyId,
        })
        .select()
        .single();

      if (familyError) throw familyError;
      if (newRecipeData) {
        useAppStore.getState().setJustAddedRecipeId(newRecipeData.id);
      }
      // 🚀 2. Doosra Insert: Global Recommendations ke liye (Sab families ke liye)
      // Isme 'family_id' nahi jayegi taake ye sabko nazar aaye
      const recipeToShare = {
        title: title.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        category: "Community",
        original_creator: userProfile?.username || "Anonymous",
      };

      console.log("Attempting to share:", recipeToShare);

      const { error: globalError } = await supabase
        .from("recommended_recipes")
        .insert(recipeToShare);

      if (globalError) Alert.alert("Global Save Failed", globalError.message);
      Analytics.Recipe.addedManual({ recipe_title: title });
      // await fetchRecipes();

      Alert.alert(
        "Success! 🍳",
        "Recipe added and shared with the community!",
        [{ text: "Awesome", onPress: () => router.replace("/meals/recipes") }],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1E3A8A" }}
      edges={["left", "right", "top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <AppHeader title="New Recipe" />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NAME</Text>
            <TextInput
              // style={styles.input}
              style={[
                styles.input,
                { textAlign: isUrdu(title) ? "right" : "left" }, // Dynamic alignment
              ]}
              placeholder="e.g. Grandma's Apple Pie"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Ingredients Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>INGREDIENTS (OPTIONAL)</Text>
            <TextInput
              // style={[styles.input, styles.textArea]}
              style={[
                styles.input,
                styles.textArea,
                { textAlign: isUrdu(ingredients) ? "right" : "left" },
              ]}
              placeholder="+ Add ingredients (one per line)"
              value={ingredients}
              onChangeText={setIngredients}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Preparation Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PREPARATION (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { height: 150 }]}
              placeholder="Step by step instructions..."
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                styles.saveBtn,
                { backgroundColor: PRIMARY_BLUE },
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Recipe</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 20 },
  inputGroup: { marginBottom: 25 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 15,
  },
  btn: {
    flex: 1,
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtn: {
    elevation: 4,
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  cancelBtn: { backgroundColor: "#F1F5F9" },
  cancelBtnText: { color: "#64748B", fontSize: 16, fontWeight: "600" },
});
