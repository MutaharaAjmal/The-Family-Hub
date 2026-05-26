import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/api/supabase";
import { AppHeader } from "../../src/components/AppHeader";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form States
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  const PRIMARY_BLUE = "#1E3A8A";
  const isUrdu = (text: string) => /[\u0600-\u06FF]/.test(text);

  useEffect(() => {
    fetchRecipeDetails();
  }, [id]);

  async function fetchRecipeDetails() {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setTitle(data.title);
        setIngredients(data.ingredients || "");
        setInstructions(data.instructions || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("recipes")
      .update({ title, ingredients, instructions })
      .eq("id", id);

    setLoading(false);
    if (!error) {
      setIsEditing(false);
      Alert.alert("Success", "Recipe updated!");
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete Recipe", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("recipes")
            .delete()
            .eq("id", id);
          if (!error) router.back();
        },
      },
    ]);
  };

  if (loading && !isEditing) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: PRIMARY_BLUE }}
      edges={["top"]}
    >
      <AppHeader
        title={isEditing ? "Edit Recipe" : "Recipe Details"}
        rightIconName={isEditing ? "checkmark" : "create-outline"}
        onRightIconPress={() =>
          isEditing ? handleUpdate() : setIsEditing(true)
        }
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Title Section */}
          <View style={styles.section}>
            <Text style={styles.label}>NAME</Text>
            {isEditing ? (
              <TextInput
                // style={styles.input}
                style={[
                  styles.input,
                  { textAlign: isUrdu(title) ? "right" : "left" },
                ]}
                value={title}
                onChangeText={setTitle}
              />
            ) : (
              <Text
                style={[
                  styles.valueText,
                  { textAlign: isUrdu(title) ? "right" : "left" },
                ]}
              >
                {title}
              </Text>
            )}
          </View>

          {/* Ingredients Section */}
          {/* <View style={styles.section}>
            <Text style={styles.label}>INGREDIENTS</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={ingredients}
                onChangeText={setIngredients}
                multiline
              />
            ) : (
              <Text style={styles.valueText}>
                {ingredients || "No ingredients listed."}
              </Text>
            )}
          </View> */}
          {/* Ingredients Section */}
          <View style={styles.section}>
            <Text style={styles.label}>INGREDIENTS</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={ingredients}
                onChangeText={setIngredients}
                multiline
                placeholder="Enter ingredients (one per line)"
              />
            ) : (
              <View style={styles.ingredientsList}>
                {ingredients ? (
                  // String ko lines mein split karke list banayein
                  ingredients.split(/\n|,/).map((item, index) => {
                    const trimmedItem = item.trim();
                    if (!trimmedItem) return null; // Khali lines ko skip karein
                    const isContentUrdu = isUrdu(trimmedItem); // Check if this line is Urdu
                    return (
                      <View
                        key={index}
                        //  style={styles.ingredientRow}
                        style={[
                          styles.ingredientRow,
                          {
                            flexDirection: isContentUrdu
                              ? "row-reverse"
                              : "row",
                          }, // Change order
                        ]}
                      >
                        <Ionicons
                          name="radio-button-on"
                          size={8}
                          color={PRIMARY_BLUE}
                          style={{ marginTop: 8 }}
                        />

                        {/* <Text style={styles.ingredientText}> */}
                        <Text
                          style={[
                            styles.ingredientText,
                            { textAlign: isContentUrdu ? "right" : "left" }, // Align text
                          ]}
                        >
                          {trimmedItem}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.valueText}>No ingredients listed.</Text>
                )}
              </View>
            )}
          </View>
          {/* Instructions Section */}
          <View style={styles.section}>
            <Text style={styles.label}>PREPARATION</Text>
            {isEditing ? (
              <TextInput
                // style={[styles.input, styles.textArea]}
                style={[
                  styles.input,
                  styles.textArea,
                  { textAlign: isUrdu(instructions) ? "right" : "left" },
                ]}
                value={instructions}
                onChangeText={setInstructions}
                multiline
              />
            ) : (
              <Text
                style={[
                  styles.valueText,
                  { textAlign: isUrdu(instructions) ? "right" : "left" },
                ]}
              >
                {" "}
                {instructions || "No steps provided."}
              </Text>
            )}
          </View>

          {/* Delete Button (Only shown when not editing) */}
          {!isEditing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Delete Recipe</Text>
            </TouchableOpacity>
          )}

          {isEditing && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel Editing</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ingredientsList: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  ingredientText: {
    fontSize: 16,
    color: "#1E293B",
    lineHeight: 22,
    flex: 1,
  },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20 },
  section: { marginBottom: 25 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
    letterSpacing: 1,
  },
  valueText: {
    fontSize: 16,
    color: "#1E293B",
    lineHeight: 24,
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  textArea: { minHeight: 120, textAlignVertical: "top" },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    padding: 15,
    marginBottom: 50, // <-- Isay barha kar 50 ya 60 kar dein
    backgroundColor: "#FEE2E2", // Halka background taake button wazeh dikhe
    borderRadius: 12,
  },
  deleteBtnText: { color: "#EF4444", fontWeight: "700", marginLeft: 8 },
  cancelBtn: { alignItems: "center", marginTop: 10, padding: 10 },
  cancelBtnText: { color: "#64748B", fontWeight: "600" },
});
