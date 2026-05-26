import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/api/supabase";
import { AppHeader } from "../../src/components/AppHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../src/store/useAppStore";
import { Analytics } from "../../src/utils/Analytics";
import Toast from "react-native-toast-message";

export default function MealPlannerScreen() {
  const router = useRouter();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<any>({});

  const { mealData, fetchMealPlans, globalRecipes, familyId, userProfile } =
    useAppStore();
  const PRIMARY_BLUE = "#1E3A8A";

  const MEAL_TYPES = [
    {
      id: "Breakfast",
      label: "Morning",
      icon: "sunny-outline" as const,
      color: "#FFB347",
    },
    {
      id: "Lunch",
      label: "Afternoon",
      icon: "fast-food-outline" as const,
      color: "#45B6FE",
    },
    {
      id: "Dinner",
      label: "Evening",
      icon: "moon-outline" as const,
      color: "#836FFF",
    },
  ];
  useFocusEffect(
    useCallback(() => {
      if (familyId) fetchMealPlans();
    }, [familyId, weekOffset]),
  );
  // MealPlannerScreen.tsx ke andar

  useFocusEffect(
    useCallback(() => {
      if (!familyId) return;

      // Initial fetch
      fetchMealPlans();

      // 🚀 Real-time Listener: User B ke changes User C ko dikhane ke liye
      const subscription = supabase
        .channel(`family-meals-${familyId}`) // Unique channel name
        .on(
          "postgres_changes",
          {
            event: "*", // Insert, Update, Delete sab pakre ga
            schema: "public",
            table: "meal_plans",
            filter: `family_id=eq.${familyId}`,
          },
          () => {
            console.log("Database updated! Refreshing meals...");
            fetchMealPlans(); // Store wala fetch function dobara call hoga
          },
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }, [familyId, weekOffset]), // weekOffset bhi add karein taake week change par fetch ho
  );
  const days = useMemo(() => {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + weekOffset * 7 + i);
      week.push({
        fullDate: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-GB", { weekday: "short" }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString("en-GB", { month: "short" }),
      });
    }
    return week;
  }, [weekOffset]);
  const currentDayMeals = useMemo(() => {
    const targetDate = days[selectedDayIndex]?.fullDate;
    const rawData = mealData[targetDate];
    return Array.isArray(rawData) ? rawData : [];
  }, [mealData, selectedDayIndex, days]);

  const applySuggestions = async (source: any[]) => {
    const targetDate = days[selectedDayIndex].fullDate;

    if (!familyId || !userProfile?.id) {
      Alert.alert("Error", "User profile or Family ID is missing .");
      return;
    }

    setIsGenerating(true);
    try {
      let addedCount = 0;
      for (const type of MEAL_TYPES) {
        // Check if this slot is empty (optional: remove this check if you want multiple auto-suggestions too)
        const existing = currentDayMeals.find(
          (m: any) => m.meal_type === type.id,
        );

        if (!existing) {
          const randomRecipe =
            source[Math.floor(Math.random() * source.length)];
          if (!randomRecipe || !randomRecipe.id) continue;

          let finalId = randomRecipe.id;

          if (!randomRecipe.family_id) {
            const { data: newRec, error: copyErr } = await supabase
              .from("recipes")
              .insert([
                {
                  title: randomRecipe.title,
                  instructions: randomRecipe.instructions,
                  image_url: randomRecipe.image_url,
                  ingredients: randomRecipe.ingredients,
                  family_id: familyId,
                },
              ])
              .select()
              .single();

            if (copyErr) throw copyErr;
            if (newRec) finalId = newRec.id;
          }

          // ✅ Step B: Simple Insert (Upsert hata diya gaya hai)
          const { error: planErr } = await supabase.from("meal_plans").insert({
            family_id: familyId,
            meal_date: targetDate,
            recipe_id: finalId,
            meal_type: type.id,
            created_by: userProfile.id,
          });

          if (planErr) console.error("Plan Error:", planErr.message);
          if (!planErr) addedCount++;
        }
        if (addedCount > 0) {
          // ✅ Activity Log & Notification for AI Generation
          await logMealActivity(
            userProfile.id,
            familyId,
            userProfile.username,
            "auto-generated",
            `${addedCount} meals`,
            "added",
          );
          await notifyFamily(`${addedCount} meals (Auto-Menu)`, targetDate);
        }
      }

      await fetchMealPlans();
      setSuggestions({});
      Alert.alert("Success", "Daily menu updated! ✨");
    } catch (err: any) {
      console.error("Auto-suggest error:", err);
      Alert.alert("Error", err.message);
    } finally {
      setIsGenerating(false);
    }
  };
  // const logMealActivity = async (
  //   userId: string,
  //   familyId: string,
  //   userName: string,
  //   action: string,
  //   mealTitle: string,
  //   type = "added",
  // ) => {
  //   // 1. Activity Log (Timeline ke liye)
  //   await supabase.from("activity_logs").insert({
  //     family_id: familyId,
  //     user_name: userName,
  //     action_type: type, // "added", "deleted"
  //     item_name: mealTitle,
  //     tab_type: "Meals",
  //   });

  //   // 2. Notification History (Inbox ke liye)
  //   // Aap chahein toh yahan baaki family members ko loop karke notify kar sakte hain
  //   await supabase.from("notifications_history").insert({
  //     user_id: userId,
  //     family_id: familyId,
  //     title: type === "added" ? "New Meal Planned 🍳" : "Meal Removed 🗑️",
  //     body: `${userName} ${action} "${mealTitle}" in the planner.`,
  //     status: "unread",
  //   });
  // };
  // const notifyFamily = async (recipeTitle: string, mealDate: string) => {
  //   try {
  //     // Current user ka naam nikalne ke liye
  //     if (!familyId || !userProfile) return;

  //     // ✅ 1. Family members fetch (Sirf tokens)
  //     const { data: members } = await supabase
  //       .from("profiles")
  //       .select("id, expo_push_token")
  //       .eq("family_id", familyId)
  //       .not("expo_push_token", "is", null);

  //     if (members && members.length > 0) {
  //       const displayName = userProfile.username || "Someone";
  //       const title = "New meal planned 🍴";
  //       const body = `${displayName} planned "${recipeTitle}" for ${mealDate}`;
  //       const pushMessages = members.map((m) => ({
  //         to: m.expo_push_token,
  //         sound: "default",
  //         title: "🍴 New Meal Planned!",
  //         body: body,
  //         priority: "high",
  //       }));

  //       await fetch("https://exp.host/--/api/v2/push/send", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(pushMessages),
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Notify Error:", error);
  //   }
  // };

  const logMealActivity = async (
    senderId: string,
    familyId: string,
    userName: string,
    action: string,
    mealTitle: string,
    type = "added",
  ) => {
    try {
      // 1. Timeline Activity Log (Yeh pooray family group ke liye common hota hai)
      await supabase.from("activity_logs").insert({
        family_id: familyId,
        user_name: userName,
        action_type: type, // "added", "deleted"
        item_name: mealTitle,
        tab_type: "Meals",
      });

      // 🚀 FIX: Family ke baaki members fetch karein jinko notification inbox mein entry chahiye
      const { data: members } = await supabase
        .from("profiles")
        .select("id")
        .eq("family_id", familyId)
        .neq("id", senderId); // Apne aap ko chhor kar baaki sab ko entry bhejein

      if (members && members.length > 0) {
        const historyEntries = members.map((m) => ({
          user_id: m.id, // ✅ Har receiver member ki personal ID
          family_id: familyId,
          title: type === "added" ? "New Meal Planned 🍳" : "Meal Removed 🗑️",
          body: `${userName} ${action} "${mealTitle}" in the planner.`,
          status: "unread",
        }));

        // Ek sath sabke inbox entries insert karein
        await supabase.from("notifications_history").insert(historyEntries);
      }
    } catch (err) {
      console.error("❌ Error logging notification history:", err);
    }
  };

  const notifyFamily = async (recipeTitle: string, mealDate: string) => {
    try {
      if (!familyId || !userProfile?.id) return;

      // ✅ 1. Apne alawa baaki sab family members fetch karein jinki tokens hon
      const { data: members } = await supabase
        .from("profiles")
        .select("id, expo_push_token")
        .eq("family_id", familyId)
        // .neq("id", userProfile.id) // Filter out current user
        .not("expo_push_token", "is", null);

      if (members && members.length > 0) {
        const displayName = userProfile.username || "Someone";
        const bodyText = `${displayName} planned "${recipeTitle}" for ${mealDate}`;

        // ✅ 2. Payload exact structure match for Expo
        const pushMessages = members.map((m) => ({
          to: m.expo_push_token,
          sound: "default",
          title: "🍴 New Meal Planned!",
          body: bodyText,
          priority: "high",
          // data: { screen: "MealPlanner" }, // Optional screen dynamic link parsing
        }));

        // ✅ 3. Direct array stringified body transmission
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(pushMessages),
        });

        const resData = await response.json();
        console.log("Expo Push Response Details:", resData);
      }
    } catch (error) {
      console.error("❌ Notify Family Push Fatal Error:", error);
    }
  };

  const handleAutoSuggest = async () => {
    setIsGenerating(true);
    try {
      // 1. Freshly fetch own recipes
      const { data: myRecipes } = await supabase
        .from("recipes")
        .select("*")
        .eq("family_id", familyId);

      // 🚀 FIX: Freshly fetch recommended/community recipes directly from DB
      const { data: communityRecipes } = await supabase
        .from("recommended_recipes")
        .select("*");

      // 2. Combine both arrays safely
      const allAvailableRecipes = [
        ...(myRecipes || []),
        ...(communityRecipes || []), // Fresh community data mix hoga
      ];

      if (allAvailableRecipes.length === 0) {
        Alert.alert("No Recipes Found", "Firstly add some recipes.");
        return;
      }

      // 3. Suggestions state mein set karein
      const newSuggestions: any = {};
      const selectedInThisCycle = new Set();

      MEAL_TYPES.forEach((type) => {
        // Sirf un slots ke liye suggest karein jo khali hain
        const isAlreadyPlanned = currentDayMeals.some(
          (m) => m.meal_type === type.id,
        );

        if (!isAlreadyPlanned) {
          const uniqueOptions = allAvailableRecipes.filter(
            (r) => !selectedInThisCycle.has(r.id),
          );
          const sourcePool =
            uniqueOptions.length > 0 ? uniqueOptions : allAvailableRecipes;
          const randomRecipe =
            sourcePool[Math.floor(Math.random() * sourcePool.length)];

          if (randomRecipe) {
            newSuggestions[type.id] = randomRecipe;
            selectedInThisCycle.add(randomRecipe.id); // Mark as used
          }
        }
      });

      const suggestedCount = Object.keys(newSuggestions).length;
      if (suggestedCount > 0) {
        Analytics.Meal.suggestionGenerated({
          slots_suggested: suggestedCount,
          source: "mixed",
        });
      }
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Auto suggest error:", error);
      Alert.alert("Error", "Couldn't generate Suggestions.");
    } finally {
      setIsGenerating(false);
    }
  };
  // const handleAutoSuggest = async () => {
  //   setIsGenerating(true);
  //   try {
  //     // 1. Database se recipes lein
  //     const { data: myRecipes } = await supabase
  //       .from("recipes")
  //       .select("*")
  //       .eq("family_id", familyId);

  //     const allAvailableRecipes = [
  //       ...(myRecipes || []),
  //       ...(globalRecipes || []),
  //     ];

  //     if (allAvailableRecipes.length === 0) {
  //       Alert.alert("No Recipes Found", "Firstly add some recipes.");
  //       return;
  //     }

  //     // 2. 🚀 Baje seedha save karne ke, suggestions state mein set karein
  //     const newSuggestions: any = {};
  //     const selectedInThisCycle = new Set();
  //     MEAL_TYPES.forEach((type) => {
  //       // Sirf un slots ke liye suggest karein jo khali hain
  //       const isAlreadyPlanned = currentDayMeals.some(
  //         (m) => m.meal_type === type.id,
  //       );

  //       if (!isAlreadyPlanned) {
  //         const uniqueOptions = allAvailableRecipes.filter(
  //           (r) => !selectedInThisCycle.has(r.id),
  //         );
  //         const sourcePool =
  //           uniqueOptions.length > 0 ? uniqueOptions : allAvailableRecipes;
  //         const randomRecipe =
  //           sourcePool[Math.floor(Math.random() * sourcePool.length)];

  //         if (randomRecipe) {
  //           newSuggestions[type.id] = randomRecipe;
  //           selectedInThisCycle.add(randomRecipe.id); // 🚀 Mark as used
  //         }
  //       }
  //     });
  //     const suggestedCount = Object.keys(newSuggestions).length;
  //     if (suggestedCount > 0) {
  //       Analytics.Meal.suggestionGenerated({
  //         slots_suggested: suggestedCount,
  //         source: "mixed", // Kyunke aapne code mein myRecipes aur global dono mix kiye hain
  //       });
  //     }
  //     setSuggestions(newSuggestions); // Yeh UI par Blue "SUGGESTION" cards dikhaye ga
  //   } catch (error) {
  //     Alert.alert("Error", "Coudn't generate Suggestions.");
  //   } finally {
  //     setIsGenerating(false);
  //   }
  // };
  const confirmSuggestion = async (mealType: string, recipe: any) => {
    setIsGenerating(true);
    try {
      const targetDate = days[selectedDayIndex].fullDate;
      let finalId = recipe.id;

      // ✅ Global recipe ko copy karne ka logic (takay error na aaye)
      if (!recipe.family_id) {
        const { data: newRec, error: copyErr } = await supabase
          .from("recipes")
          .insert([
            {
              title: recipe.title,
              instructions: recipe.instructions,
              image_url: recipe.image_url,
              ingredients: recipe.ingredients,
              family_id: familyId,
            },
          ])
          .select()
          .single();

        if (copyErr) throw copyErr;
        finalId = newRec.id;
      }

      // ✅ Database mein save karein
      const { error: planErr } = await supabase.from("meal_plans").insert({
        family_id: familyId,
        meal_date: targetDate,
        recipe_id: finalId,
        meal_type: mealType,
        created_by: userProfile?.id,
      });

      if (planErr) throw planErr;
      Toast.show({
        type: "success",
        text1: "Meal Planned! 🍴",
        text2: `${recipe.title} set for ${targetDate}`,
      });
      notifyFamily(recipe.title, targetDate as string);
      await logMealActivity(
        userProfile?.id || "",
        familyId || "",
        userProfile?.username || "Someone",
        "planned",
        recipe.title,
        "added",
      );
      // ✅ UI se suggestion hatayein aur data refresh karein
      setSuggestions((prev: any) => {
        const next = { ...prev };
        delete next[mealType];
        return next;
      });
      Analytics.Meal.suggestionConfirmed({
        recipe_title: recipe.title,
        meal_type: mealType,
        is_global_recipe: !recipe.family_id, // Agar family_id nahi hai toh matlab global hai
      });
      await fetchMealPlans();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setIsGenerating(false);
    }
  };
  const handleDeleteMeal = async (
    mealId: string,
    recipeTitle?: string,
    mealType?: string,
  ) => {
    const { error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", mealId);
    if (!error) {
      Analytics.Meal.deletedFromPlanner({
        recipe_title: recipeTitle,
        meal_type: mealType,
      });
      fetchMealPlans();
    }
  };
  // Inside MealPlannerScreen component...

  return (
    //  <SafeAreaView style={{ flex: 1, backgroundColor: "#FDFDFF" }}>

    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1E3A8A" }}
      edges={["left", "right", "top"]}
    >
      <AppHeader
        title="Meal Planner"
        rightIconName="sparkles"
        onRightIconPress={handleAutoSuggest}
      />
      <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
        {/* ✅ Compact Premium Calendar Container */}
        <View style={styles.topSection}>
          <View style={styles.weekHeader}>
            <TouchableOpacity
              onPress={() => {
                const newOffset = weekOffset - 1;
                setWeekOffset(newOffset);
                Analytics.Meal.weekChanged({
                  direction: "prev",
                  week_offset: newOffset,
                });
              }}
            >
              <Ionicons name="chevron-back" size={24} color={PRIMARY_BLUE} />
            </TouchableOpacity>
            <Text style={styles.weekLabel}>
              {days[0].month} {days[0].dayNum} - {days[6].month}{" "}
              {days[6].dayNum}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const newOffset = weekOffset + 1;
                setWeekOffset(newOffset);
                Analytics.Meal.weekChanged({
                  direction: "next",
                  week_offset: newOffset,
                });
              }}
            >
              <Ionicons name="chevron-forward" size={24} color={PRIMARY_BLUE} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayScroll}
          >
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCard,
                  selectedDayIndex === index && styles.activeDayCard,
                ]}
                onPress={() => {
                  setSelectedDayIndex(index);
                  setSuggestions({}); // Reset suggestions on day change
                }}
              >
                <Text
                  style={[
                    styles.dayName,
                    selectedDayIndex === index && styles.activeText,
                  ]}
                >
                  {day.dayName}
                </Text>
                <Text
                  style={[
                    styles.dayNum,
                    selectedDayIndex === index && styles.activeText,
                  ]}
                >
                  {day.dayNum}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Date Indicator Title */}
          <View style={styles.contentHeader}>
            <Text style={styles.dateSub}>
              {days[selectedDayIndex].dayName}, {days[selectedDayIndex].dayNum}
              {days[selectedDayIndex].month}
            </Text>
          </View>

          {MEAL_TYPES.map((type) => {
            // ✅ Only filter for this specific slot (Morning/Afternoon/Evening)
            const plannedForThisSlot = currentDayMeals.filter(
              (m) => m.meal_type === type.id,
            );
            const suggested = suggestions[type.id];

            return (
              <View key={type.id} style={styles.mealSlot}>
                <View style={styles.mealHeader}>
                  <Ionicons name={type.icon} size={18} color={type.color} />
                  <Text style={[styles.mealLabel, { color: type.color }]}>
                    {type.label}
                  </Text>
                </View>

                {/* Planned Cards */}
                {plannedForThisSlot.map((planned: any, pIndex: number) => (
                  <View
                    key={planned.id || pIndex}
                    style={[styles.mainCard, styles.confirmedCard]}
                  >
                    <View style={styles.cardInfo}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recipeName}>
                          {planned.recipes?.title}
                        </Text>
                        <Text style={styles.memberTag}>
                          By {userProfile?.username || "Family"}
                        </Text>
                      </View>
                      <Ionicons
                        name="checkmark-done-circle"
                        size={24}
                        color="#34C759"
                      />
                      <TouchableOpacity
                        onPress={() => handleDeleteMeal(planned.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Suggestion Card */}
                {suggested && (
                  <View style={[styles.mainCard, styles.suggestedCard]}>
                    <View style={styles.cardInfo}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suggestLabel}>SUGGESTION</Text>
                        <Text style={styles.recipeName}>{suggested.title}</Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setSuggestions((p: any) => {
                              const n = { ...p };
                              delete n[type.id];
                              return n;
                            });
                            Analytics.Meal.suggestionDismissed({
                              meal_type: type.id,
                            });
                          }}
                          style={styles.dismissBtn}
                        >
                          <Ionicons name="close" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => confirmSuggestion(type.id, suggested)}
                          style={styles.addBtn}
                        >
                          <Ionicons name="add" size={20} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* Add More Button (Compact) */}
                <TouchableOpacity
                  style={[styles.mainCard, styles.emptyCard, { minHeight: 60 }]}
                  onPress={() =>
                    router.push({
                      pathname: "/meals/select-recipe",
                      params: {
                        date: days[selectedDayIndex].fullDate,
                        type: type.id,
                      },
                    })
                  }
                >
                  <View style={styles.emptyContent}>
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color="#94A3B8"
                    />
                    <Text style={styles.placeholderText}>
                      Add to {type.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
        {isGenerating && (
          <View style={styles.loaderOverlay}>
            <View style={styles.loaderContent}>
              <ActivityIndicator size="large" color="#1E3A8A" />
              <Text style={styles.loaderText}>Generating your menu...</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  loaderOverlay: {
    // Poori screen ko cover karne ke liye
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent white
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999, // Sabse upar dikhane ke liye
    // Blur effect (Android par sirf opacity kaam karegi, iOS par blur)
  },
  loaderContent: {
    backgroundColor: "#FFF",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    gap: 15,
  },
  loaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
    marginTop: 10,
  },
  container: { flex: 1, backgroundColor: "#FDFDFF" },
  topSection: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  weekLabel: { fontSize: 16, fontWeight: "800", color: "#1E3A8A" },
  dayScroll: { paddingHorizontal: 20, paddingVertical: 20 },
  dayCard: {
    width: 40,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#F1F5F9",
  },
  activeDayCard: { backgroundColor: "#1E3A8A" },
  dayName: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  dayNum: { fontSize: 20, fontWeight: "900", color: "#1E293B" },
  activeText: { color: "#FFF" },
  content: { flex: 1, padding: 20 },
  contentHeader: { marginBottom: 25 },
  sectionTitle: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
  dateSub: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  mealSlot: { marginBottom: 15 },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  mealLabel: { fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  mainCard: {
    borderRadius: 20,
    // padding: 20,
    // minHeight: 80,
    paddingVertical: 12, // Padding kam kar di
    paddingHorizontal: 15,
    minHeight: 60, // Height kafi kam kar di
    justifyContent: "center",
    marginBottom: 10,
    backgroundColor: "#FFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  emptyCard: {
    // borderWeight: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderWidth: 1.5,
    backgroundColor: "#F8FAFC",
  },
  confirmedCard: { borderLeftWidth: 10, borderLeftColor: "#34C759" },
  suggestedCard: {
    borderLeftWidth: 10,
    borderLeftColor: "#1E3A8A",
    backgroundColor: "#F0F7FF",
  },
  recipeName: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  memberTag: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  suggestLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  cardInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  placeholderText: { color: "#94A3B8", fontSize: 15, fontWeight: "600" },
  // addBtn: { backgroundColor: "#1E3A8A", padding: 10, borderRadius: 15 },
  dismissBtn: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#F1F5F9", // Light gray background
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  addBtn: {
    backgroundColor: "#1E3A8A", // Aapka primary blue color
    padding: 8,
    borderRadius: 12,
    elevation: 2,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
