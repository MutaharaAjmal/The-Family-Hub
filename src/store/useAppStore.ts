import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../api/supabase";

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  email: string;
  family_id?: string;
  color?: string;
}

interface AppState {
  // --- Auth & Family Context ---
  familyId: string | null;
  userData: any | null;
  userProfile: UserProfile | null;
  familyDetails: { name: string; created_by: string } | null;
  familyMembers: any[];

  // --- Data States ---
  recipes: any[];
  userRecipes: any[];
  globalRecipes: any[];
  justAddedRecipeId: string | null;
  mealData: any;
  loading: boolean;
  events: any[];
  shoppingCategories: any[];
  listData: any[];
  choresData: any[];
  shoppingData: any[];
  todoData: any[];
  // loading: false,
  chatHistory: { id: string; text: string; sender: "user" | "ai" }[];

  // --- Actions ---
  setAuth: (familyId: string | null, userData: any | null) => void;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => void; // ✅ Local update
  fetchRecipes: () => Promise<void>;
  setJustAddedRecipeId: (id: string | null) => void;
  fetchMealPlans: () => Promise<void>;
  fetchSelectRecipeData: () => Promise<void>;
  fetchEvents: (date: string) => Promise<void>;
  fetchFamilyDetails: () => Promise<void>;
  updateFamilyNameInStore: (newName: string) => Promise<void>;
  fetchShoppingData: () => Promise<void>;
  setListData: (data: any[]) => void;
  fetchGenericList: (tabType: string, date?: string) => Promise<void>;

  // --- Optimistic UI Actions ---
  deleteEventOptimistic: (eventId: string) => Promise<void>;
  clearStore: () => void;

  addMessage: (message: {
    id: string;
    text: string;
    sender: "user" | "ai";
  }) => void;
  clearChat: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- INITIAL STATE ---
      familyId: null,
      userData: null,
      userProfile: null,
      familyDetails: null,
      familyMembers: [],
      recipes: [],
      mealData: {},
      userRecipes: [],
      globalRecipes: [],
      events: [],
      shoppingCategories: [],
      listData: [],
      choresData: [],
      shoppingData: [],
      todoData: [],
      loading: false,
      justAddedRecipeId: null,
      setJustAddedRecipeId: (id) => set({ justAddedRecipeId: id }),
      // --- AUTH ACTIONS ---
      setAuth: (familyId, profileData) => {
        set({ familyId, userProfile: profileData, userData: profileData });
      },
      setListData: (data) => set({ listData: data }),

