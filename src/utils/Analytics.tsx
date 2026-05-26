import { posthog } from "./postHog"; // tumhara existing posthog instance
import { EVENTS } from "./analyticsEvents"; // Nayi file import karein
// ─── LOW-LEVEL CAPTURE ────────────────────────────────────────────────────────

const capture = (event: string, props?: Record<string, any>) => {
  posthog.capture(event, props);
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────

const Auth = {
  /** User ne login kiya */
  signedIn: (props: { user_id: string; email: string }) =>
    capture(EVENTS.SIGNED_IN, props),
  signedUp: (props: { method: string; email: string | undefined }) =>
    capture(EVENTS.SIGNED_UP, props),
  /** User ne logout kiya */
  signedOut: () => capture(EVENTS.SIGNED_OUT),
  deleteAccount: (props: { email: string | undefined }) =>
    capture(EVENTS.DELETE_ACCOUNT, props),
};

// ─── LIST TAB (Shopping / Todo / Chores) ─────────────────────────────────────

const List = {
  /** Naya item add kiya */
  itemAdded: (props: {
    tab_type: "Shopping" | "To Do" | "Chores";
    category?: string;
    visibility?: "private" | "view" | "shared";
    assigned_to?: string;
  }) => capture(EVENTS.ITEM_ADDED, props),

  /** Item edit/update kiya */
  itemUpdated: (props: {
    tab_type: "Shopping" | "To Do" | "Chores";
    item_name: string;
  }) => capture(EVENTS.ITEM_UPDATED, props),

  /** Item delete kiya */
  itemDeleted: (props: {
    tab_type: "Shopping" | "To Do" | "Chores";
    item_name: string;
  }) => capture(EVENTS.ITEM_DELETED, props),

  /** Item complete/uncomplete kiya */
  itemToggled: (props: {
    tab_type: "Shopping" | "To Do" | "Chores";
    item_name: string;
    is_completed: boolean;
  }) => capture(EVENTS.ITEM_TOGGLED, props),

  /** Sari items ek saath mark/unmark ki */
  bulkToggled: (props: {
    tab_type: string;
    total_items: number;
    marked_complete: boolean;
  }) => capture(EVENTS.BULK_TOGGLED, props),

  /** Completed items saaf kiye (Clear Completed) */
  bulkCleared: (props: { tab_type: string; cleared_count: number }) =>
    capture(EVENTS.BULK_CLEARED, props),

  /** Nayi category banayi */
  categoryAdded: (props: { tab_type: string; category_name: string }) =>
    capture(EVENTS.CATEGORY_ADDED, props),

  /** Tab switch kiya (Shopping → Chores etc.) */
  tabSwitched: (props: {
    tab_name:
      | "Home"
      | "Calendar"
      | "Lists"
      | "Recipes"
      | "Settings"
      | "Shopping"
      | "To Do"
      | "Chores";
  }) => capture(EVENTS.TAB_SWITCHED, props),

  /** Meal plan se shopping list mein sync kiya */
  mealSynced: (props: { items_added: number; meals_selected: number }) =>
    capture(EVENTS.MEAL_SYNCED, props),
};

// ─── MEAL PLANNER ─────────────────────────────────────────────────────────────

const Meal = {
  /** Recipe planner mein add ki */

  addedToPlanner: (props: {
    recipe_title: string;
    meal_type: "Breakfast" | "Lunch" | "Dinner";
    meal_date: string;
    is_global_recipe?: boolean;
  }) => capture(EVENTS.MEAL_ADDED, props),

  /** Meal planner se remove ki */
  deletedFromPlanner: (props: { recipe_title?: string; meal_type?: string }) =>
    capture(EVENTS.MEAL_DELETED, props),

  /** AI ne suggestions generate kiye (sparkles button) */
  suggestionGenerated: (props: {
    slots_suggested: number;
    source: "my_recipes" | "global" | "mixed";
  }) => capture(EVENTS.MEAL_SUGGESTION_GEN, props),

  /** User ne suggestion accept kiya (+ button) */
  suggestionConfirmed: (props: {
    recipe_title: string;
    meal_type: string;
    is_global_recipe?: boolean;
  }) => capture(EVENTS.MEAL_SUGGESTION_CONFIRM, props),

  /** User ne suggestion reject kiya (x button) */
  suggestionDismissed: (props: { meal_type: string }) =>
    capture(EVENTS.MEAL_SUGGESTION_DISMISS, props),

  /** Week change kiya (agle/pichle week arrow) */
  weekChanged: (props: { direction: "next" | "prev"; week_offset: number }) =>
    capture(EVENTS.MEAL_WEEK_CHANGE, props),
};

// ─── RECIPE ───────────────────────────────────────────────────────────────────

const Recipe = {
  /** Recipe manually add ki */
  addedManual: (props: { recipe_title: string }) =>
    capture(EVENTS.RECIPE_MANUAL, props),

  /** Recipe link se import ki */
  addedViaLink: (props: { recipe_title: string; source_url: string }) =>
    capture(EVENTS.RECIPE_LINK, props),

  /** Recipe camera scan se add ki */
  addedViaScan: (props: { recipe_title: string }) =>
    capture(EVENTS.RECIPE_SCAN, props),

  /** Recipe delete ki */
  deleted: (props: {
    recipe_count: number;
    also_removed_from_planner: boolean;
  }) => capture(EVENTS.RECIPE_DELETED, props),

  /** Recipe detail page khola */
  viewed: (props: { recipe_title: string; recipe_id: string }) =>
    capture(EVENTS.RECIPE_VIEWED, props),

  /** Search bar mein kuch likha */
  searched: (props: { query: string; results_count: number }) =>
    capture(EVENTS.RECIPE_SEARCHED, props),
};

// ─── EVENTS (Calendar) ────────────────────────────────────────────────────────

const Event = {
  /** Naya calendar event banaya */
  created: (props: {
    title: string;
    visibility: string;
    is_all_day: boolean;
    attendees_count: number;
  }) => capture(EVENTS.EVENT_CREATED, props),

  /** Event edit kiya */
  updated: (props: { title: string; event_id: string }) =>
    capture(EVENTS.EVENT_UPDATED, props),

  /** Event delete kiya */
  deleted: (props: { deleted_count: number }) =>
    capture(EVENTS.EVENT_DELETED, props),

  /** Calendar mein koi date select ki */
  dateSelected: (props: { date: string }) =>
    capture(EVENTS.DATE_SELECTED, props),

  // In your Analytics.ts under the Event object:
  visibilityChanged: (props: { new_visibility: string }) =>
    capture("event_visibility_changed", props),

  colorChanged: (props: { selected_color: string }) =>
    capture("event_color_changed", props),
};

// ─── PROFILE ─────────────────────────────────────────────────────────────────

const Profile = {
  /** Profile save kiya (username/avatar/color) */
  updated: (props: {
    changed_username: boolean;
    changed_avatar: boolean;
    changed_color: boolean;
  }) => capture(EVENTS.PROFILE_UPDATED, props),
};

// ─── FAMILY ──────────────────────────────────────────────────────────────────

const Family = {
  /** Nayi family banayi */
  created: (props: { family_id: string }) =>
    capture(EVENTS.FAMILY_CREATED, props),
  /** Family join ki */
  joined: (props: { family_id: string }) =>
    capture(EVENTS.FAMILY_JOINED, props),

  editFamily: (props: { new_name: string }) =>
    capture(EVENTS.FAMILY_UPDATED, props),

  /** Invite button click tracking */
  inviteClicked: (props: { family_id: string }) =>
    capture(EVENTS.FAMILY_INVITE, props),
};

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export const Analytics = {
  Auth,
  List,
  Meal,
  Recipe,
  Event,
  Profile,
  Family,
};
