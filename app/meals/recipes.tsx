// import React, { useState, useCallback, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   TextInput,
//   ActivityIndicator,
//   Alert,
//   Modal,
// } from "react-native";
// import { useFocusEffect, useRouter } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import * as ImagePicker from "expo-image-picker";
// import {
//   SafeAreaView,
//   useSafeAreaInsets,
// } from "react-native-safe-area-context";
// import { AppHeader } from "../../src/components/AppHeader";
// import { AppText } from "../../src/components/AppText";
// import { useAppStore } from "../../src/store/useAppStore";
// import { supabase } from "../../src/api/supabase";
// import {
//   AIRecipeResult,
//   getRecipeFromAI,
//   isValidUrl,
// } from "../../features/recipes/services/recipeAi";
// import { RecipeSkeletonList } from "../../features/recipes/components/RecipeSkeleton";
// import { Analytics } from "../../src/utils/Analytics";
// import { DeleteLoader } from "../../src/components/DeleteLoader";

// const PRIMARY_BLUE = "#1E3A8A";

// export default function RecipeBookScreen() {
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const { recipes, loading, fetchRecipes, familyId } = useAppStore();
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [search, setSearch] = useState("");
//   const [isImporting, setIsImporting] = useState(false);
//   const [showMenu, setShowMenu] = useState(false);
//   const [showLinkModal, setShowLinkModal] = useState(false);
//   const [urlInput, setUrlInput] = useState("");
//   const [urlError, setUrlError] = useState("");

//   const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
//   // const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
//   // 🚀 1. State ko array mein tabdeel karein
//   const [selectedIds, setSelectedIds] = useState<string[]>([]);
//   useEffect(() => {
//     if (search.length > 2) {
//       const timer = setTimeout(() => {
//         Analytics.Recipe.searched({
//           query: search,
//           results_count: filteredRecipes.length,
//         });
//       }, 1000); // 1 second wait karein typing rukne ka
//       return () => clearTimeout(timer);
//     }
//   }, [search]);
//   // 🚀 2. Toggle Selection Function
//   const toggleSelection = (id: string) => {
//     setSelectedIds(
//       (prev) =>
//         prev.includes(id)
//           ? prev.filter((item) => item !== id) // Agar pehle se hai to nikal do
//           : [...prev, id], // Warna add kar do
//     );
//   };
//   useFocusEffect(
//     useCallback(() => {
//       // Ab fetchRecipes yahan se hata diya kyunki real-time useEffect handles it
//       return () => {
//         setNewlyAddedId(null);
//         setSelectedIds([]);
//       };
//     }, []),
//   );

//   // 🔥 RECIPES REAL-TIME ENGINE (WITH REAL-TIME DELETE FIX)
//   useEffect(() => {
//     if (!familyId) return;

//     // Pehle data fetch karein
//     fetchRecipes();

//     // Supabase Real-time Channel
//     const recipeChannel = supabase
//       .channel("recipe-realtime-updates")
//       .on(
//         "postgres_changes",
//         {
//           event: "*", // Insert, Update, Delete sab listen karega
//           schema: "public",
//           table: "recipes",
//           filter: `family_id=eq.${familyId}`,
//         },
//         (payload) => {
//           console.log("Real-time recipe change caught!", payload.eventType);

//           if (payload.eventType === "DELETE") {
//             // 🚀 Agar delete hua hai, toh fetchRecipes call karne ke sath-sath
//             // direct store/state se bhi filter out karwa dein taake screen se foran hat jaye
//             useAppStore.setState((state) => ({
//               recipes: state.recipes.filter((r) => r.id !== payload.old.id),
//             }));
//           } else {
//             // INSERT ya UPDATE ke waqt fresh data fetch karein
//             fetchRecipes();
//           }
//         },
//       )
//       .subscribe();

//     // Cleanup
//     return () => {
//       supabase.removeChannel(recipeChannel);
//     };
//   }, [familyId]);

//   const filteredRecipes = recipes
//     .sort(
//       (a, b) =>
//         new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
//     )
//     .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()));

//   // ─── HELPERS ───────────────────────────────────────────────────────────────
//   const isUrdu = (text: string) => {
//     const urduPattern = /[\u0600-\u06FF]/;
//     return urduPattern.test(text);
//   };
//   const isRecentlyAdded = (createdAt: string, id: string) => {
//     if (id === newlyAddedId) return true;
//     const now = new Date().getTime();
//     const recipeTime = new Date(createdAt).getTime();
//     return now - recipeTime < 60000;
//   };
//   const handleDeleteMultiple = async () => {
//     if (selectedIds.length === 0) return;

//     // 1. Pehle check karo — kya koi selected recipe meal planner mein hai?
//     const { data: usedInPlanner } = await supabase
//       .from("meal_plans")
//       .select("recipe_id, meal_date, meal_type")
//       .in("recipe_id", selectedIds);

//     if (usedInPlanner && usedInPlanner.length > 0) {
//       // Meal planner mein hai — user ko batao
//       Alert.alert(
//         // "Recipe Already In Use ⚠️",
//         `${usedInPlanner.length} Recipe currently in used`,
//         `Do You want to delete it from meal planner?`,
//         [
//           { text: "Cancel", style: "cancel" },

//           {
//             text: " Delete ",
//             style: "destructive",
//             onPress: () => performDelete(true), // meal_plans bhi hatao
//           },
//         ],
//       );
//     } else {
//       // Planner mein nahi — seedha confirm karo
//       Alert.alert(
//         "Delete Recipes",
//         `Are you sure you want to delete ${selectedIds.length} recipe(s)?`,
//         [
//           { text: "Cancel", style: "cancel" },
//           {
//             text: "Delete",
//             style: "destructive",
//             onPress: () => performDelete(false),
//           },
//         ],
//       );
//     }
//   };

