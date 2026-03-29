import React, { useEffect, useRef } from "react";
import { Animated, Text, View, StyleSheet } from "react-native";
import {
  getTileBackgroundColor,
  getTileFontSize,
  getTileTextColor,
  tokens,
} from "../utils/theme";

const TileCell = ({ value, size, status }) => {
  const spawnScale = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (!value || status !== "playing") {
      previousValueRef.current = value;
      return;
    }

    const previousValue = previousValueRef.current;
    const isSpawn = previousValue === 0 && value > 0;
    const isMerge = previousValue > 0 && value > previousValue;

    if (isSpawn) {
      spawnScale.setValue(0.85);
      Animated.spring(spawnScale, {
        toValue: 1,
        speed: 16,
        bounciness: 10,
        useNativeDriver: true,
      }).start();
    }

    if (isMerge) {
      pulseScale.setValue(1);
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.09,
          duration: tokens.motion.fast,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: tokens.motion.normal,
          useNativeDriver: true,
        }),
      ]).start();
    }

    previousValueRef.current = value;
  }, [pulseScale, spawnScale, status, value]);

  return (
    <Animated.View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor: getTileBackgroundColor(value),
          transform: [{ scale: Animated.multiply(spawnScale, pulseScale) }],
        },
      ]}
    >
      <View style={styles.innerFrame}>
        <Text
          style={[
            styles.cellText,
            {
              color: getTileTextColor(value),
              fontSize: getTileFontSize(value),
            },
          ]}
        >
          {value === 0 ? "" : value}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cell: {
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: "rgba(196, 241, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    ...tokens.shadows.soft,
  },
  innerFrame: {
    width: "100%",
    height: "100%",
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: "rgba(240, 252, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: {
    fontWeight: "800",
  },
});

export default TileCell;
