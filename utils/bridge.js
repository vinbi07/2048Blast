const BRIDGE_SOURCE = "2048Blast";

const toSafeInt = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
};

export const sanitizeBridgePayload = (payload = {}) => {
  return {
    type: String(payload.type || "unknown"),
    score: toSafeInt(payload.score),
    highestTile: toSafeInt(payload.highestTile),
    status: String(payload.status || "playing"),
    source: String(payload.source || BRIDGE_SOURCE),
    ts: toSafeInt(payload.ts || Date.now()),
  };
};

export const postToHost = (payload) => {
  try {
    const message = JSON.stringify(payload);

    if (
      typeof window !== "undefined" &&
      window.ReactNativeWebView &&
      typeof window.ReactNativeWebView.postMessage === "function"
    ) {
      window.ReactNativeWebView.postMessage(message);
      return;
    }

    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage(message, "*");
    }
  } catch (error) {
    console.warn("Bridge post failed", error);
  }
};

export const emitBridgeEvent = (payload) => {
  postToHost(sanitizeBridgePayload(payload));
};

export const BRIDGE_EVENT_SOURCE = BRIDGE_SOURCE;
