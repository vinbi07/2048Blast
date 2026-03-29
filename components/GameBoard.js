import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import {
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import useGameLogic from "../utils/useGameLogic";
import {
  BRIDGE_EVENT_SOURCE,
  emitBridgeEvent,
} from "../utils/bridge";
import TileCell from "./TileCell";
import { theme, tokens } from "../utils/theme";

const GRID_SIZE = 4;
const TWO_APPEARANCE_PERCENTAGE = 0.7;
const BEST_SCORE_KEY = "taskblast_2048_best_score";

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

const getStatusText = (status) => {
  if (status === "won") {
    return "Sector unlocked: 2048 achieved";
  }

  if (status === "lost") {
    return "Signal lost: no legal moves";
  }

  return "Grid stable: combine matching tiles";
};

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
  const [bestScore, setBestScore] = useState(0);
  const statusFade = useRef(new Animated.Value(0)).current;
  const previousHighestRef = useRef(0);
  const previousStatusRef = useRef("playing");
  const mountedRef = useRef(false);
  const { width, height } = useWindowDimensions();

  const score = getScore();
  const highestTile = useMemo(() => getHighestTile(board), [board]);
  const hasWon = isGameWon(board);
  const hasLost = isGameLost(board);
  const status = hasWon ? "won" : hasLost ? "lost" : "playing";
  const isLandscape = width > height;

  const boardSize = useMemo(() => {
    const horizontalPadding = tokens.spacing.md * 2;
    const maxWidth = isLandscape ? Math.min(width * 0.56, 440) : 420;
    const maxHeight = Math.max(280, height - (isLandscape ? 120 : 320));
    return Math.floor(Math.min(width - horizontalPadding, maxWidth, maxHeight));
  }, [height, isLandscape, width]);

  const tileSize = useMemo(() => {
    const boardPadding = tokens.spacing.sm * 2;
    const totalTileMargins = tokens.spacing.xxs * 2 * GRID_SIZE;
    return Math.max(
      52,
      Math.floor((boardSize - boardPadding - totalTileMargins) / GRID_SIZE),
    );
  }, [boardSize]);

  useEffect(() => {
    resetScore();
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      const parsed = Number(window.localStorage.getItem(BEST_SCORE_KEY));
      if (Number.isFinite(parsed) && parsed >= 0) {
        setBestScore(Math.floor(parsed));
      }
    }
  }, [resetScore]);

  useEffect(() => {
    if (score <= bestScore) {
      return;
    }

    setBestScore(score);
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(BEST_SCORE_KEY, String(score));
    }
  }, [bestScore, score]);

  useEffect(() => {
    emitBridgeEvent({
      type: "scoreUpdate",
      score,
      highestTile,
      status,
      source: BRIDGE_EVENT_SOURCE,
      ts: Date.now(),
    });

    if (previousHighestRef.current !== highestTile) {
      emitBridgeEvent({
        type: "tileUpdate",
        highestTile,
        score,
        status,
        source: BRIDGE_EVENT_SOURCE,
        ts: Date.now(),
      });
      previousHighestRef.current = highestTile;
    }

    const isTerminal = status === "won" || status === "lost";
    if (mountedRef.current && isTerminal && previousStatusRef.current !== status) {
      emitBridgeEvent({
        type: "sessionEnd",
        score,
        highestTile,
        status,
        source: BRIDGE_EVENT_SOURCE,
        ts: Date.now(),
      });
    }

    previousStatusRef.current = status;
    mountedRef.current = true;
  }, [score, highestTile, status]);

  useEffect(() => {
    Animated.timing(statusFade, {
      toValue: status === "playing" ? 0 : 1,
      duration: tokens.motion.normal,
      useNativeDriver: true,
    }).start();
  }, [status, statusFade]);

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
    emitBridgeEvent({
      type: "sessionEnd",
      score,
      highestTile,
      status: "restart-finalize",
      source: BRIDGE_EVENT_SOURCE,
      ts: Date.now(),
    });

    resetScore();
    previousHighestRef.current = 0;
    previousStatusRef.current = "playing";
    setBoard(createInitialBoard());

    emitBridgeEvent({
      type: "scoreUpdate",
      score: 0,
      highestTile: 0,
      status: "playing",
      source: BRIDGE_EVENT_SOURCE,
      ts: Date.now(),
    });
  };

  return (
    <View style={styles.panel}>
      <View style={styles.topHudRow}>
        <View>
          <Text style={styles.boardTitle}>TaskBlast Grid</Text>
          <Text style={styles.boardSubtitle}>Arcade Sector Control</Text>
        </View>
        <View style={[styles.statusChip, status === "lost" && styles.statusChipDanger]}>
          <Text style={styles.statusChipText}>{status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={[styles.hudRow, isLandscape && styles.hudRowLandscape]}>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>Current</Text>
          <Text style={styles.hudValue}>{score}</Text>
        </View>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>Highest Tile</Text>
          <Text style={styles.hudValue}>{highestTile}</Text>
        </View>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>Best</Text>
          <Text style={styles.hudValue}>{bestScore}</Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleRestart}>
          <Text style={styles.secondaryButtonText}>New Run</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleRestart}>
          <Text style={styles.primaryButtonText}>Restart</Text>
        </TouchableOpacity>
      </View>

      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={[styles.board, { width: boardSize, height: boardSize }]}> 
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => (
                <View key={colIndex} style={styles.tileWrap}>
                  <TileCell value={cell} size={tileSize} status={status} />
                </View>
              ))}
            </View>
          ))}

          <Animated.View
            pointerEvents="none"
            style={[styles.statusOverlay, { opacity: statusFade }]}
          >
            <Text style={styles.statusOverlayText}>{status === "won" ? "VICTORY" : "NO MOVES"}</Text>
          </Animated.View>

          <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
            <View style={styles.gestureHandlerContainer} />
          </PanGestureHandler>
        </View>
      </GestureHandlerRootView>

      <Text
        style={[
          styles.messageText,
          status === "won" && styles.messageTextSuccess,
          status === "lost" && styles.messageTextDanger,
        ]}
      >
        {getStatusText(status)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    width: "100%",
    maxWidth: 520,
    borderRadius: tokens.radii.xl,
    padding: tokens.spacing.md,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    ...tokens.shadows.panel,
  },
  topHudRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacing.sm,
  },
  boardTitle: {
    color: theme.textPrimary,
    fontSize: tokens.typography.title,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  boardSubtitle: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.body,
    marginTop: 2,
    fontWeight: "600",
  },
  statusChip: {
    minWidth: 88,
    borderRadius: tokens.radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(63, 255, 177, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(63, 255, 177, 0.45)",
    alignItems: "center",
  },
  statusChipDanger: {
    backgroundColor: "rgba(255, 79, 111, 0.17)",
    borderColor: "rgba(255, 79, 111, 0.45)",
  },
  statusChipText: {
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.label,
    letterSpacing: 0.6,
    fontWeight: "800",
  },
  hudRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: tokens.spacing.sm,
  },
  hudRowLandscape: {
    marginBottom: tokens.spacing.md,
  },
  hudCard: {
    flex: 1,
    backgroundColor: tokens.colors.panelStrong,
    borderRadius: tokens.radii.md,
    paddingVertical: 10,
    paddingHorizontal: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.panelInnerBorder,
    marginHorizontal: 4,
  },
  hudLabel: {
    color: theme.textMuted,
    fontSize: tokens.typography.label,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hudValue: {
    marginTop: 2,
    color: theme.textPrimary,
    fontSize: tokens.typography.value,
    fontWeight: "900",
  },
  controlsRow: {
    marginBottom: tokens.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: tokens.spacing.xs,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: tokens.radii.pill,
    backgroundColor: theme.accent,
    justifyContent: "center",
    alignItems: "center",
    ...tokens.shadows.glow,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: tokens.radii.pill,
    backgroundColor: "rgba(64, 224, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(64, 224, 255, 0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: tokens.colors.textDark,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  secondaryButtonText: {
    color: tokens.colors.textPrimary,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  gestureRoot: {
    alignSelf: "center",
    marginBottom: tokens.spacing.sm,
  },
  board: {
    backgroundColor: theme.boardBg,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.panelInnerBorder,
    ...tokens.shadows.soft,
  },
  row: {
    flexDirection: "row",
  },
  tileWrap: {
    margin: tokens.spacing.xxs,
  },
  gestureHandlerContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: tokens.radii.lg,
    backgroundColor: tokens.colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  statusOverlayText: {
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.title,
    letterSpacing: 2,
    fontWeight: "900",
  },
  messageText: {
    marginTop: 2,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    color: tokens.colors.textSecondary,
  },
  messageTextSuccess: {
    color: theme.success,
  },
  messageTextDanger: {
    color: theme.danger,
  },
});

export default GameBoard;
