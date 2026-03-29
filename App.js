import React from "react";
import { View, StyleSheet, Text } from "react-native";
import GameBoard from "./components/GameBoard";
import { theme } from "./utils/theme";

const App = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.title}>2048 Blast</Text>
        <Text style={styles.subtitle}>TaskBlast Arcade Edition</Text>
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
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 14,
  },
  headerWrap: {
    width: "100%",
    maxWidth: 380,
    marginBottom: 14,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },
});

export default App;
