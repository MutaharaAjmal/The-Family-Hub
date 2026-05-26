import React, { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";

export const Colors = {
  light: {
    background: "#F8FAFC",
    text: "#1A1A1A",
    card: "#F5F5F5",
    primary: "#1E3A8A",
    subText: "#999",
  },
  dark: {
    background: "#121212",
    text: "#FFFFFF",
    card: "#1E1E1E",
    primary: "#3B82F6",
    subText: "#AAA",
  },
};
export const COLORS = {
  primary: "#6366F1",
  // primary: "#1E3A8A",
  primaryLight: "#818CF8",
  primaryDark: "#4F46E5",
  secondary: "#10B981",
  accent: "#F59E0B",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  text: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  success: "#10B981",
  error: "#EF4444",
};

// Category preset colors
export const CATEGORY_COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
];
const ThemeContext = createContext({
  theme: "light",
  isDark: false,
  colors: Colors.light,
  setTheme: (theme: string) => {},
});

export const ThemeProvider = ({ children }: any) => {
  const systemTheme = useColorScheme();
  const [theme, setThemeState] = useState("light"); // Naam badal dein taake confusion na ho
  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
  };

  const activeTheme = theme === "system" ? systemTheme || "light" : theme;
  const isDark = activeTheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
