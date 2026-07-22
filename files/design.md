# design.md — Structa

Structa is a developer tool. The look should read as **precise, dark, and technical** — closer to a code editor or observability dashboard than a generic consumer SaaS. Dark mode is the primary/default experience (this is where developers live); light mode exists for accessibility and daytime use but is not the design center of gravity. Do not invent new hex values, font sizes, or spacing outside what's defined here — propose additions instead of improvising.

## 1. Color Tokens

### Dark Mode (default)

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#0A0C10` | App background, near-black graphite |
| `--surface` | `#12151B` | Cards, panels, sidebar |
| `--surface-elevated` | `#191D26` | Modals, popovers, elevated panels |
| `--border` | `#242833` | Dividers, card borders |
| `--text-primary` | `#EDEFF3` | Primary text |
| `--text-muted` | `#8B92A3` | Secondary/meta text |
| `--primary` | `#3DDC97` | Signal Green — primary actions, "healthy"/mastered states, active edges |
| `--primary-hover` | `#33C489` | Primary hover state |
| `--accent` | `#7C9CFF` | Ion Blue — node highlight, links, chat citations |
| `--warning` | `#F2B84B` | Complexity heatmap mid-range, warnings |
| `--danger` | `#F0576B` | Complexity heatmap high-range, errors, circular-dependency highlight |
| `--info` | `#3DDC97` (same as primary) | Sync success toasts |

**Complexity heatmap gradient** (low → high complexity): `#3DDC97` → `#F2B84B` → `#F0576B`

### Light Mode

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#F7F8FA` | App background |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--surface-elevated` | `#FFFFFF` with `--border` outline + soft shadow | Modals |
| `--border` | `#E2E4E9` | Dividers |
| `--text-primary` | `#12151B` | Primary text |
| `--text-muted` | `#5C6270` | Secondary text |
| `--primary` | `#1F9D6D` | Darker green for AA contrast on white |
| `--accent` | `#3E63DD` | Darker blue for AA contrast on white |
| `--warning` | `#B9812E` | |
| `--danger` | `#D6334C` | |

Both modes must meet WCAG AA contrast (4.5:1) for body text against their background.

## 2. Typography

| Role | Font | Notes |
|---|---|---|
| UI / body | **Inter** | Default weight 400, medium 500 for emphasis |
| Headings / display | **Geist Sans** | Used on marketing/landing page headlines and dashboard section titles |
| Code / monospace | **JetBrains Mono** | File paths, module names, code snippets in AI chat, health-score numbers |

### Type Scale

| Token | Size / Line-height | Usage |
|---|---|---|
| `text-xs` | 12px / 16px | Meta labels, badges |
| `text-sm` | 14px / 20px | Secondary text, table cells |
| `text-base` | 16px / 24px | Body text |
| `text-lg` | 18px / 28px | Card titles |
| `text-xl` | 20px / 28px | Section headers |
| `text-2xl` | 24px / 32px | Page titles |
| `text-3xl` | 32px / 40px | Dashboard hero numbers |
| `text-5xl` | 48px / 56px | Landing page headline |

## 3. Spacing & Layout

- Base unit: **4px**. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Max content width for dashboard pages: `1440px`, centered.
- Sidebar width: `260px` (collapsible to `72px` icon-only).
- Card padding: `24px` default, `16px` for dense/compact cards (analytics tiles).

## 4. Radius & Elevation

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 6px | Buttons, inputs, badges |
| `radius-md` | 10px | Cards |
| `radius-lg` | 16px | Modals, large panels |
| `radius-full` | 9999px | Pills, avatars, status dots |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | Card resting state (dark mode) |
| `shadow-md` | `0 4px 16px rgba(0,0,0,0.5)` | Hovered cards, dropdowns |
| `shadow-glow-primary` | `0 0 24px rgba(61,220,151,0.35)` | 3D node emissive glow, active states |
| `shadow-glow-danger` | `0 0 24px rgba(240,87,107,0.35)` | High-complexity node glow, circular-dependency highlight |

## 5. 3D Scene Palette

- **Node base material:** `--surface-elevated` tinted by complexity gradient (see heatmap above)
- **Edge lines:** `--accent` at 40% opacity, brightening to 100% with animated particle flow to show active dependency direction
- **Node emissive glow on hover/selection:** `--primary` (healthy) or `--danger` (flagged/circular) per `shadow-glow-*` tokens
- **Background/void:** pure `--background` (`#0A0C10`) with a very subtle starfield/particle drift — this is the one place decorative particles are acceptable, since it reinforces the "space/atlas" metaphor without competing with the data-bearing nodes
- **Camera fog:** near-black fog matching background color, fading distant nodes slightly to reinforce depth

## 6. Motion Tokens

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `motion-fast` | 120ms | `ease-out` | Button press, checkbox toggle |
| `motion-base` | 200ms | `ease-out` | Card hover, tooltip fade |
| `motion-slow` | 350ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Panel slide-in, modal entrance |
| `motion-camera` | 600–900ms | `cubic-bezier(0.65, 0, 0.35, 1)` | 3D camera fly-to-node |
| `motion-spring-panel` | spring: stiffness 260, damping 28 | — | Chat sidebar slide-in |
| `motion-spring-press` | spring: stiffness 400, damping 17 | — | Button/card press feedback |

## 7. Component Notes

- **Buttons:** solid `--primary` for primary actions, outline with `--border` for secondary, ghost/text for tertiary. All buttons use `radius-sm` and `motion-spring-press` on click.
- **Cards (RepoCard):** `--surface` background, `--border` outline, `shadow-sm` at rest → `shadow-md` + slight scale(1.02) on hover.
- **Health-score ring:** circular progress using `--primary` → `--warning` → `--danger` gradient matching the complexity heatmap, animated fill on mount.
- **Toasts:** `--surface-elevated` background, left accent bar in `--primary`/`--danger` depending on type, slide-in from bottom-right with `motion-slow`.
- **Chat citations:** rendered as small pill chips using `--accent` at 15% background tint with `--accent` text, `radius-full`.
- **Badges (plan/role):** `radius-full`, `text-xs`, uppercase, colored by role: Admin = `--danger` tint, Editor = `--warning` tint, Viewer = `--text-muted` tint.

## 8. Dark/Light Mode Switching

- Theme is controlled via a `class="dark"` strategy on `<html>` (Tailwind `darkMode: 'class'`), persisted via a cookie (not `localStorage`, so it works with SSR without a flash-of-wrong-theme).
- Default: **dark**, for both first-time visitors and authenticated users, until they explicitly switch.
- The 3D scene's palette does **not** fully invert in light mode — the graph canvas keeps a dark void background even when the surrounding dashboard chrome is light, since a light-mode graph background would wash out node/edge contrast. This is an intentional, deliberate exception — do not "fix" it into matching light-mode chrome without flagging it first.
