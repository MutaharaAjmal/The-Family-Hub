import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  DeviceEventEmitter,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
import { AppHeader } from "../../src/components/AppHeader";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "../../src/components/AppText";
import { useAppStore } from "../../src/store/useAppStore";
import { SafeAreaView } from "react-native-safe-area-context";
import ListTabContent from "../../features/lists/screens/ListTabContent";

export default function ShoppingListScreen() {
  const router = useRouter();
  const { initialTab } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<any>("Shopping");
  const [showMenu, setShowMenu] = useState(false); // Menu control karne ke liye
  const tabs = ["Shopping", "To Do", "Chores"];
  const familyId = useAppStore((state) => state.familyId);
  useEffect(() => {
    if (initialTab && tabs.includes(initialTab as string)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1E3A8A" }}
      edges={["left", "right", "top"]}
    >
      {/* <AppHeader
        title="Lists"
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={setActiveTab}
      /> */}
      <AppHeader
        title="Lists"
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={setActiveTab}
        showBack={false} // Back button chupayein
        // leftIconName="ellipsis-vertical" // 3 dots icon
        leftIconName="chevron-back"
        onLeftIconPress={() => router.back()}
        rightIconName="ellipsis-vertical"
        onRightIconPress={() => setShowMenu(true)}
        // onLeftIconPress={() => setShowMenu(true)} // Click par menu khule
      />
      {/* --- DROPDOWN MENU --- */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  router.push({
                    pathname: "/manange-categories", // Apni nayi screen ka path
                    params: { tabType: activeTab, familyId: familyId },
                  });
                }}
              >
                <AppText style={styles.menuText}>
                  Manage {activeTab} Categories
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  router.push({
                    pathname: "/activity", // Apni nayi screen ka path
                    params: { tabType: activeTab, familyId: familyId },
                  });
                }}
              >
                <AppText style={styles.menuText}>View History</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <View style={styles.mainContent}>
        <ListTabContent tabType={activeTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E3A8A",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#F4F7F9",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  dropdownMenu: {
    position: "absolute",
    top: 87, // Header ke bilkul niche
    right: 15, // 👈 Left ki jagah Right karein taake dots ke niche aaye
    backgroundColor: "white",
    borderRadius: 12, // Thora zyada round pyara lagta hai
    padding: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    minWidth: 220, // Thori width barha di taake text pura aaye
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
});
