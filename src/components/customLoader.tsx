import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";

interface LoaderProps {
  size?: number;
  color?: string;
}

export const CustomLoader: React.FC<LoaderProps> = ({
  size = 80,
  color = "#1E3A8A",
}) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000, // Speed of rotation
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  // Map 0-1 range to degrees
  const rotateOutput = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.loader,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: "#E2E8F0", // Background circle color (Light Grey)
            borderTopColor: color, // Active rotating color (Deep Blue)
            transform: [{ rotate: rotateOutput }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    borderWidth: 6, // Thickness of the curve
  },
});