//   const performDelete = async (alsoRemoveFromPlanner: boolean) => {
//     setIsDeleting(true); // 🚀 Loading Shuru
//     try {
//       // Agar user chahta hai to meal_plans se bhi hatao
//       if (alsoRemoveFromPlanner) {
//         await supabase.from("meal_plans").delete().in("recipe_id", selectedIds);
//       }

//       // Recipe delete karo
//       const { error } = await supabase
//         .from("recipes")
//         .delete()
//         .in("id", selectedIds);

//       if (error) throw error;
//       Analytics.Recipe.deleted({
//         recipe_count: selectedIds.length,
//         also_removed_from_planner: alsoRemoveFromPlanner,
//       });
//       setSelectedIds([]);
//       fetchRecipes();
//     } catch (err) {
//       Alert.alert("Error", "Could not delete recipes.");
//     } finally {
//       setIsDeleting(false); // 🚀 Loading Khatam
//     }
//   };

//   const saveRecipeToDB = async (
//     aiResult: AIRecipeResult | null,
//     source?: string,
//   ) => {
//     if (!aiResult) {
//       Alert.alert(
//         "AI Error",
//         "Could not extract recipe. Try a different link or image.",
//       );
//       setIsImporting(false);
//       return;
//     }

//     try {
//       // 🚀 1. Pehla Insert: User ki apni family ke liye (recipes table)
//       const { data, error } = await supabase
//         .from("recipes")
//         .insert([
//           {
//             title: aiResult.title || "AI Recipe",
//             family_id: familyId,
//             ingredients: aiResult.ingredients,
//             instructions: aiResult.instructions,
//             source_url: source || "AI Scan",
//           },
//         ])
//         .select()
//         .single();

//       if (error) throw error;

//       // 🚀 2. Doosra Insert: Global Recommendations ke liye (Sab families ke liye)
//       // Ye wahi logic hai jo aapne Manual Add mein likha tha
//       const recipeToShare = {
//         title: aiResult.title || "AI Recipe",
//         ingredients: aiResult.ingredients,
//         instructions: aiResult.instructions,
//         category: "Community",
//         original_creator: "AI Chef Scan", // Ya userProfile?.username agar store se mil jaye
//       };

//       const { error: globalError } = await supabase
//         .from("recommended_recipes")
//         .insert(recipeToShare);

//       if (globalError) {
//         console.error("Global Save Failed:", globalError.message);
//         // Hum alert nahi de rahe taake user ka experience kharab na ho agar global save fail ho jaye
//       }
//       if (source === "AI Scan" || source === "Image Scan") {
//         Analytics.Recipe.addedViaScan({ recipe_title: aiResult.title });
//       } else if (isValidUrl(source || "")) {
//         Analytics.Recipe.addedViaLink({
//           recipe_title: aiResult.title,
//           source_url: source || "",
//         });
//       } else {
//         Analytics.Recipe.addedManual({ recipe_title: aiResult.title });
//       }
//       await fetchRecipes();
//       Alert.alert(
//         "Success ✨",
//         `"${aiResult.title}" added to your recipe book and shared!`,
//         [
//           {
//             text: "View",
//             onPress: () => data && router.push(`/meals/${data.id}`),
//           },
//           { text: "OK" },
//         ],
//       );
//     } catch (err) {
//       console.error(err);
//       Alert.alert("Error", "Failed to save recipe. Please try again.");
//     } finally {
//       setIsImporting(false);
//       setUrlInput("");
//       setUrlError("");
//     }
//   };

//   // ─── HANDLERS ──────────────────────────────────────────────────────────────

//   const handleLinkImport = async () => {
//     const trimmed = urlInput.trim();

//     if (!trimmed) {
//       setUrlError("Please enter a URL.");
//       return;
//     }
//     if (!isValidUrl(trimmed)) {
//       setUrlError("Please enter a valid URL (https://...)");
//       return;
//     }

//     setUrlError("");
//     setShowLinkModal(false);
//     setIsImporting(true);

//     const result = await getRecipeFromAI(trimmed);
//     await saveRecipeToDB(result, trimmed);
//   };

//   const handleImageScan = async () => {
//     setShowMenu(false);

//     const { status } = await ImagePicker.requestCameraPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert(
//         "Permission Denied",
//         "Camera access is needed to scan dishes.",
//       );
//       return;
//     }

//     const result = await ImagePicker.launchCameraAsync({
//       base64: true,
//       quality: 0.5,
//     });

//     if (!result.canceled && result.assets[0].base64) {
//       setIsImporting(true);
//       const aiResult = await getRecipeFromAI(
//         undefined,
//         result.assets[0].base64,
//       );
//       await saveRecipeToDB(aiResult, "Image Scan");
//     }
//   };

//   const handleManualAdd = () => {
//     setShowMenu(false);
//     router.push("/meals/add-recipe");
//   };

//   const handleOpenLinkModal = () => {
//     setShowMenu(false);
//     setUrlInput("");
//     setUrlError("");
//     setShowLinkModal(true);
//   };

//   // ─── RENDER ────────────────────────────────────────────────────────────────

