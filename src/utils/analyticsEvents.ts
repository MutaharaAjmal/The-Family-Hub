/**
 * Family Hub — Event Dictionary
 * All 33 Event names defined in one place
 */

export const EVENTS = {
  // AUTH
  SIGNED_IN: "user_signed_in",
  SIGNED_OUT: "user_signed_out",
  SIGNED_UP: "user_signed_up",
  DELETE_ACCOUNT: "user_account_deleted",

  // LIST / SHOPPING
  ITEM_ADDED: "item_added",
  ITEM_UPDATED: "item_updated",
  ITEM_DELETED: "item_deleted",
  ITEM_TOGGLED: "item_toggled",
  BULK_TOGGLED: "bulk_items_toggled",
  BULK_CLEARED: "bulk_items_cleared",
  CATEGORY_ADDED: "category_added",
  TAB_SWITCHED: "list_tab_switched",
  MEAL_SYNCED: "meal_plan_synced",

  // MEAL PLANNER
  MEAL_ADDED: "meal_added_to_planner",
  MEAL_DELETED: "meal_deleted_from_planner",
  MEAL_SUGGESTION_GEN: "meal_suggestion_generated",
  MEAL_SUGGESTION_CONFIRM: "meal_suggestion_confirmed",
  MEAL_SUGGESTION_DISMISS: "meal_suggestion_dismissed",
  MEAL_WEEK_CHANGE: "meal_week_changed",

  // RECIPES
  RECIPE_MANUAL: "recipe_added_manual",
  RECIPE_LINK: "recipe_added_via_link",
  RECIPE_SCAN: "recipe_added_via_scan",
  RECIPE_DELETED: "recipe_deleted",
  RECIPE_VIEWED: "recipe_viewed",
  RECIPE_SEARCHED: "recipe_searched",

  // CALENDAR
  EVENT_CREATED: "event_created",
  EVENT_UPDATED: "event_updated",
  EVENT_DELETED: "event_deleted",
  DATE_SELECTED: "calendar_date_changed",

  // PROFILE & FAMILY
  PROFILE_UPDATED: "profile_updated",
  FAMILY_CREATED: "family_created",
  FAMILY_JOINED: "family_joined",
  FAMILY_UPDATED: "family_name_updated",
  FAMILY_INVITE: "family_invite_clicked",
  APP_OPENED: "application_opened",
} as const;
