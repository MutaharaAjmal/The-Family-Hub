import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../src/api/supabase";
import { AppText } from "../src/components/AppText";
import { AppHeader } from "../src/components/AppHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import ManageTabCategoriesScreen from "../features/lists/screens/ManageTabCategories";

export default function ManageCategories() {
  return <ManageTabCategoriesScreen />;
}
