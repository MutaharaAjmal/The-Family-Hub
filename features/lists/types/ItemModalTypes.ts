// types/ItemModalTypes.ts

import { COLORS } from "../../../src/constants/theme";

export type VisibilityType = "private" | "view" | "shared";

export interface FamilyMember {
  id: string;
  username: string;
  color?: string;
}

export interface Category {
  id: string;

  color?: string;
  tab_type?: string;
}

export interface EditingItem {
  id: string;
  name?: string;
  title?: string;
  note?: string;
  date?: string;
  category_id?: string;
  assigned_to?: string;
  visibility?: VisibilityType;
  shared_with?: string[];
  created_by?: string;
  is_completed?: boolean;
}

export interface ItemModalProps {
  // ── Modal State ──────────────────────────────────
  isOpen: boolean;
  closeModal: () => void;
  submitting: boolean;
  isExpanded: boolean;

  // ── Item Fields ──────────────────────────────────
  itemName: string;
  setItemName: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  unit: string;
  setUnit: (value: string) => void;

  // ── Visibility ───────────────────────────────────
  visibility: VisibilityType;
  setVisibility: (value: VisibilityType) => void;

  // ── Category ─────────────────────────────────────
  selectedCat: Category | null;
  setSelectedCat: (cat: Category | null) => void;
  displayData: Category[];
  showCategoryPicker: boolean;
  setShowCategoryPicker: (value: boolean) => void;

  // ── Assign To ────────────────────────────────────
  assignedTo: FamilyMember | null;
  setAssignedTo: (member: FamilyMember | null) => void;
  showAssignedPicker: boolean;
  setShowAssignedPicker: (value: boolean) => void;

  // ── Date ─────────────────────────────────────────
  baseDate: Date;
  setBaseDate: (date: Date) => void;
  selectedFullDate: string;
  setSelectedFullDate: (date: string) => void;
  showDatePicker: boolean;
  setShowDatePicker: (value: boolean) => void;

  // ── Share / View Picker ──────────────────────────
  sharedMembers: string[];
  setSharedMembers: (members: string[]) => void;
  showSharedPicker: boolean;
  setShowSharedPicker: (value: boolean) => void;
  activePickerType: "shared" | "view" | null;
  setActivePickerType: (type: "shared" | "view" | null) => void;

  // ── Add Category Modal ───────────────────────────
  showAddCategoryModal: boolean;
  setShowAddCategoryModal: (value: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (value: string) => void;
  selectedCategoryColor: string;
  setSelectedCategoryColor: (color: string) => void;
  addingCategory: boolean;
  handleAddCategory: () => Promise<void>;

  // ── Editing ──────────────────────────────────────
  editingItem: EditingItem | null;

  // ── Family Data ──────────────────────────────────
  familyMembers: FamilyMember[];
  currentUserId?: string;

  // ── Actions ──────────────────────────────────────
  handleAddItem: () => Promise<void>;

  // ── Tab Type ─────────────────────────────────────
  tabType: string;
}
