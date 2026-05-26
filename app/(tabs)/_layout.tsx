import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Analytics } from "../../src/utils/Analytics";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1E3A8A",
        tabBarInactiveTintColor: "#8E8E93", // Inactive icon color
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F2F2F7",
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => Analytics.List.tabSwitched({ tab_name: "Home" }),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={24} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => Analytics.List.tabSwitched({ tab_name: "Calendar" }),
        }}
      />

      <Tabs.Screen
        name="lists"
        options={{
          title: "Lists",
          tabBarIcon: ({ color }) => (
            <Ionicons name="list-circle-outline" size={24} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => Analytics.List.tabSwitched({ tab_name: "Lists" }),
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "silverware-fork-knife" : "silverware-fork-knife"}
              size={24}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => Analytics.List.tabSwitched({ tab_name: "Recipes" }),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={24}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => Analytics.List.tabSwitched({ tab_name: "Settings" }),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
