import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import {
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import useGameLogic from "../utils/useGameLogic";
import { postToHost } from "../utils/bridge";
import TileCell from "./TileCell";
import { theme } from "../utils/theme";

const GRID_SIZE = 4;
const TWO_APPEARANCE_PERCENTAGE = 0.7;

const createEmptyBoard = () =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

const getRandomItem = (arr) => {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
};

const cloneBoard = (board) => board.map((row) => [...row]);

const boardsEqual = (a, b) => {
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (a[r][c] !== b[r][c]) {
        return false;
      }
    }
  }
  return true;
};

const getHighestTile = (board) => Math.max(0, ...board.flat());

const addNumber = (grid) => {
  const options = [];
  for (let i = 0; i < GRID_SIZE; i += 1) {
    for (let j = 0; j < GRID_SIZE; j += 1) {
      if (grid[i][j] === 0) {
        options.push({ x: i, y: j });
      }
    }
  }

  if (options.length > 0) {
    const spot = getRandomItem(options);
    grid[spot.x][spot.y] = Math.random() <= TWO_APPEARANCE_PERCENTAGE ? 2 : 4;
  }
};

const createInitialBoard = () => {
  const grid = createEmptyBoard();
  addNumber(grid);
  addNumber(grid);
  return grid;
};

const GameBoard = () => {
  const {
    swipeLeft,
    swipeRight,
    swipeUp,
    swipeDown,
    isGameWon,
    isGameLost,
    getScore,
    resetScore,
  } = useGameLogic();

  const [board, setBoard] = useState(() => createInitialBoard());

  const score = getScore();
  const highestTile = useMemo(() => getHighestTile(board), [board]);
  const hasWon = isGameWon(board);
  const hasLost = isGameLost(board);
  const status = hasWon ? "won" : hasLost ? "lost" : "playing";

  const tileSize = useMemo(() => {
    const screenWidth = Dimensions.get("window").width;
    const maxBoardWidth = Math.min(screenWidth - 32, 356);
    const innerWidth = maxBoardWidth - 20;
    return Math.floor(innerWidth / GRID_SIZE) - 8;
  }, []);

  useEffect(() => {
    resetScore();
  }, []);

  useEffect(() => {
    postToHost({
      type: "scoreUpdate",
      score,
      highestTile,
      status,
      source: "2048",
      ts: Date.now(),
    });

    postToHost({
      type: "tileUpdate",
      highestTile,
      score,
      source: "2048",
      ts: Date.now(),
    });
  }, [score, highestTile, status]);

  const applyMove = useCallback(
    (moveFn) => {
      setBoard((prevBoard) => {
        const nextBoard = moveFn(cloneBoard(prevBoard));

        if (boardsEqual(prevBoard, nextBoard)) {
          return prevBoard;
        }

        addNumber(nextBoard);
        return nextBoard;
      });
    },
    [setBoard],
  );

  const handleSwipeGesture = ({ nativeEvent }) => {
    const { translationX, translationY, state } = nativeEvent;

    if (state !== State.END || hasWon || hasLost) {
      return;
    }

    if (Math.abs(translationX) > Math.abs(translationY)) {
      if (translationX < 0) {
        applyMove(swipeLeft);
      } else {
        applyMove(swipeRight);
      }
    } else if (translationY < 0) {
      applyMove(swipeUp);
    } else {
      applyMove(swipeDown);
    }
  };

  const handleKeyboardEvent = useCallback(
    (event) => {
      if (hasWon || hasLost) {
        return;
      }

      const key = event.key;
      const keyCode = event.keyCode;

      const isArrow = [37, 38, 39, 40].includes(keyCode);
      if (isArrow || key?.startsWith("Arrow")) {
        if (typeof event.preventDefault === "function") {
          event.preventDefault();
        }
      }

      if (keyCode === 37 || key === "ArrowLeft") {
        applyMove(swipeLeft);
      } else if (keyCode === 39 || key === "ArrowRight") {
        applyMove(swipeRight);
      } else if (keyCode === 38 || key === "ArrowUp") {
        applyMove(swipeUp);
      } else if (keyCode === 40 || key === "ArrowDown") {
        applyMove(swipeDown);
      }
    },
    [applyMove, hasLost, hasWon, swipeDown, swipeLeft, swipeRight, swipeUp],
  );

  useEffect(() => {
    if (Platform.OS !== "web") {
      return undefined;
    }

    window.addEventListener("keydown", handleKeyboardEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyboardEvent);
    };
  }, [handleKeyboardEvent]);

  const handleRestart = () => {
    resetScore();
    setBoard(createInitialBoard());
    postToHost({
      type: "scoreUpdate",
      score: 0,
      highestTile: 0,
      status: "playing",
      source: "2048",
      ts: Date.now(),
    });
  };

  return (
    <View style={styles.panel}>
      <View style={styles.hudRow}>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>Score</Text>
          <Text style={styles.hudValue}>{score}</Text>
        </View>

        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>Highest Tile</Text>
          <Text style={styles.hudValue}>{highestTile}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
        <Text style={styles.restartText}>Restart Round</Text>
      </TouchableOpacity>

      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.board}>
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => (
                <View key={colIndex} style={styles.tileWrap}>
                  <TileCell value={cell} size={tileSize} />
                </View>
              ))}
            </View>
          ))}

          <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
            <View style={styles.gestureHandlerContainer} />
          </PanGestureHandler>
        </View>
      </GestureHandlerRootView>

      {hasWon && (
        <Text style={[styles.messageText, { color: theme.success }]}>
          You reached 2048. Stellar run!
        </Text>
      )}

      {hasLost && (
        <Text style={[styles.messageText, { color: theme.danger }]}>
          No moves left. Restart and try a new path.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 18,
    padding: 12,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.panelBorder,
  },
  hudRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hudCard: {
    flex: 1,
    backgroundColor: theme.boardBg,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    marginHorizontal: 4,
  },
  hudLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  hudValue: {
    marginTop: 2,
    color: theme.textPrimary,
    fontSize: 22,
    fontWeight: "900",
  },
  restartButton: {
    marginTop: 10,
    marginBottom: 12,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: theme.accent,
  },
  restartText: {
    color: theme.textDark,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  gestureRoot: {
    alignSelf: "center",
  },
  board: {
    backgroundColor: theme.boardBg,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.22)",
  },
  row: {
    flexDirection: "row",
  },
  tileWrap: {
    margin: 4,
  },
  gestureHandlerContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  messageText: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
  },
});

export default GameBoard;
