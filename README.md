# 2048 Blast - TaskBlast Arcade Theme

2048 Blast is a React Native (Expo) game with swipe + keyboard controls, tuned for both browser and mobile WebView runtimes.

## What Changed in the TaskBlast Redesign

The gameplay rules are unchanged. The redesign focuses on presentation, UX hierarchy, and bridge reliability.

### Design Choices

- Visual direction: deep-space control panel look with cyan/teal accents and high-contrast HUD cards.
- Layout hierarchy:
	- Top HUD: game identity + status chip.
	- Stats row: current score, highest tile, best score.
	- Controls: touch-friendly `New Run` and `Restart` actions.
	- Board panel: framed 4x4 grid with subtle depth and glow.
	- Status feedback: readable text + terminal-state overlay.
- Tokenized styling system in [utils/theme.js](utils/theme.js):
	- Colors
	- Spacing
	- Radii
	- Typography scales
	- Shadows
	- Motion durations
- Tile readability:
	- Progressive palette with strong numeric contrast.
	- Adaptive font sizing for larger values.
	- Spawn and merge feedback animation.

## Bridge Message Contract

Bridge output is normalized in [utils/bridge.js](utils/bridge.js) and emitted from [components/GameBoard.js](components/GameBoard.js).

### Event Types

- `scoreUpdate`: emitted during play updates.
- `tileUpdate`: emitted when highest tile changes.
- `sessionEnd`: emitted on `won`, `lost`, and `restart-finalize`.

### Payload Shape

```json
{
	"type": "scoreUpdate|tileUpdate|sessionEnd",
	"score": 0,
	"highestTile": 0,
	"status": "playing|won|lost|restart-finalize",
	"source": "2048Blast",
	"ts": 1710000000000
}
```

### Reliability Notes

- Numeric fields are sanitized to non-negative integers.
- `source` is fixed to `2048Blast` by default for consistency.
- Posts to `window.ReactNativeWebView.postMessage` when available.
- Falls back to `window.parent.postMessage` for browser embedding.

## Local Development

```bash
npm install
npm run web
```

## Deploy to GitHub Pages

The project already includes deployment scripts in [package.json](package.json).

1. Ensure `homepage` matches your repository page URL.
2. Build and deploy:

```bash
npm run deploy
```

This runs:

- `predeploy`: `expo export:web`
- `deploy`: publishes `web-build/` via `gh-pages`

## Input Controls

- Mobile/WebView: swipe in any direction.
- Desktop web: arrow keys also work.

## Compatibility Summary

- 2048 core mechanics: unchanged.
- Bridge integration: preserved and hardened.
- Web + mobile layout: responsive for portrait/landscape/desktop.