//   return (
//     <SafeAreaView
//       style={{ flex: 1, backgroundColor: PRIMARY_BLUE }}
//       edges={["top", "left"]}
//     >
//       {/* <AppHeader title="Recipe Book" /> */}
//       <AppHeader
//         // Title mein count dikhayein
//         title={
//           selectedIds.length > 0
//             ? `${selectedIds.length} Selected`
//             : "Recipe Book"
//         }
//         rightIconName={selectedIds.length > 0 ? "trash-outline" : undefined}
//         onRightIconPress={
//           selectedIds.length > 0 ? handleDeleteMultiple : undefined
//         }
//         leftIconName={selectedIds.length > 0 ? "close" : undefined}
//         onLeftIconPress={
//           selectedIds.length > 0 ? () => setSelectedIds([]) : undefined
//         }
//       />
//       {/* <AppHeader
//         title={selectedRecipeId ? "Recipe Selected" : "Recipe Book"}
//         rightIconName={selectedRecipeId ? "trash-outline" : undefined}
//         onRightIconPress={selectedRecipeId ? handleDeleteRecipe : undefined}
//         // Agar selection mode mein ho toh back arrow ki jagah cancel icon dikhane ke liye:
//         leftIconName={selectedRecipeId ? "close" : undefined}
//         onLeftIconPress={
//           selectedRecipeId ? () => setSelectedRecipeId(null) : undefined
//         }
//       /> */}
//       <View style={styles.container}>
//         {/* Search Bar */}
//         <View style={styles.searchSection}>
//           <View style={styles.searchContainer}>
//             <Ionicons name="search" size={20} color="#94A3B8" />
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Search recipes..."
//               placeholderTextColor="#94A3B8"
//               value={search}
//               onChangeText={setSearch}
//             />
//             {search.length > 0 && (
//               <TouchableOpacity onPress={() => setSearch("")}>
//                 <Ionicons name="close-circle" size={20} color="#94A3B8" />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//         <TouchableOpacity
//           style={{
//             backgroundColor: "#EFF6FF",
//             margin: 20,
//             padding: 15,
//             borderRadius: 15,
//             flexDirection: "row",
//             alignItems: "center",
//             borderWidth: 1,
//             borderColor: "#BFDBFE",
//           }}
//           onPress={() => router.push("/meals/magic-chef")}
//         >
//           <View
//             style={{
//               backgroundColor: PRIMARY_BLUE,
//               padding: 8,
//               borderRadius: 10,
//               marginRight: 12,
//             }}
//           >
//             <Ionicons name="sparkles" size={20} color="white" />
//           </View>
//           <View>
//             <AppText style={{ fontWeight: "700", color: "#1E3A8A" }}>
//               Magic Chef Mode
//             </AppText>
//             <AppText style={{ fontSize: 12, color: "#64748B" }}>
//               Find recipes with items you already have
//             </AppText>
//           </View>
//         </TouchableOpacity>
//         {/* Importing overlay */}
//         {isImporting && (
//           <View style={styles.importingBanner}>
//             <ActivityIndicator size="small" color={PRIMARY_BLUE} />
//             <AppText style={styles.importingText}>
//               AI is reading the recipe...
//             </AppText>
//           </View>
//         )}
//         {/* Recipe List */}
//         {loading && recipes.length === 0 ? (
//           <RecipeSkeletonList />
//         ) : (
//           <FlatList
//             data={filteredRecipes}
//             keyExtractor={(item) => item.id}
//             contentContainerStyle={[
//               styles.listContent,
//               { paddingBottom: insets.bottom + 60 },
//             ]}
//             showsVerticalScrollIndicator={false}
//             renderItem={({ item }) => {
//               // const isNew = isRecentlyAdded(item.created_at);
//               const isNew = isRecentlyAdded(item.created_at, item.id);
//               const isSelected = selectedIds.includes(item.id);
//               return (
//                 <TouchableOpacity
//                   // style={styles.recipeCard}
//                   style={[
//                     styles.recipeCard,
//                     isNew && styles.recentHighlight, // Highlight Style
//                     isSelected && styles.selectedCard, // Selection Style
//                   ]}
//                   // onPress={() => router.push(`/meals/${item.id}`)}
//                   onPress={() => {
//                     if (selectedIds.length > 0) {
//                       toggleSelection(item.id); // Agar selection mode on hai to toggle karein
//                     } else {
//                       Analytics.Recipe.viewed({
//                         recipe_title: item.title,
//                         recipe_id: item.id,
//                       });
//                       router.push(`/meals/${item.id}`);
//                     }
//                   }}
//                   onLongPress={() => toggleSelection(item.id)} // Long press se selection shuru
//                   // onLongPress={() => setSelectedRecipeId(item.id)} // 🚀 Trigger Selection
//                   activeOpacity={0.75}
//                 >
//                   {isNew && !isSelected && (
//                     <View style={styles.newBadge}>
//                       <AppText style={styles.newBadgeText}>JUST ADDED</AppText>
//                     </View>
//                   )}

//                   {isSelected && (
//                     <View style={styles.selectionCheck}>
//                       <Ionicons
//                         name="checkmark-circle"
//                         size={24}
//                         color={PRIMARY_BLUE}
//                       />
//                     </View>
//                   )}

//                   <View
//                     style={[
//                       styles.categoryStrip,
//                       { backgroundColor: PRIMARY_BLUE },
//                     ]}
//                   />

//                   <View style={styles.recipeInfo}>
//                     <AppText
//                       style={[
//                         styles.recipeTitle,
//                         {
//                           textAlign: isUrdu(item.title || "")
//                             ? "right"
//                             : "left",
//                           writingDirection: isUrdu(item.title || "")
//                             ? "rtl"
//                             : "ltr",
//                         },
//                       ]}
//                     >
//                       {item.title}
//                     </AppText>
//                     {/* <View style={styles.metaRow}> */}
//                     <View
//                       style={[
//                         styles.metaRow,
//                         {
//                           flexDirection: isUrdu(item.title || "")
//                             ? "row-reverse"
//                             : "row",
//                         }, // Icon ki position theek karne ke liye
//                       ]}
//                     >
//                       <Ionicons
//                         name="restaurant-outline"
//                         size={13}
//                         color="#94A3B8"
//                       />
//                       <AppText
//                         // style={styles.recipeMeta}
//                         style={[
//                           styles.recipeMeta,
//                           {
//                             textAlign: isUrdu(item.title || "")
//                               ? "right"
//                               : "left",
//                           },
//                         ]}
//                         numberOfLines={1}
//                       >
//                         {item.ingredients || "View preparation steps"}
//                       </AppText>
//                     </View>
//                   </View>
//                   {/* <View style={styles.arrowContainer}>
//                     <Ionicons
//                       name="chevron-forward"
//                       size={17}
//                       color={PRIMARY_BLUE}
//                     />
//                   </View> */}
//                 </TouchableOpacity>
//               );
//             }}
//             ListEmptyComponent={
//               !loading ? (
//                 <View style={styles.emptyContainer}>
//                   <View style={styles.emptyIconCircle}>
//                     <Ionicons
//                       name="restaurant-outline"
//                       size={40}
//                       color={PRIMARY_BLUE}
//                     />
//                   </View>
//                   <AppText style={styles.emptyTitle}>No Recipes Yet</AppText>
//                   <AppText style={styles.emptySubtitle}>
//                     Add manually, import via link, or scan a dish with AI.
//                   </AppText>
//                   <TouchableOpacity
//                     style={styles.addRecipeBtn}
//                     onPress={() => setShowMenu(true)}
//                   >
//                     <Ionicons name="add" size={18} color="#FFF" />
//                     <AppText style={styles.addRecipeBtnText}>
//                       Add Your First Recipe
//                     </AppText>
//                   </TouchableOpacity>
//                 </View>
//               ) : null
//             }
//           />
//         )}
//         {/* ── MODAL: Add Options Menu ── */}
//         <Modal
//           visible={showMenu}
//           transparent
//           animationType="fade"
//           onRequestClose={() => setShowMenu(false)}
//         >
//           <TouchableOpacity
//             style={styles.modalOverlay}
//             activeOpacity={1}
//             onPress={() => setShowMenu(false)}
//           >
//             <View style={styles.menuContainer}>
//               <AppText style={styles.menuTitle}>Add New Recipe</AppText>

