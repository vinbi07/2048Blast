import React from "react";
import { View, StyleSheet, Text } from "react-native";
import GameBoard from "./components/GameBoard";
import { theme, tokens } from "./utils/theme";

const App = () => {
  return (
    <View style={styles.container}>
      <View style={styles.bgOrbLarge} pointerEvents="none" />
      <View style={styles.bgOrbSmall} pointerEvents="none" />
      <View style={styles.headerWrap}>
        <Text style={styles.title}>2048 Blast</Text>
        <Text style={styles.subtitle}>TaskBlast Arcade Control Deck</Text>
      </View>
      <GameBoard />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.screenBg,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 40,
    paddingBottom: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.sm,
  },
  bgOrbLarge: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 300,
    top: -90,
    right: -80,
    backgroundColor: "rgba(64, 224, 255, 0.12)",
  },
  bgOrbSmall: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 220,
    bottom: -70,
    left: -90,
    backgroundColor: "rgba(34, 184, 214, 0.1)",
  },
  headerWrap: {
    width: "100%",
    maxWidth: 520,
    marginBottom: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.xs,
  },
  title: {
    color: theme.textPrimary,
    fontSize: tokens.typography.display,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  subtitle: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.subtitle,
    marginTop: 2,
    fontWeight: "600",
  },
});

export default App;
