# Clean Twitter/X — Focus Mode

A Tampermonkey userscript that declutters the Twitter/X interface for distraction-free reading.

## What It Does

- **Hides the right sidebar** (trends, who to follow, search)
- **Expands the main content** column up to 900px
- **Feed Pages:** Centers the main feed column on the screen while preserving the left navigation sidebar.
- **Detail Pages:** Enters true "Focus Mode" by hiding *both* sidebars and perfectly centering the exact tweet being read.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser.
2. Click the Tampermonkey icon → **Create a new script**.
3. Paste the contents of [`clean-twitter.user.js`](clean-twitter.user.js) and save.
4. Visit [x.com](https://x.com) — enjoy the clean view.

## Customisation

Open the script and tweak the `max-width` value on `div[data-testid="primaryColumn"]` to make the column wider or narrower.
