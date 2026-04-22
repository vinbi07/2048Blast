import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
import { BRIDGE_EVENT_SOURCE, emitBridgeEvent } from "../utils/bridge";
import TileCell from "./TileCell";
import { theme, tokens } from "../utils/theme";

const GRID_SIZE = 4;
const TWO_APPEARANCE_PERCENTAGE = 0.7;
const ROCKS_SCORE_DIVISOR = 100;
const ROCKS_STORAGE_KEY = "taskblast_2048_rocks_total";

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
  const [totalRocks, setTotalRocks] = useState(0);
  const statusFade = useRef(new Animated.Value(0)).current;
  const previousHighestRef = useRef(0);
  const previousStatusRef = useRef("playing");
  const mountedRef = useRef(false);
  const awardedRocksThisRunRef = useRef(0);
  const { width, height } = useWindowDimensions();

  const score = getScore();
  const highestTile = useMemo(() => getHighestTile(board), [board]);
  const hasWon = isGameWon(board);
  const hasLost = isGameLost(board);
  const status = hasWon ? "won" : hasLost ? "lost" : "playing";
  const isLandscape = width > height;
  const isCompactMobile = !isLandscape && width <= 420;

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

    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.localStorage
    ) {
      const savedRocks = Number(window.localStorage.getItem(ROCKS_STORAGE_KEY));
      if (Number.isFinite(savedRocks) && savedRocks >= 0) {
        setTotalRocks(Math.floor(savedRocks));
      }
    }
  }, []);

  useEffect(() => {
    const rocksFromScore = Math.floor(Math.max(0, score) / ROCKS_SCORE_DIVISOR);
    const newlyEarned = rocksFromScore - awardedRocksThisRunRef.current;

    if (newlyEarned > 0) {
      setTotalRocks((prev) => prev + newlyEarned);
      awardedRocksThisRunRef.current = rocksFromScore;
    }
  }, [score]);

  useEffect(() => {
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.localStorage
    ) {
      window.localStorage.setItem(ROCKS_STORAGE_KEY, String(totalRocks));
    }
  }, [totalRocks]);

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
    if (
      mountedRef.current &&
      isTerminal &&
      previousStatusRef.current !== status
    ) {
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

  const handleNewRun = () => {
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
    awardedRocksThisRunRef.current = 0;
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
          <Text style={styles.boardSubtitle}>Arcade Sector Control</Text>
        </View>
        <View
          style={[
            styles.statusChip,
            isCompactMobile && styles.statusChipCompact,
            status === "lost" && styles.statusChipDanger,
          ]}
        >
          <Text
            style={[
              styles.statusChipText,
              isCompactMobile && styles.statusChipTextCompact,
            ]}
          >
            {status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={[styles.hudRow, isLandscape && styles.hudRowLandscape]}>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>Score</Text>
          <Text style={styles.hudValue}>{score}</Text>
        </View>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>Highest Tile</Text>
          <Text style={styles.hudValue}>{highestTile}</Text>
        </View>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>Rocks Earned</Text>
          <Text style={styles.hudValue}>{totalRocks}</Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.newRunButton} onPress={handleNewRun}>
          <Text style={styles.newRunButtonText}>New Run</Text>
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
            <Text style={styles.statusOverlayText}>
              {status === "won" ? "VICTORY" : "NO MOVES"}
            </Text>
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
    fontFamily: tokens.fonts.black,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  boardSubtitle: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.body,
    marginTop: 2,
    fontFamily: tokens.fonts.regular,
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
  statusChipCompact: {
    minWidth: 68,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  statusChipDanger: {
    backgroundColor: "rgba(255, 79, 111, 0.17)",
    borderColor: "rgba(255, 79, 111, 0.45)",
  },
  statusChipText: {
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.label,
    letterSpacing: 0.6,
    fontFamily: tokens.fonts.extraBold,
  },
  statusChipTextCompact: {
    fontSize: 10,
    letterSpacing: 0.3,
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
    fontFamily: tokens.fonts.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hudValue: {
    marginTop: 2,
    color: theme.textPrimary,
    fontSize: tokens.typography.value,
    fontFamily: tokens.fonts.black,
  },
  controlsRow: {
    marginBottom: tokens.spacing.md,
    flexDirection: "row",
    justifyContent: "center",
  },
  newRunButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: tokens.radii.pill,
    backgroundColor: theme.accent,
    justifyContent: "center",
    alignItems: "center",
    ...tokens.shadows.glow,
  },
  newRunButtonText: {
    color: tokens.colors.textDark,
    fontFamily: tokens.fonts.extraBold,
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
    fontFamily: tokens.fonts.black,
  },
  messageText: {
    marginTop: 2,
    textAlign: "center",
    fontSize: 15,
    fontFamily: tokens.fonts.bold,
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
