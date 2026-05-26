import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

const SkeletonCard = () => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.strip} />
      <View style={styles.info}>
        <View style={styles.titleBar} />
        <View style={styles.metaBar} />
      </View>
      <View style={styles.arrow} />
    </Animated.View>
  );
};

export const RecipeSkeletonList = () => (
  <View style={{ padding: 20 }}>
    {[1, 2, 3, 4].map((i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  strip: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 15,
    backgroundColor: "#E2E8F0",
  },
  info: { flex: 1, gap: 8 },
  titleBar: {
    height: 14,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
    width: "65%",
  },
  metaBar: {
    height: 11,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    width: "45%",
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
});
