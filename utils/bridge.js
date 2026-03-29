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
