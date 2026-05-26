// import React, { useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   ActivityIndicator,
//   Alert,
// } from "react-native";
// import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { supabase } from "../../src/api/supabase";
// import { AppHeader } from "../../src/components/AppHeader";
// import Toast from "react-native-toast-message";
// import { useAppStore } from "../../src/store/useAppStore";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Analytics } from "../../src/utils/Analytics";

// export default function SelectRecipeScreen() {
//   const { date, type } = useLocalSearchParams();
//   const [activeTab, setActiveTab] = useState("MY_RECIPES");
//   const [selectingId, setSelectingId] = useState<string | null>(null);
//   const router = useRouter();
//   const {
//     userRecipes,
//     globalRecipes,
//     loading,
//     fetchSelectRecipeData,
//     familyId,
//     userProfile,
//   } = useAppStore();

//   const PRIMARY_BLUE = "#1E3A8A";

//   useFocusEffect(
//     useCallback(() => {
//       if (familyId) fetchSelectRecipeData();
//     }, [familyId]),
//   );

//   // Auto-switch to Recommended tab if My Recipes is empty
//   useFocusEffect(
//     useCallback(() => {
//       if (!loading && activeTab === "MY_RECIPES" && userRecipes.length === 0) {
//         setActiveTab("DISCOVER");
//       }
//     }, [loading, userRecipes.length, activeTab]),
//   );

//   const selectRecipeForDay = async (recipe: any) => {
//     if (!familyId) return;
//     setSelectingId(recipe.id);

//     try {
//       let finalId = recipe.id;

//       // Agar Recommended tab se hai toh copy create karein
//       if (activeTab === "DISCOVER") {
//         const { data: newRec, error: copyErr } = await supabase
//           .from("recipes")
//           .insert([
//             {
//               title: recipe.title,
//               instructions: recipe.instructions,
//               image_url: recipe.image_url,
//               ingredients: recipe.ingredients,
//               family_id: familyId,
//               created_by: userProfile?.id,
//             },
//           ])
//           .select()
//           .single();

//         if (copyErr) throw copyErr;
//         finalId = newRec.id;
//       }

//       // Meal Plan Update/Insert
//       const { error } = await supabase.from("meal_plans").insert({
//         family_id: familyId,
//         meal_date: date,
//         recipe_id: finalId,
//         meal_type: type,
//         created_by: userProfile?.id,
//       });

//       if (error) throw error;

//       Analytics.Meal.addedToPlanner({
//         recipe_title: recipe.title,
//         meal_type: type as "Breakfast" | "Lunch" | "Dinner",
//         meal_date: date as string,
//         is_global_recipe: !recipe.family_id,
//       });

//       Toast.show({
//         type: "success",
//         text1: "Meal Planned! 🍴",
//         text2: `${recipe.title} set for ${date}`,
//       });

//       notifyFamily(recipe.title, date as string);

//       setTimeout(() => router.back(), 1500);
//     } catch (error: any) {
//       setSelectingId(null);
//       Alert.alert("Error", error.message);
//     }
//   };

//   const notifyFamily = async (recipeTitle: string, mealDate: string) => {
//     try {
//       if (!familyId || !userProfile) return;

//       const { data: members } = await supabase
//         .from("profiles")
//         .select("id, expo_push_token")
//         .eq("family_id", familyId)
//         .not("expo_push_token", "is", null);

//       if (members && members.length > 0) {
//         const displayName = userProfile.username || "Someone";
//         const title = "New meal planned 🍴";
//         const body = `${displayName} planned "${recipeTitle}" for ${mealDate}`;

//         const historyEntries = members.map((m) => ({
//           user_id: m.id,
//           family_id: familyId,
//           title: title,
//           body: body,
//           status: "unread",
//         }));
//         await supabase.from("notifications_history").insert(historyEntries);

//         const pushMessages = members.map((m) => ({
//           to: m.expo_push_token,
//           sound: "default",
//           title: "🍴 New Meal Planned!",
//           body: body,
//           priority: "high",
//         }));

//         await fetch("https://exp.host/--/api/v2/push/send", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(pushMessages),
//         });
//       }
//     } catch (error) {
//       console.error("Notify Error:", error);
//     }
//   };

//   const currentData = activeTab === "MY_RECIPES" ? userRecipes : globalRecipes;

//   // Get icon based on recipe type
//   const getRecipeIcon = (recipe: any) => {
//     if (activeTab === "MY_RECIPES") {
//       return "book-outline";
//     }
//     return "star-outline";
//   };

//   const getRecipeIconColor = (recipe: any) => {
//     if (activeTab === "MY_RECIPES") {
//       return "#3B82F6";
//     }
//     return "#F59E0B";
//   };

