import { ActivityIndicator, View } from "react-native";
import { AppText } from "./AppText";
import { listStyles } from "../../features/lists/components/ItemModal";
export const DeleteLoader = () => (
  <View
    style={{
      ...listStyles.container, // Use same dimensions as container
      position: "absolute",
      backgroundColor: "rgba(255, 255, 255, 0.7)", // Dimmed background
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999, // Ensure it's on top
      width: "100%",
      height: "100%",
    }}
  >
    <View
      style={{
        backgroundColor: "white",
        padding: 30,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color="#1E3A8A" />
      <AppText style={{ marginTop: 12, color: "#1E3A8A", fontWeight: "600" }}>
        Deleting Item...
      </AppText>
    </View>
  </View>
);