      fetchUserProfile: async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) set({ userProfile: data });
      },

      // Profile ko local store mein update karne ke liye
      updateUserProfile: (updates) =>
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, ...updates }
            : null,
        })),

      // --- DATA ACTIONS ---
      fetchRecipes: async () => {
        const fId = get().familyId;
        if (!fId) return;
        if (get().recipes.length === 0) set({ loading: true });

        const { data } = await supabase
          .from("recipes")
          .select("*")
          .eq("family_id", fId)
          .order("title", { ascending: false });

        set({ recipes: data || [], loading: false });
      },

      fetchMealPlans: async () => {
        const fId = get().familyId;
        if (!fId) return;

        const { data, error } = await supabase
          .from("meal_plans")
          .select("*, recipes(title)") // hatayein !inner agar data miss ho raha ho
          .eq("family_id", fId);

        if (error) {
          console.error("Fetch Error:", error);
          return;
        }

        if (data) {
          // ✅ Grouping logic: Ek date ke andar multiple meals (Array)
          const mapped = data.reduce((acc: any, item: any) => {
            const date = item.meal_date;
            if (!acc[date]) {
              acc[date] = [];
            }
            acc[date].push(item);
            return acc;
          }, {});

          set({ mealData: mapped });
        }
      },

      fetchEvents: async (dateToFetch: string) => {
        const fId = get().familyId;
        const myId = get().userProfile?.id; // Current user ki ID lein

        if (!fId || !myId) return;
        set({ loading: true });
        try {
          const { data } = await supabase
            .from("events")
            .select("*")
            .eq("family_id", fId)
            .eq("event_date", dateToFetch)
            .or(
              `visibility.eq.All,created_by.eq.${myId},attendees.cs.{"${myId}"}`,
            )
            // .order("start_time", { ascending: true });
            .order("event_date", { ascending: true });
          set({ events: data || [], loading: false });
        } catch (error) {
          set({ loading: false });
        }
      },

      // --- FAMILY ACTIONS ---
      fetchFamilyDetails: async () => {
        const fId = get().familyId;
        if (!fId) return;
        set({ loading: true });
        try {
          const [familyRes, membersRes] = await Promise.all([
            supabase
              .from("families")
              .select("name, created_by")
              .eq("id", fId)
              .single(),
            supabase
              .from("profiles")
              .select("id, username, email, avatar_url, color")
              .eq("family_id", fId),
          ]);
          set({
            familyDetails: familyRes.data,
            familyMembers: membersRes.data || [],
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
        }
      },

      updateFamilyNameInStore: async (newName: string) => {
        const fId = get().familyId;
        if (!fId) return;
        const { error } = await supabase
          .from("families")
          .update({ name: newName })
          .eq("id", fId);
        if (!error) {
          set((state) => ({
            familyDetails: state.familyDetails
              ? { ...state.familyDetails, name: newName }
              : null,
          }));
        } else {
          throw error;
        }
      },

      deleteEventOptimistic: async (eventId: string) => {
        const previousEvents = get().events;
        set({ events: previousEvents.filter((ev) => ev.id !== eventId) });

        const { error } = await supabase
          .from("events")
          .delete()
          .eq("id", eventId);
        if (error) {
          set({ events: previousEvents });
          alert("Could not delete event. Try again.");
        }
      },

      fetchSelectRecipeData: async () => {
        const fId = get().familyId;
        if (!fId) return;
        if (get().userRecipes.length === 0) set({ loading: true });
        try {
          const [userRes, globalRes] = await Promise.all([
            supabase
              .from("recipes")
              .select("*")
              .eq("family_id", fId)
              .order("title", { ascending: true }),
            supabase
              .from("recommended_recipes")
              .select("*")
              .order("created_at", { ascending: false }),
          ]);
          set({
            userRecipes: userRes.data || [],
            globalRecipes: globalRes.data || [],
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
        }
      },
      fetchShoppingData: async () => {
        const fId = get().familyId;
        if (!fId) return;

        // Agar data pehle se nahi hai toh loader dikhayein
        if (get().shoppingCategories.length === 0) set({ loading: true });

        try {
          const { data, error } = await supabase
            .from("shopping_categories")
            .select(
              `
              *,
              shopping_items (*)
            `,
            )
            .eq("family_id", fId)
            .eq("tab_type", "Shopping") // Aapne purane code mein ye filter lagaya tha
            .order("title", { ascending: true });

          if (error) throw error;

          set({ shoppingCategories: data || [], loading: false });
        } catch (error) {
          console.error("Shopping Fetch Error:", error);
          set({ loading: false });
        }
      },
      //     fetchGenericList: async (tabType: string, dateToFetch?: string) => {
      //       const fId = get().familyId;
      //       const currentUserId = get().userProfile?.id;
      //       if (!fId || !currentUserId) return;

      // set({ loading: true });
      //       // 🚀 Step 1: Check karein ke kya is tab ka data pehle se maujood hai?
      //       // Agar nahi hai, sirf tabhi loader dikhaein
      //       const existingData =
      //         tabType === "Chores"
      //           ? get().choresData
      //           : tabType === "Shopping"
      //             ? get().shoppingData
      //             : get().todoData;

      //       if (!existingData || existingData.length === 0) {
      //         set({ loading: true });
      //       }

      //       try {
      //         if (tabType === "Chores") {
      //           let query = supabase
      //             .from("chores")
      //             .select(`*, profiles!assigned_to(username, color)`)
      //             .eq("family_id", fId);
      //           query = query.or(
      //             `created_by.eq.${currentUserId},assigned_to.eq.${currentUserId},visibility.eq.shared,visibility.eq.view,visibility.eq.public`,
      //           );
      //           // query = query.or(
      //           //   `created_by.eq.${currentUserId},visibility.eq.public,assigned_to.eq.${currentUserId}`,
      //           // );
      //           if (dateToFetch) query = query.eq("date", dateToFetch);

      //           const { data, error } = await query;
      //           if (error) throw error;

      //           // 🚀 CHORES ka alag state update
      //           set({ choresData: data || [], loading: false });
      //         } else {
      //           const itemsKey =
      //             tabType === "Shopping" ? "shopping_items" : "tasks";
      //           let query = supabase
      //             .from("shopping_categories")
      //             .select(
      //               `*, ${itemsKey}(*, profiles!assigned_to(username, color))`,
      //             )
      //             .eq("family_id", fId)
      //             .eq("tab_type", tabType);
      //           query = query.or(
      //             `created_by.eq.${currentUserId},assigned_to.eq.${currentUserId},visibility.eq.shared,visibility.eq.view`,
      //             { foreignTable: itemsKey },
      //           );

      //           const { data, error } = await query;
      //           if (error) throw error;
      //           let finalData = data || [];

      //           // 🚀 Agar Categories khali hain toh "General" create karein
      //           if (
      //             finalData.length === 0 &&
      //             (tabType === "Shopping" || tabType === "To Do")
      //           ) {
      //             // A. Check karein kya database mein waqai nahi hai? (Race condition check)
      //             const { data: existingCat } = await supabase
      //               .from("shopping_categories")
      //               .select(
      //                 `*, ${itemsKey}(*, profiles!assigned_to(username, color))`,
      //               )
      //               .eq("family_id", fId)
      //               .eq("tab_type", tabType)
      //               .eq("title", "General")
      //               .maybeSingle();

      //             if (existingCat) {
      //               finalData = [existingCat];
      //             } else {
      //               // B. Agar waqai nahi hai, tab insert karein
      //               const { data: newCat, error: insertError } = await supabase
      //                 .from("shopping_categories")
      //                 .insert([
      //                   {
      //                     title: "General",
      //                     tab_type: tabType,
      //                     family_id: fId,
      //                     color: "#1E3A8A",
      //                   },
      //                 ])
      //                 .select(
      //                   `*, ${itemsKey}(*, profiles!assigned_to(username, color))`,
      //                 ); // Items ke sath select karein

      //               if (!insertError && newCat) {
      //                 finalData = newCat;
      //               }
      //             }
      //           }

      //           // 🚀 YAHAN 'finalData' USE KAREIN
      //           const formatted = finalData.map((cat) => ({
      //             ...cat,
      //             items: cat[itemsKey] || [],
      //           }));

      //           // 🚀 SHOPPING/TODO ka alag state update
      //           if (tabType === "Shopping")
      //             set({ shoppingData: formatted, loading: false });
      //           else set({ todoData: formatted, loading: false });
      //         }
      //       } catch (error) {
      //         console.error(error);
      //         set({ loading: false });
      //       }
      //     },
      fetchGenericList: async (tabType: string, dateToFetch?: string) => {
        const fId = get().familyId;
        const currentUserId = get().userProfile?.id;
        if (!fId || !currentUserId) return;

        // Loader show karo
        set({ loading: true });

        try {
          if (tabType === "Chores") {
            // Chores code same rahega
            let query = supabase
              .from("chores")
              .select(`*, profiles!assigned_to(username, color)`)
              .eq("family_id", fId);
            query = query.or(
              `created_by.eq.${currentUserId},assigned_to.eq.${currentUserId},visibility.eq.shared,visibility.eq.view`,
            );
            if (dateToFetch) query = query.eq("date", dateToFetch);
            const { data, error } = await query;
            if (error) throw error;
            set({ choresData: data || [], loading: false });
            return;
          }

          // Shopping / To Do
          const itemsKey = tabType === "Shopping" ? "shopping_items" : "tasks";

          // Step 1: Sab categories fetch karo WITHOUT items filter
          let { data: categories, error: catError } = await supabase
            .from("shopping_categories")
            .select("*")
            .eq("family_id", fId)
            .eq("tab_type", tabType)
            .order("title", { ascending: true });

          if (catError) throw catError;

          // Step 2: Agar koi category nahi hai, toh "General" create karo
          if (!categories || categories.length === 0) {
            const { data: newCat, error: insertError } = await supabase
              .from("shopping_categories")
              .insert([
                {
                  title: "General",
                  tab_type: tabType,
                  family_id: fId,
                  color: "#1E3A8A",
                },
              ])
              .select()
              .single();

            if (insertError) throw insertError;
            categories = [newCat];
          }

          // Step 3: Har category ke items alag se fetch karo
          const formatted = await Promise.all(
            categories.map(async (category) => {
              let query = supabase
                .from(itemsKey)
                .select(`*, profiles!assigned_to(username, color)`)
                .eq("category_id", category.id);

              // Visibility filter
              query = query.or(
                `created_by.eq.${currentUserId},assigned_to.eq.${currentUserId},visibility.eq.shared,visibility.eq.view`,
              );

              const { data: items, error: itemsError } = await query;
              if (itemsError) throw itemsError;

              return {
                ...category,
                items: items || [],
              };
            }),
          );

          // Step 4: State update
          if (tabType === "Shopping") {
            set({ shoppingData: formatted, loading: false });
          } else {
            set({ todoData: formatted, loading: false });
          }
        } catch (error) {
          console.error("fetchGenericList error:", error);
          set({ loading: false });
        }
      },
      chatHistory: [
        { id: "1", text: "Hello! I am your Family Assistant.", sender: "ai" },
      ],
      addMessage: (msg) =>
        set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
      clearChat: () =>
        set({
          chatHistory: [
            {
              id: "1",
              text: "Hello! I am your Family Assistant.",
              sender: "ai",
            },
          ],
        }),
      clearStore: () =>
        set({
          familyId: null,
          userData: null,
          userProfile: null,
          familyDetails: null,
          familyMembers: [],
          recipes: [],
          mealData: {},
          userRecipes: [],
          globalRecipes: [],
          events: [],
          shoppingCategories: [],
          loading: false,
        }),
    }),
    {
      name: "family-app-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        familyId: state.familyId,
        userData: state.userData,
        userProfile: state.userProfile,
        chatHistory: state.chatHistory,
      }),
    },
  ),
);