//   return (
//     <SafeAreaView
//       style={{ flex: 1, backgroundColor: "#1E3A8A" }}
//       edges={["left", "right", "top"]}
//     >
//       <AppHeader title={`Plan for ${date}`} />
//       <View style={styles.container}>
//         <View style={styles.tabBar}>
//           <TouchableOpacity
//             style={[
//               styles.tabItem,
//               activeTab === "MY_RECIPES" && styles.activeTabItem,
//             ]}
//             onPress={() => setActiveTab("MY_RECIPES")}
//           >
//             <Text
//               style={[
//                 styles.tabText,
//                 activeTab === "MY_RECIPES" && styles.activeTabText,
//               ]}
//             >
//               My Recipes
//             </Text>
//             {userRecipes.length > 0 && (
//               <View style={styles.badge}>
//                 <Text style={styles.badgeText}>{userRecipes.length}</Text>
//               </View>
//             )}
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               styles.tabItem,
//               activeTab === "DISCOVER" && styles.activeTabItem,
//             ]}
//             onPress={() => setActiveTab("DISCOVER")}
//           >
//             <Text
//               style={[
//                 styles.tabText,
//                 activeTab === "DISCOVER" && styles.activeTabText,
//               ]}
//             >
//               Recommended
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {loading && currentData.length === 0 ? (
//           <ActivityIndicator
//             color={PRIMARY_BLUE}
//             size="large"
//             style={{ marginTop: 50 }}
//           />
//         ) : (
//           <FlatList
//             data={currentData}
//             keyExtractor={(item) => item.id}
//             contentContainerStyle={{ padding: 20 }}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={[
//                   styles.recipeCard,
//                   selectingId === item.id && styles.selectedCard,
//                 ]}
//                 onPress={() => selectRecipeForDay(item)}
//                 disabled={selectingId !== null}
//               >
//                 {/* Side Icon */}
//                 <View style={styles.iconWrapper}>
//                   <Ionicons
//                     name={getRecipeIcon(item)}
//                     size={28}
//                     color={getRecipeIconColor(item)}
//                   />
//                 </View>

//                 <View style={styles.cardContent}>
//                   <Text style={styles.recipeTitle}>{item.title}</Text>
//                   <Text style={styles.recipeTag}>
//                     {activeTab === "MY_RECIPES"
//                       ? "👨‍👩‍👧 Family Recipe"
//                       : "⭐ Chef's Choice"}
//                   </Text>
//                   {item.ingredients && (
//                     <Text style={styles.ingredientsCount} numberOfLines={1}>
//                       🥗{" "}
//                       {typeof item.ingredients === "string"
//                         ? item.ingredients.split(",").length
//                         : item.ingredients?.length || 0}{" "}
//                       ingredients
//                     </Text>
//                   )}
//                 </View>
//                 {selectingId === item.id ? (
//                   <ActivityIndicator size="small" color={PRIMARY_BLUE} />
//                 ) : (
//                   <Ionicons
//                     name="add-circle-outline"
//                     size={26}
//                     color={PRIMARY_BLUE}
//                   />
//                 )}
//               </TouchableOpacity>
//             )}
//             ListEmptyComponent={
//               !loading ? (
//                 <View style={styles.emptyContainer}>
//                   <Ionicons
//                     name="restaurant-outline"
//                     size={60}
//                     color="#CBD5E1"
//                   />
//                   <Text style={styles.emptyTitle}>No Recipes Found</Text>
//                   <Text style={styles.emptySubtitle}>
//                     {activeTab === "MY_RECIPES"
//                       ? "You haven't added any recipes yet"
//                       : "No recommended recipes available"}
//                   </Text>

//                   {/* Two Buttons */}
//                   <View style={styles.emptyButtonsContainer}>
//                     <TouchableOpacity
//                       style={[styles.emptyBtn, styles.addRecipeBtn]}
//                       onPress={() => router.push("/meals/add-recipe")}
//                     >
//                       <Ionicons
//                         name="add-circle-outline"
//                         size={20}
//                         color="#FFF"
//                       />
//                       <Text style={styles.emptyBtnText}>Add Recipe</Text>
//                     </TouchableOpacity>

//                     {activeTab === "MY_RECIPES" && (
//                       <TouchableOpacity
//                         style={[styles.emptyBtn, styles.browseBtn]}
//                         onPress={() => setActiveTab("DISCOVER")}
//                       >
//                         <Ionicons
//                           name="compass-outline"
//                           size={20}
//                           color="#1E3A8A"
//                         />
//                         <Text
//                           style={[styles.emptyBtnText, { color: "#1E3A8A" }]}
//                         >
//                           Browse Recommended
//                         </Text>
//                       </TouchableOpacity>
//                     )}
//                   </View>
//                 </View>
//               ) : null
//             }
//           />
//         )}
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F8FAFC" },
//   tabBar: {
//     flexDirection: "row",
//     backgroundColor: "#FFF",
//     borderBottomWidth: 1,
//     borderBottomColor: "#E2E8F0",
//   },
//   tabItem: {
//     flex: 1,
//     paddingVertical: 15,
//     alignItems: "center",
//     borderBottomWidth: 3,
//     borderBottomColor: "transparent",
//     flexDirection: "row",
//     justifyContent: "center",
//     gap: 8,
//   },
//   activeTabItem: { borderBottomColor: "#1E3A8A" },
//   tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
//   activeTabText: { color: "#1E3A8A" },
//   badge: {
//     backgroundColor: "#EFF6FF",
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 12,
//   },
//   badgeText: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#1E3A8A",
//   },
//   recipeCard: {
//     backgroundColor: "#FFF",
//     borderRadius: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 14,
//     marginBottom: 12,
//     elevation: 2,
//     borderWidth: 1,
//     borderColor: "#F1F5F9",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//   },
//   selectedCard: { borderColor: "#1E3A8A", backgroundColor: "#F0F4FF" },
//   iconWrapper: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: "#EFF6FF",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 14,
//   },
//   cardContent: { flex: 1 },
//   recipeTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
//   recipeTag: { fontSize: 12, color: "#64748B", marginTop: 2 },
//   ingredientsCount: {
//     fontSize: 11,
//     color: "#94A3B8",
//     marginTop: 4,
//   },
//   emptyContainer: {
//     alignItems: "center",
//     marginTop: 80,
//     paddingHorizontal: 30,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#1E293B",
//     marginTop: 16,
//   },
//   emptySubtitle: {
//     color: "#64748B",
//     marginTop: 8,
//     textAlign: "center",
//     lineHeight: 20,
//     marginBottom: 24,
//   },
//   emptyButtonsContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "center",
//     gap: 12,
//     marginTop: 8,
//   },
//   emptyBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     paddingHorizontal: 18,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },
//   addRecipeBtn: {
//     backgroundColor: "#1E3A8A",
//   },
//   browseBtn: {
//     backgroundColor: "#EFF6FF",
//     borderWidth: 1,
//     borderColor: "#1E3A8A",
//   },
//   emptyBtnText: {
//     color: "#FFF",
//     fontWeight: "600",
//     fontSize: 14,
//   },
// });

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/api/supabase";
import { AppHeader } from "../../src/components/AppHeader";
import Toast from "react-native-toast-message";
import { useAppStore } from "../../src/store/useAppStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { Analytics } from "../../src/utils/Analytics";

export default function SelectRecipeScreen() {
  const { date, type } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("MY_RECIPES");
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const router = useRouter();
  const {
    userRecipes,
    globalRecipes,
    loading,
    fetchSelectRecipeData,
    familyId,
    userProfile,
  } = useAppStore();

  const PRIMARY_BLUE = "#1E3A8A";

  useFocusEffect(
    useCallback(() => {
      if (familyId) fetchSelectRecipeData();
    }, [familyId]),
  );

  // NO AUTO-SWITCH - User ko khud decision lene dena
  // useFocusEffect removed

  const selectRecipeForDay = async (recipe: any) => {
    if (!familyId) return;
    setSelectingId(recipe.id);

    try {
      let finalId = recipe.id;

      // Agar Recommended tab se hai toh copy create karein
      if (activeTab === "DISCOVER") {
        const { data: newRec, error: copyErr } = await supabase
          .from("recipes")
          .insert([
            {
              title: recipe.title,
              instructions: recipe.instructions,
              image_url: recipe.image_url,
              ingredients: recipe.ingredients,
              family_id: familyId,
              created_by: userProfile?.id,
            },
          ])
          .select()
          .single();

        if (copyErr) throw copyErr;
        finalId = newRec.id;
      }

      // Meal Plan Update/Insert
      const { error } = await supabase.from("meal_plans").insert({
        family_id: familyId,
        meal_date: date,
        recipe_id: finalId,
        meal_type: type,
        created_by: userProfile?.id,
      });

      if (error) throw error;

      Analytics.Meal.addedToPlanner({
        recipe_title: recipe.title,
        meal_type: type as "Breakfast" | "Lunch" | "Dinner",
        meal_date: date as string,
        is_global_recipe: !recipe.family_id,
      });

      Toast.show({
        type: "success",
        text1: "Meal Planned! 🍴",
        text2: `${recipe.title} set for ${date}`,
      });

      notifyFamily(recipe.title, date as string);

      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      setSelectingId(null);
      Alert.alert("Error", error.message);
    }
  };

  const notifyFamily = async (recipeTitle: string, mealDate: string) => {
    try {
      if (!familyId || !userProfile) return;

      const { data: members } = await supabase
        .from("profiles")
        .select("id, expo_push_token")
        .eq("family_id", familyId)
        .not("expo_push_token", "is", null);

      if (members && members.length > 0) {
        const displayName = userProfile.username || "Someone";
        const title = "New meal planned 🍴";
        const body = `${displayName} planned "${recipeTitle}" for ${mealDate}`;

        const historyEntries = members.map((m) => ({
          user_id: m.id,
          family_id: familyId,
          title: title,
          body: body,
          status: "unread",
        }));
        await supabase.from("notifications_history").insert(historyEntries);

        const pushMessages = members.map((m) => ({
          to: m.expo_push_token,
          sound: "default",
          title: "🍴 New Meal Planned!",
          body: body,
          priority: "high",
        }));

        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pushMessages),
        });
      }
    } catch (error) {
      console.error("Notify Error:", error);
    }
  };

  const currentData = activeTab === "MY_RECIPES" ? userRecipes : globalRecipes;

  // Get color for the left bar (same as Recipe Book)
  const getBarColor = () => {
    return PRIMARY_BLUE;
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1E3A8A" }}
      edges={["left", "right", "top"]}
    >
      <AppHeader title={`Plan for ${date}`} />
      <View style={styles.container}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "MY_RECIPES" && styles.activeTabItem,
            ]}
            onPress={() => setActiveTab("MY_RECIPES")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "MY_RECIPES" && styles.activeTabText,
              ]}
            >
              My Recipes
            </Text>
            {userRecipes.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{userRecipes.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "DISCOVER" && styles.activeTabItem,
            ]}
            onPress={() => setActiveTab("DISCOVER")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "DISCOVER" && styles.activeTabText,
              ]}
            >
              Recommended
            </Text>
          </TouchableOpacity>
        </View>

        {loading && currentData.length === 0 ? (
          <ActivityIndicator
            color={PRIMARY_BLUE}
            size="large"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.recipeCard,
                  selectingId === item.id && styles.selectedCard,
                ]}
                onPress={() => selectRecipeForDay(item)}
                disabled={selectingId !== null}
              >
                {/* Blue bar line - same as Recipe Book */}
                <View
                  style={[
                    styles.categoryStrip,
                    { backgroundColor: getBarColor() },
                  ]}
                />

                <View style={styles.cardContent}>
                  <Text style={styles.recipeTitle}>{item.title}</Text>
                  <Text style={styles.recipeTag}>
                    {activeTab === "MY_RECIPES"
                      ? "👨‍👩‍👧 Family Recipe"
                      : "⭐ Chef's Choice"}
                  </Text>
                  {item.ingredients && (
                    <Text style={styles.ingredientsCount} numberOfLines={1}>
                      🥗{" "}
                      {typeof item.ingredients === "string"
                        ? item.ingredients.split(",").length
                        : item.ingredients?.length || 0}{" "}
                      ingredients
                    </Text>
                  )}
                </View>
                {selectingId === item.id ? (
                  <ActivityIndicator size="small" color={PRIMARY_BLUE} />
                ) : (
                  <Ionicons
                    name="add-circle-outline"
                    size={26}
                    color={PRIMARY_BLUE}
                  />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons
                      name="restaurant-outline"
                      size={50}
                      color={PRIMARY_BLUE}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>No Recipes Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {activeTab === "MY_RECIPES"
                      ? "You haven't added any recipes yet"
                      : "No recommended recipes available"}
                  </Text>

                  {/* Two Buttons - User ko khud select karne dena */}
                  <View style={styles.emptyButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.emptyBtn, styles.addRecipeBtn]}
                      onPress={() => router.push("/meals/add-recipe")}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={18}
                        color="#FFF"
                      />
                      <Text style={styles.addRecipeBtnText}>Add Recipe</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.emptyBtn, styles.browseBtn]}
                      onPress={() => setActiveTab("DISCOVER")}
                    >
                      <Ionicons
                        name="compass-outline"
                        size={18}
                        color={PRIMARY_BLUE}
                      />
                      <Text style={styles.browseBtnText}>
                        Browse Recommended
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabItem: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  activeTabItem: { borderBottomColor: "#1E3A8A" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "#1E3A8A" },
  badge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  recipeCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  selectedCard: { borderColor: "#1E3A8A", backgroundColor: "#F0F4FF" },
  categoryStrip: {
    width: 4,
    height: "70%",
    borderRadius: 2,
    marginRight: 15,
  },
  cardContent: { flex: 1 },
  recipeTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  recipeTag: { fontSize: 12, color: "#64748B", marginTop: 2 },
  ingredientsCount: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginTop: 16,
  },
  emptySubtitle: {
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addRecipeBtn: {
    backgroundColor: "#1E3A8A",
  },
  addRecipeBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  browseBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#1E3A8A",
  },
  browseBtnText: {
    color: "#1E3A8A",
    fontWeight: "600",
    fontSize: 14,
  },
});