//               {[
//                 {
//                   icon: "create-outline",
//                   label: "Manual Add",
//                   onPress: handleManualAdd,
//                 },
//                 {
//                   icon: "link-outline",
//                   label: "Import via Link",
//                   onPress: handleOpenLinkModal,
//                 },
//                 {
//                   icon: "camera-outline",
//                   label: "Scan Dish (AI Chef Eye)",
//                   onPress: handleImageScan,
//                 },
//               ].map((item, i, arr) => (
//                 <TouchableOpacity
//                   key={item.label}
//                   style={[
//                     styles.menuItem,
//                     i === arr.length - 1 && { borderBottomWidth: 0 },
//                   ]}
//                   onPress={item.onPress}
//                 >
//                   <View style={styles.menuIconWrap}>
//                     <Ionicons
//                       name={item.icon as any}
//                       size={20}
//                       color={PRIMARY_BLUE}
//                     />
//                   </View>
//                   <AppText style={styles.menuText}>{item.label}</AppText>
//                   <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </TouchableOpacity>
//         </Modal>
//         {/* ── MODAL: Link Input ── */}
//         <Modal
//           visible={showLinkModal}
//           transparent
//           animationType="slide"
//           onRequestClose={() => setShowLinkModal(false)}
//         >
//           <View style={styles.modalOverlay}>
//             <View style={styles.linkInputContainer}>
//               <View style={styles.linkModalHeader}>
//                 <AppText style={styles.menuTitle}>Import via Link</AppText>
//                 <TouchableOpacity onPress={() => setShowLinkModal(false)}>
//                   <Ionicons name="close" size={22} color="#64748B" />
//                 </TouchableOpacity>
//               </View>

//               <AppText style={styles.linkModalHint}>
//                 Paste a recipe URL from any cooking website
//               </AppText>

//               <TextInput
//                 style={[
//                   styles.modalInput,
//                   urlError ? styles.modalInputError : null,
//                 ]}
//                 placeholder="https://example.com/recipe"
//                 placeholderTextColor="#94A3B8"
//                 value={urlInput}
//                 onChangeText={(t) => {
//                   setUrlInput(t);
//                   setUrlError("");
//                 }}
//                 autoFocus
//                 autoCapitalize="none"
//                 keyboardType="url"
//               />
//               {urlError ? (
//                 <AppText style={styles.errorText}>{urlError}</AppText>
//               ) : null}

//               <View style={styles.linkModalBtns}>
//                 <TouchableOpacity
//                   style={[styles.modalBtn, styles.cancelBtn]}
//                   onPress={() => setShowLinkModal(false)}
//                 >
//                   <AppText style={styles.cancelBtnText}>Cancel</AppText>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={styles.modalBtn}
//                   onPress={handleLinkImport}
//                 >
//                   <AppText style={styles.modalBtnText}>Import</AppText>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </Modal>
//         {/* Deletion Overlay - Same as Shopping List */}
//         {isDeleting && <DeleteLoader />}
//         {/* FAB */}
//         {!loading && (
//           <TouchableOpacity
//             style={[styles.fab, { bottom: insets.bottom + 20 }]}
//             onPress={() => setShowMenu(true)}
//             disabled={isImporting}
//             activeOpacity={0.85}
//           >
//             {isImporting ? (
//               <ActivityIndicator color="#FFF" />
//             ) : (
//               <Ionicons name="add" size={30} color="#FFF" />
//             )}
//           </TouchableOpacity>
//         )}
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F8FAFC" },

//   searchSection: { paddingHorizontal: 20, marginTop: 15, marginBottom: 8 },
//   searchContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFF",
//     borderRadius: 12,
//     paddingHorizontal: 15,
//     height: 50,
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//     gap: 10,
//   },
//   searchInput: { flex: 1, fontSize: 16, color: "#1E293B" },

//   importingBanner: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#EFF6FF",
//     marginHorizontal: 20,
//     marginBottom: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 10,
//     gap: 10,
//     borderWidth: 1,
//     borderColor: "#BFDBFE",
//   },
//   importingText: { fontSize: 14, color: PRIMARY_BLUE, fontWeight: "600" },

