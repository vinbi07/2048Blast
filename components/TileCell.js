import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, StyleSheet } from "react-native";
import { getTileBackgroundColor, getTileTextColor } from "../utils/theme";

const TileCell = ({ value, size }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!value) return;

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.08,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 110,
        useNativeDriver: true,
      }),
    ]).start();
  }, [value, scale]);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            backgroundColor: getTileBackgroundColor(value),
          },
        ]}
      >
        <Text style={[styles.cellText, { color: getTileTextColor(value) }]}> 
          {value === 0 ? "" : value}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cell: {
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cellText: {
    fontSize: 24,
    fontWeight: "800",
  },
});

export default TileCell;
