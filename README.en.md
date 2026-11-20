**English** · [فارسی](README.md)

# ui-vault — the UI Vault

A personal, function-organized reference vault of **50 live, animated UI components** — percent gauges and finance charts, toggles, buttons, cards, navigation, inputs, interactions, and a full animated product showcase — so whatever you need, you find it next to things that do the same job.

## What is this?

Instead of scattered screenshots, every interesting component found on the web is preserved here **with runnable code**. Each item ships with:

- **The original code** — verbatim from its source (`snippet.html` for Quix, self-contained d3motion files, the full Cake Couch app)
- **A live preview** — a standalone HTML file that plays the real animation in your browser
- **A live screenshot** — captured from that very render, so you can find things at a glance in this README
- **A per-item README** (Persian) — description, files, usage and tunable attributes

For easy browsing, the **live gallery** (`index.html`) shows all items on one page, grouped by function, with search.

## Categories

| Category | Count | Description |
| --- | --- | --- |
| [Charts](#charts) | 13 | Animated finance cards from Quix Studio plus a d3motion sparkline — every one runs live in the browser. |
| [Indicators & Gauges](#indicators) | 17 | Quix percent gauges and progress bars (a single <lp-loader> element) next to d3motion status indicators. |
| [Toggles & Switches](#toggles) | 3 | The VibeHub day/night switch (React source + build-free demo) and d3motion switches. |
| [Buttons](#buttons) | 2 | — |
| [Cards](#cards) | 3 | — |
| [Inputs](#inputs) | 3 | — |
| [Navigation](#navigation) | 4 | — |
| [Interactions](#interactions) | 4 | — |

## Live gallery

Open `index.html` — preferably through a tiny local server:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`: every component animates in place, grouped by function, searchable. (The Cake Couch card needs this server to fetch `art.svg`.)

## Structure

```text
ui-vault/
├─ index.html            ← live gallery of every item (category sections + search)
├─ SOURCES.md            ← origin, collection date and rights per item (Persian)
├─ charts/              ← Charts (13)
├─ indicators/          ← Indicators & Gauges (17)
├─ toggles/             ← Toggles & Switches (3)
├─ buttons/             ← Buttons (2)
├─ cards/               ← Cards (3)
├─ inputs/              ← Inputs (3)
├─ navigation/          ← Navigation (4)
├─ interactions/        ← Interactions (4)
└─ showcase/             ← animated product showcase (1)
```

## Browsing

- **On GitHub:** this README renders the screenshots; click any image to open the item folder.
- **Locally:** open any item's `component.html` / `demo.html` / `index.html` directly in your browser.
- **Everything at once:** `index.html`.

---

## Charts — `charts`

Animated finance cards from Quix Studio plus a d3motion sparkline — every one runs live in the browser.

|   |   |   |
| --- | --- | --- |
| [![candlestick](charts/candlestick/card.png)](charts/candlestick/) <br>BTC/USD Candlestick <br>`Quix` | [![portfolio-donut](charts/portfolio-donut/card.png)](charts/portfolio-donut/) <br>Portfolio Donut <br>`Quix` | [![fear-greed](charts/fear-greed/card.png)](charts/fear-greed/) <br>Fear & Greed Index <br>`Quix` |
| [![credit-score](charts/credit-score/card.png)](charts/credit-score/) <br>Credit Score <br>`Quix` | [![yield-curve](charts/yield-curve/card.png)](charts/yield-curve/) <br>Yield Curve <br>`Quix` | [![activity-heatmap](charts/activity-heatmap/card.png)](charts/activity-heatmap/) <br>Activity Heatmap <br>`Quix` |
| [![market-depth](charts/market-depth/card.png)](charts/market-depth/) <br>Market Depth <br>`Quix` | [![gas-tracker](charts/gas-tracker/card.png)](charts/gas-tracker/) <br>Gas Tracker <br>`Quix` | [![budget-bars](charts/budget-bars/card.png)](charts/budget-bars/) <br>Budget Bars <br>`Quix` |
| [![gradient-line](charts/gradient-line/card.png)](charts/gradient-line/) <br>Gradient Line <br>`Quix` | [![savings-ring](charts/savings-ring/card.png)](charts/savings-ring/) <br>Savings Ring <br>`Quix` | [![dominance-rings](charts/dominance-rings/card.png)](charts/dominance-rings/) <br>Market Dominance Rings <br>`Quix` |
| [![stock-portfolio](charts/stock-portfolio/card.png)](charts/stock-portfolio/) <br>Financial Portfolio Sparkline <br>`d3motion` |

## Indicators & Gauges — `indicators`

Quix percent gauges and progress bars (a single <lp-loader> element) next to d3motion status indicators.

|   |   |   |
| --- | --- | --- |
| [![multi-arc-percent](indicators/multi-arc-percent/card.png)](indicators/multi-arc-percent/) <br>Multi Arc Percent <br>`Quix` | [![block-ring](indicators/block-ring/card.png)](indicators/block-ring/) <br>Block Ring <br>`Quix` | [![chunk-percent](indicators/chunk-percent/card.png)](indicators/chunk-percent/) <br>Chunk Percent <br>`Quix` |
| [![radial-bar-percent](indicators/radial-bar-percent/card.png)](indicators/radial-bar-percent/) <br>Radial Bar Percent <br>`Quix` | [![bar-glow](indicators/bar-glow/card.png)](indicators/bar-glow/) <br>Bar Glow <br>`Quix` | [![bar-ticks](indicators/bar-ticks/card.png)](indicators/bar-ticks/) <br>Bar Ticks <br>`Quix` |
| [![bar-chevron](indicators/bar-chevron/card.png)](indicators/bar-chevron/) <br>Bar Chevron <br>`Quix` | [![bar-stripes](indicators/bar-stripes/card.png)](indicators/bar-stripes/) <br>Bar Stripes <br>`Quix` | [![bar-spark](indicators/bar-spark/card.png)](indicators/bar-spark/) <br>Bar Spark <br>`Quix` |
| [![bar-streak](indicators/bar-streak/card.png)](indicators/bar-streak/) <br>Bar Streak <br>`Quix` | [![bar-dots](indicators/bar-dots/card.png)](indicators/bar-dots/) <br>Bar Dots <br>`Quix` | [![bar-dot-sparkle](indicators/bar-dot-sparkle/card.png)](indicators/bar-dot-sparkle/) <br>Bar Dot Sparkle <br>`Quix` |
| [![streak-tracker](indicators/streak-tracker/card.png)](indicators/streak-tracker/) <br>Daily Streak Tracker <br>`d3motion` | [![collaborator-presence](indicators/collaborator-presence/card.png)](indicators/collaborator-presence/) <br>Live Collaborator Presence <br>`d3motion` | [![activity-rings](indicators/activity-rings/card.png)](indicators/activity-rings/) <br>Activity Progress Rings <br>`d3motion` |
| [![countdown-timer](indicators/countdown-timer/card.png)](indicators/countdown-timer/) <br>Focus Countdown Timer <br>`d3motion` | [![battery-monitor](indicators/battery-monitor/card.png)](indicators/battery-monitor/) <br>Multi-Device Battery Monitor <br>`d3motion` |

## Toggles & Switches — `toggles`

The VibeHub day/night switch (React source + build-free demo) and d3motion switches.

|   |   |   |
| --- | --- | --- |
| [![day-night-switch](toggles/day-night-switch/shots/day.png)](toggles/day-night-switch/) <br>Day & Night Theme Switch (VibeHub) <br>`VibeHub` | [![theme-toggle](toggles/theme-toggle/card.png)](toggles/theme-toggle/) <br>Day & Night Theme Switcher (d3motion) <br>`d3motion` | [![pricing-toggle](toggles/pricing-toggle/card.png)](toggles/pricing-toggle/) <br>Pricing Plan Tier Switch <br>`d3motion` |

## Buttons — `buttons`

|   |   |   |
| --- | --- | --- |
| [![deploy-button](buttons/deploy-button/card.png)](buttons/deploy-button/) <br>Morphing Deploy Button <br>`d3motion` | [![social-heart-like](buttons/social-heart-like/card.png)](buttons/social-heart-like/) <br>Social Heart Like Button <br>`d3motion` |

## Cards — `cards`

|   |   |   |
| --- | --- | --- |
| [![music-player](cards/music-player/card.png)](cards/music-player/) <br>Now Playing Music Player <br>`d3motion` | [![weather-clock](cards/weather-clock/card.png)](cards/weather-clock/) <br>World Clock & Weather <br>`d3motion` | [![notification-stack](cards/notification-stack/card.png)](cards/notification-stack/) <br>Stacked Notification Center <br>`d3motion` |

## Inputs — `inputs`

|   |   |   |
| --- | --- | --- |
| [![otp-verification](inputs/otp-verification/card.png)](inputs/otp-verification/) <br>6-Digit OTP Verification <br>`d3motion` | [![volume-brightness-sliders](inputs/volume-brightness-sliders/card.png)](inputs/volume-brightness-sliders/) <br>Dual Volume & Brightness Sliders <br>`d3motion` | [![color-picker](inputs/color-picker/card.png)](inputs/color-picker/) <br>Dynamic HSL Color Picker <br>`d3motion` |

## Navigation — `navigation`

|   |   |   |
| --- | --- | --- |
| [![segmented-control](navigation/segmented-control/card.png)](navigation/segmented-control/) <br>Segmented Navigation Control <br>`d3motion` | [![weekly-calendar](navigation/weekly-calendar/card.png)](navigation/weekly-calendar/) <br>Weekly Calendar Strip <br>`d3motion` | [![route-navigation](navigation/route-navigation/card.png)](navigation/route-navigation/) <br>Live Route GPS Navigation <br>`d3motion` |
| [![command-palette](navigation/command-palette/card.png)](navigation/command-palette/) <br>Command Palette (⌘K) <br>`d3motion` |

## Interactions — `interactions`

|   |   |   |
| --- | --- | --- |
| [![task-checklist](interactions/task-checklist/card.png)](interactions/task-checklist/) <br>Interactive Task Checklist <br>`d3motion` | [![file-upload](interactions/file-upload/card.png)](interactions/file-upload/) <br>File Upload Progress <br>`d3motion` | [![chat-stream](interactions/chat-stream/card.png)](interactions/chat-stream/) <br>Real-Time Chat Stream <br>`d3motion` |
| [![kanban-board](interactions/kanban-board/card.png)](interactions/kanban-board/) <br>Kanban Sprint Board <br>`d3motion` |

## Product showcase — showcase

**Cake Couch** — an animated product showcase with three cycling themes, a hidden orbit the objects ride on, and a rotating color pentagon backdrop. Pure HTML/CSS/JS with hand-drawn SVG artwork, zero dependencies (~12KB gzipped). Full code in [showcase/cake-couch/](showcase/cake-couch/) — [item README](showcase/cake-couch/README.md) · [live demo](https://cake-couch-animation.vercel.app) · [source repo](https://github.com/HamzehGhoreyshi/cake-couch-animation)

| Card | Three-theme loop |
| --- | --- |
| [![Cake Couch](showcase/cake-couch/card.png)](showcase/cake-couch/) | ![three themes](showcase/cake-couch/shots/loop.gif) |

> `art.svg` is loaded with `fetch`; serve `showcase/cake-couch/` with `python -m http.server 4173` to run it.

---

## Sources & rights

| Source | Count | Rights |
| --- | --- | --- |
| [d3motion.pro/resources](https://d3motion.pro/resources) | 24 | No redistribution permission — personal reference only |
| [Quix Studio — Free Components](https://quixstudio.net/free/components) | 24 | Free for personal and commercial use (per the site) |
| VibeHub | 1 | My own code |
| [HamzehGhoreyshi/cake-couch-animation](https://github.com/HamzehGhoreyshi/cake-couch-animation) | 1 | Upstream repo has no license — personal reference only |

Per-item details (path, collection date, rights, dimensions) live in [SOURCES.md](SOURCES.md) (Persian).

> **Important:** most of this collection (d3motion and cake-couch) has no explicit redistribution permission, so **this repo must stay private** — it exists purely as a personal reference and source of inspiration.