//   listContent: { padding: 20 },
//   recentHighlight: {
//     borderColor: PRIMARY_BLUE,
//     borderWidth: 1,
//     backgroundColor: "#F0F7FF", // Light blue background for emphasis
//     transform: [{ scale: 1.02 }], // Thoda sa bada dikhega
//   },
//   newBadge: {
//     position: "absolute",
//     top: -10,
//     right: 20,
//     backgroundColor: "#FF9500", // Accent Orange color
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 6,
//     zIndex: 10,
//   },
//   newBadgeText: {
//     color: "white",
//     fontSize: 10,
//     fontWeight: "900",
//   },
//   recipeCard: {
//     position: "relative", // New badge positioning ke liye zaroori hai
//     borderWidth: 1,
//     borderColor: "transparent",
//     backgroundColor: "#FFF",
//     padding: 15,
//     borderRadius: 20,
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 15,
//     elevation: 3,
//     shadowColor: "#1E3A8A",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//   },
//   categoryStrip: { width: 4, height: "70%", borderRadius: 2, marginRight: 15 },
//   recipeInfo: { flex: 1 },
//   recipeTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
//   metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 5 },
//   recipeMeta: { fontSize: 13, color: "#94A3B8", flex: 1 },
//   arrowContainer: { backgroundColor: "#F1F5F9", padding: 8, borderRadius: 10 },
//   selectedCard: {
//     borderColor: PRIMARY_BLUE,
//     backgroundColor: "#EFF6FF",
//   },
//   selectionCheck: {
//     position: "absolute",
//     right: 10,
//     top: 10,
//     zIndex: 5,
//   },
//   fab: {
//     position: "absolute",
//     right: 20,
//     backgroundColor: PRIMARY_BLUE,
//     width: 58,
//     height: 58,
//     borderRadius: 29,
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 8,
//     shadowColor: PRIMARY_BLUE,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.35,
//     shadowRadius: 8,
//   },

//   // Empty State
//   emptyContainer: {
//     flex: 1,
//     alignItems: "center",
//     paddingTop: 60,
//     paddingHorizontal: 40,
//   },
//   emptyIconCircle: {
//     width: 90,
//     height: 90,
//     borderRadius: 45,
//     backgroundColor: "#EFF6FF",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: "800",
//     color: "#1E293B",
//     marginBottom: 8,
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     color: "#64748B",
//     textAlign: "center",
//     lineHeight: 22,
//     marginBottom: 28,
//   },
//   addRecipeBtn: {
//     backgroundColor: PRIMARY_BLUE,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 22,
//     paddingVertical: 13,
//     borderRadius: 14,
//     gap: 8,
//   },
//   addRecipeBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },

//   // Modals
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.45)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   menuContainer: {
//     backgroundColor: "white",
//     width: "82%",
//     borderRadius: 24,
//     padding: 20,
//     elevation: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.15,
//     shadowRadius: 20,
//   },
//   menuTitle: {
//     fontSize: 17,
//     fontWeight: "800",
//     marginBottom: 16,
//     textAlign: "center",
//     color: "#1E293B",
//   },
//   menuItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F1F5F9",
//     gap: 14,
//   },
//   menuIconWrap: {
//     width: 38,
//     height: 38,
//     borderRadius: 10,
//     backgroundColor: "#EFF6FF",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   menuText: { flex: 1, fontSize: 15, color: "#1E293B", fontWeight: "600" },

//   linkInputContainer: {
//     backgroundColor: "white",
//     width: "90%",
//     padding: 24,
//     borderRadius: 22,
//     elevation: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.15,
//     shadowRadius: 20,
//   },
//   linkModalHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 6,
//   },
//   linkModalHint: { fontSize: 13, color: "#94A3B8", marginBottom: 16 },
//   modalInput: {
//     width: "100%",
//     backgroundColor: "#F8FAFC",
//     padding: 14,
//     borderRadius: 12,
//     fontSize: 15,
//     marginBottom: 6,
//     borderWidth: 1.5,
//     borderColor: "#E2E8F0",
//     color: "#1E293B",
//   },
//   modalInputError: { borderColor: "#EF4444" },
//   errorText: { fontSize: 12, color: "#EF4444", marginBottom: 12 },
//   linkModalBtns: { flexDirection: "row", gap: 10, marginTop: 14 },
//   modalBtn: {
//     flex: 1,
//     backgroundColor: PRIMARY_BLUE,
//     padding: 14,
//     borderRadius: 12,
//     alignItems: "center",
//   },
//   cancelBtn: { backgroundColor: "#F1F5F9" },
//   cancelBtnText: { color: "#475569", fontWeight: "600", fontSize: 15 },
//   modalBtnText: { color: "white", fontWeight: "700", fontSize: 15 },
// });

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AppHeader } from "../../src/components/AppHeader";
import { AppText } from "../../src/components/AppText";
import { useAppStore } from "../../src/store/useAppStore";
import { supabase } from "../../src/api/supabase";
import {
  AIRecipeResult,
  getRecipeFromAI,
  isValidUrl,
} from "../../features/recipes/services/recipeAi";
import { RecipeSkeletonList } from "../../features/recipes/components/RecipeSkeleton";
import { Analytics } from "../../src/utils/Analytics";
import { DeleteLoader } from "../../src/components/DeleteLoader";

const PRIMARY_BLUE = "#1E3A8A";

export default function RecipeBookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    recipes,
    loading,
    fetchRecipes,
    familyId,
    justAddedRecipeId,
    setJustAddedRecipeId,
  } = useAppStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");

  // const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 🚀 NEW STATE: Jin recently added recipes par click ho chuka hai, unki IDs yahan store hongi
  const [clickedRecentIds, setClickedRecentIds] = useState<string[]>([]);

  useEffect(() => {
    if (search.length > 2) {
      const timer = setTimeout(() => {
        Analytics.Recipe.searched({
          query: search,
          results_count: filteredRecipes.length,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    // 🚀 Agar selection mode mein bhi usey touch kiya jaye, toh b 'JUST ADDED' badge hat jaye
    handleRemoveRecentBadge(id);
  };

  // useFocusEffect(
  //   useCallback(() => {
  //     return () => {
  //       setNewlyAddedId(null);
  //       setSelectedIds([]);
  //       setClickedRecentIds([]); // Screen unfocus hone par clear karein
  //     };
  //   }, []),
  // );

  useFocusEffect(
    useCallback(() => {
      return () => {
        // Screen se bahar jane par global store aur click history reset karein
        setJustAddedRecipeId(null);
        setSelectedIds([]);
        setClickedRecentIds([]);
      };
    }, []),
  );
  // 🔥 RECIPES REAL-TIME ENGINE

  useEffect(() => {
    if (!familyId) return;

    // Initial fresh fetch on mount/family change
    fetchRecipes();

    // 🚀 FIX: Channel name ke sath ek randomized instance key lagayein takay
    // agar pichla channel close hone me time b le, toh Supabase ise completely new stream samjhe.
    const instanceId = Math.random().toString(36).substring(7);
    const channelName = `recipe-realtime-${familyId}-${instanceId}`;
    let recipeChannel: any = null;

    const setupRealtime = async () => {
      try {
        // 🚀 STEP 1: Pehle agar koi bhi purana stale channel pada hai use clean karein
        const activeChannels = supabase.getChannels();
        const existingChannel = activeChannels.find(
          (ch: any) => ch.topic === `realtime:recipe-realtime-${familyId}`,
        );

        if (existingChannel) {
          console.log(`[Realtime] Dropping active cached channel stream`);
          await supabase.removeChannel(existingChannel);
        }

        // 🚀 STEP 2: Ab clean slate par apna custom random-instanced channel register karein
        recipeChannel = supabase.channel(channelName).on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "recipes",
            filter: `family_id=eq.${familyId}`,
          },
          (payload) => {
            console.log("Real-time recipe change caught!", payload.eventType);

            if (payload.eventType === "DELETE") {
              useAppStore.setState((state) => ({
                recipes: state.recipes.filter((r) => r.id !== payload.old.id),
              }));
            } else if (payload.eventType === "INSERT") {
              const newRecipe = payload.new;
              useAppStore.setState((state) => {
                const exists = state.recipes.some((r) => r.id === newRecipe.id);
                if (exists) return state;
                return { recipes: [newRecipe, ...state.recipes] };
              });
              if (newRecipe) {
                useAppStore.getState().setJustAddedRecipeId(newRecipe.id);
              }
              // setNewlyAddedId(newRecipe.id);
            } else {
              fetchRecipes();
            }
          },
        );

        // 🚀 STEP 3: Safe subscription trigger
        recipeChannel.subscribe((status: string) => {
          console.log(`Supabase Subscription Status [${channelName}]:`, status);
        });
      } catch (error) {
        console.error("[Realtime Setup Error Handled]:", error);
      }
    };

    setupRealtime();

    // ─── BULLETPROOF CLEANUP ───────────────────────────────────────────────
    return () => {
      console.log(`Cleaning up channel instance: ${channelName}`);
      if (recipeChannel) {
        // 🚀 Explicitly remove all active connections on screen shift
        supabase.removeChannel(recipeChannel);
      }
    };
  }, [familyId]);
  const filteredRecipes = recipes
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()));

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  const isUrdu = (text: string) => {
    const urduPattern = /[\u0600-\u06FF]/;
    return urduPattern.test(text);
  };

  // 🚀 UPDATED HELPER: Check karega ke recipe click hui hai ya nahi
  // const isRecentlyAdded = (createdAt: string, id: string) => {
  //   if (clickedRecentIds.includes(id)) return false; // Agar click ho gayi toh badge gayab!
  //   if (id === newlyAddedId) return true;
  //   const now = new Date().getTime();
  //   const recipeTime = new Date(createdAt).getTime();
  //   return now - recipeTime < 15000;
  // };
  // 🚀 ALTERNATIVE HELPER: Sirf tab tak dikhe jab tak click na ho ya session fresh ho
  // const isRecentlyAdded = (createdAt: string, id: string) => {
  //   if (clickedRecentIds.includes(id)) return false;
  //   return id === newlyAddedId; // Sirf real-time catch hui entry par hi badge aayega!
  // };
  const isRecentlyAdded = (createdAt: string, id: string) => {
    if (clickedRecentIds.includes(id)) return false;

    // Ab yeh Link Scan, Image Scan, aur Manual Add teeno par 100% accurate state check karega!
    return id === justAddedRecipeId;
  };

  // 🚀 NEW HELPER: Badge remove karne ka action trigger karein
  const handleRemoveRecentBadge = (id: string) => {
    if (!clickedRecentIds.includes(id)) {
      setClickedRecentIds((prev) => [...prev, id]);
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.length === 0) return;

    const { data: usedInPlanner } = await supabase
      .from("meal_plans")
      .select("recipe_id, meal_date, meal_type")
      .in("recipe_id", selectedIds);

    if (usedInPlanner && usedInPlanner.length > 0) {
      Alert.alert(
        `${usedInPlanner.length} Recipe currently in used`,
        `Do You want to delete it from meal planner?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: " Delete ",
            style: "destructive",
            onPress: () => performDelete(true),
          },
        ],
      );
    } else {
      Alert.alert(
        "Delete Recipes",
        `Are you sure you want to delete ${selectedIds.length} recipe(s)?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => performDelete(false),
          },
        ],
      );
    }
  };

  const performDelete = async (alsoRemoveFromPlanner: boolean) => {
    setIsDeleting(true);
    try {
      if (alsoRemoveFromPlanner) {
        await supabase.from("meal_plans").delete().in("recipe_id", selectedIds);
      }

      const { error } = await supabase
        .from("recipes")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      Analytics.Recipe.deleted({
        recipe_count: selectedIds.length,
        also_removed_from_planner: alsoRemoveFromPlanner,
      });
      setSelectedIds([]);
      fetchRecipes();
    } catch (err) {
      Alert.alert("Error", "Could not delete recipes.");
    } finally {
      setIsDeleting(false);
    }
  };

  const saveRecipeToDB = async (
    aiResult: AIRecipeResult | null,
    source?: string,
  ) => {
    if (!aiResult) {
      Alert.alert(
        "AI Error",
        "Could not extract recipe. Try a different link or image.",
      );
      setIsImporting(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("recipes")
        .insert([
          {
            title: aiResult.title || "AI Recipe",
            family_id: familyId,
            ingredients: aiResult.ingredients,
            instructions: aiResult.instructions,
            source_url: source || "AI Scan",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Realtime notification sync ke sath immediate view fix ke liye set karein
      // if (data) setNewlyAddedId(data.id);
      if (data) {
        useAppStore.getState().setJustAddedRecipeId(data.id);
      }
      const recipeToShare = {
        title: aiResult.title || "AI Recipe",
        ingredients: aiResult.ingredients,
        instructions: aiResult.instructions,
        category: "Community",
        original_creator: "AI Chef Scan",
      };

      await supabase.from("recommended_recipes").insert(recipeToShare);

      if (source === "AI Scan" || source === "Image Scan") {
        Analytics.Recipe.addedViaScan({ recipe_title: aiResult.title });
      } else if (isValidUrl(source || "")) {
        Analytics.Recipe.addedViaLink({
          recipe_title: aiResult.title,
          source_url: source || "",
        });
      } else {
        Analytics.Recipe.addedManual({ recipe_title: aiResult.title });
      }
      await fetchRecipes();
      Alert.alert(
        "Success ✨",
        `"${aiResult.title}" added to your recipe book and shared!`,
        [
          {
            text: "View",
            onPress: () => {
              if (data) {
                handleRemoveRecentBadge(data.id); // View click par badge remove
                router.push(`/meals/${data.id}`);
              }
            },
          },
          { text: "OK" },
        ],
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save recipe. Please try again.");
    } finally {
      setIsImporting(false);
      setUrlInput("");
      setUrlError("");
    }
  };

  // ─── HANDLERS ──────────────────────────────────────────────────────────────
  const handleLinkImport = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError("Please enter a URL.");
      return;
    }
    if (!isValidUrl(trimmed)) {
      setUrlError("Please enter a valid URL (https://...)");
      return;
    }

    setUrlError("");
    setShowLinkModal(false);
    setIsImporting(true);

    const result = await getRecipeFromAI(trimmed);
    await saveRecipeToDB(result, trimmed);
  };

  const handleImageScan = async () => {
    setShowMenu(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera access is needed to scan dishes.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].base64) {
      setIsImporting(true);
      const aiResult = await getRecipeFromAI(
        undefined,
        result.assets[0].base64,
      );
      await saveRecipeToDB(aiResult, "Image Scan");
    }
  };

  const handleManualAdd = () => {
    setShowMenu(false);
    router.push("/meals/add-recipe");
  };

  const handleOpenLinkModal = () => {
    setShowMenu(false);
    setUrlInput("");
    setUrlError("");
    setShowLinkModal(true);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: PRIMARY_BLUE }}
      edges={["top", "left"]}
    >
      <AppHeader
        title={
          selectedIds.length > 0
            ? `${selectedIds.length} Selected`
            : "Recipe Book"
        }
        rightIconName={selectedIds.length > 0 ? "trash-outline" : undefined}
        onRightIconPress={
          selectedIds.length > 0 ? handleDeleteMultiple : undefined
        }
        leftIconName={selectedIds.length > 0 ? "close" : undefined}
        onLeftIconPress={
          selectedIds.length > 0 ? () => setSelectedIds([]) : undefined
        }
      />
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: "#EFF6FF",
            margin: 20,
            padding: 15,
            borderRadius: 15,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#BFDBFE",
          }}
          onPress={() => router.push("/meals/magic-chef")}
        >
          <View
            style={{
              backgroundColor: PRIMARY_BLUE,
              padding: 8,
              borderRadius: 10,
              marginRight: 12,
            }}
          >
            <Ionicons name="sparkles" size={20} color="white" />
          </View>
          <View>
            <AppText style={{ fontWeight: "700", color: "#1E3A8A" }}>
              Magic Chef Mode
            </AppText>
            <AppText style={{ fontSize: 12, color: "#64748B" }}>
              Find recipes with items you already have
            </AppText>
          </View>
        </TouchableOpacity>

        {isImporting && (
          <View style={styles.importingBanner}>
            <ActivityIndicator size="small" color={PRIMARY_BLUE} />
            <AppText style={styles.importingText}>
              AI is reading the recipe...
            </AppText>
          </View>
        )}

        {loading && recipes.length === 0 ? (
          <RecipeSkeletonList />
        ) : (
          <FlatList
            data={filteredRecipes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 60 },
            ]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isNew = isRecentlyAdded(item.created_at, item.id);
              const isSelected = selectedIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={[
                    styles.recipeCard,
                    isNew && styles.recentHighlight,
                    isSelected && styles.selectedCard,
                  ]}
                  onPress={() => {
                    // 🚀 Click hote hi badge khatam karne ke liye helper trigger karein
                    handleRemoveRecentBadge(item.id);

                    if (selectedIds.length > 0) {
                      toggleSelection(item.id);
                    } else {
                      Analytics.Recipe.viewed({
                        recipe_title: item.title,
                        recipe_id: item.id,
                      });
                      router.push(`/meals/${item.id}`);
                    }
                  }}
                  onLongPress={() => toggleSelection(item.id)}
                  activeOpacity={0.75}
                >
                  {isNew && !isSelected && (
                    <View style={styles.newBadge}>
                      <AppText style={styles.newBadgeText}>JUST ADDED</AppText>
                    </View>
                  )}

                  {isSelected && (
                    <View style={styles.selectionCheck}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={PRIMARY_BLUE}
                      />
                    </View>
                  )}

                  <View
                    style={[
                      styles.categoryStrip,
                      { backgroundColor: PRIMARY_BLUE },
                    ]}
                  />

                  <View style={styles.recipeInfo}>
                    <AppText
                      style={[
                        styles.recipeTitle,
                        {
                          textAlign: isUrdu(item.title || "")
                            ? "right"
                            : "left",
                          writingDirection: isUrdu(item.title || "")
                            ? "rtl"
                            : "ltr",
                        },
                      ]}
                    >
                      {item.title}
                    </AppText>
                    <View
                      style={[
                        styles.metaRow,
                        {
                          flexDirection: isUrdu(item.title || "")
                            ? "row-reverse"
                            : "row",
                        },
                      ]}
                    >
                      <Ionicons
                        name="restaurant-outline"
                        size={13}
                        color="#94A3B8"
                      />
                      <AppText
                        style={[
                          styles.recipeMeta,
                          {
                            textAlign: isUrdu(item.title || "")
                              ? "right"
                              : "left",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.ingredients || "View preparation steps"}
                      </AppText>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons
                      name="restaurant-outline"
                      size={40}
                      color={PRIMARY_BLUE}
                    />
                  </View>
                  <AppText style={styles.emptyTitle}>No Recipes Yet</AppText>
                  <AppText style={styles.emptySubtitle}>
                    Add manually, import via link, or scan a dish with AI.
                  </AppText>
                  <TouchableOpacity
                    style={styles.addRecipeBtn}
                    onPress={() => setShowMenu(true)}
                  >
                    <Ionicons name="add" size={18} color="#FFF" />
                    <AppText style={styles.addRecipeBtnText}>
                      Add Your First Recipe
                    </AppText>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}

        {/* Options Modal */}
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          >
            <View style={styles.menuContainer}>
              <AppText style={styles.menuTitle}>Add New Recipe</AppText>
              {[
                {
                  icon: "create-outline",
                  label: "Manual Add",
                  onPress: handleManualAdd,
                },
                {
                  icon: "link-outline",
                  label: "Import via Link",
                  onPress: handleOpenLinkModal,
                },
                {
                  icon: "camera-outline",
                  label: "Scan Dish (AI Chef Eye)",
                  onPress: handleImageScan,
                },
              ].map((item, i, arr) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    i === arr.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuIconWrap}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={PRIMARY_BLUE}
                    />
                  </View>
                  <AppText style={styles.menuText}>{item.label}</AppText>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Link Modal */}
        <Modal
          visible={showLinkModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLinkModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.linkInputContainer}>
              <View style={styles.linkModalHeader}>
                <AppText style={styles.menuTitle}>Import via Link</AppText>
                <TouchableOpacity onPress={() => setShowLinkModal(false)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>
              <AppText style={styles.linkModalHint}>
                Paste a recipe URL from any cooking website
              </AppText>
              <TextInput
                style={[
                  styles.modalInput,
                  urlError ? styles.modalInputError : null,
                ]}
                placeholder="https://example.com/recipe"
                placeholderTextColor="#94A3B8"
                value={urlInput}
                onChangeText={(t) => {
                  setUrlInput(t);
                  setUrlError("");
                }}
                autoFocus
                autoCapitalize="none"
                keyboardType="url"
              />
              {urlError ? (
                <AppText style={styles.errorText}>{urlError}</AppText>
              ) : null}
              <View style={styles.linkModalBtns}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setShowLinkModal(false)}
                >
                  <AppText style={styles.cancelBtnText}>Cancel</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={handleLinkImport}
                >
                  <AppText style={styles.modalBtnText}>Import</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {isDeleting && <DeleteLoader />}

        {!loading && (
          <TouchableOpacity
            style={[styles.fab, { bottom: insets.bottom + 20 }]}
            onPress={() => setShowMenu(true)}
            disabled={isImporting}
            activeOpacity={0.85}
          >
            {isImporting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Ionicons name="add" size={30} color="#FFF" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// Styles are perfectly kept same as previous code structure
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  searchSection: { paddingHorizontal: 20, marginTop: 15, marginBottom: 8 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#1E293B" },
  importingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  importingText: { fontSize: 14, color: PRIMARY_BLUE, fontWeight: "600" },
  listContent: { padding: 20 },
  recentHighlight: {
    borderColor: PRIMARY_BLUE,
    borderWidth: 1,
    backgroundColor: "#F0F7FF",
    transform: [{ scale: 1.02 }],
  },
  newBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: "#FF9500",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 10,
  },
  newBadgeText: { color: "white", fontSize: 10, fontWeight: "900" },
  recipeCard: {
    position: "relative",
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  categoryStrip: { width: 4, height: "70%", borderRadius: 2, marginRight: 15 },
  recipeInfo: { flex: 1 },
  recipeTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 5 },
  recipeMeta: { fontSize: 13, color: "#94A3B8", flex: 1 },
  selectedCard: { borderColor: PRIMARY_BLUE, backgroundColor: "#EFF6FF" },
  selectionCheck: { position: "absolute", right: 10, top: 10, zIndex: 5 },
  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: PRIMARY_BLUE,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
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
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  addRecipeBtn: {
    backgroundColor: PRIMARY_BLUE,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  addRecipeBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "white",
    width: "82%",
    borderRadius: 24,
    padding: 20,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
    color: "#1E293B",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 14,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: { flex: 1, fontSize: 15, color: "#1E293B", fontWeight: "600" },
  linkInputContainer: {
    backgroundColor: "white",
    width: "90%",
    padding: 24,
    borderRadius: 22,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  linkModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    // justifySpace: "between",
    marginBottom: 6,
  },
  linkModalHint: { fontSize: 13, color: "#94A3B8", marginBottom: 16 },
  modalInput: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    color: "#1E293B",
  },
  modalInputError: { borderColor: "#EF4444" },
  errorText: { fontSize: 12, color: "#EF4444", marginBottom: 12 },
  linkModalBtns: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalBtn: {
    flex: 1,
    backgroundColor: PRIMARY_BLUE,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtn: { backgroundColor: "#F1F5F9" },
  cancelBtnText: { color: "#475569", fontWeight: "600", fontSize: 15 },
  modalBtnText: { color: "white", fontWeight: "700", fontSize: 15 },
});
