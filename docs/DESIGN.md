# PCC Design System & Aesthetics Specification (`DESIGN.md`)

This document defines the comprehensive visual identity, design tokens, UI components, animations, and aesthetic standards for **PCC (Personal Control Center)**. All human developers and AI coding agents must adhere strictly to these guidelines when modifying or creating user interfaces.

---

## 1. Core Visual Identity

- **Brand Logo**: `/logo.png` (Main logo avatar used across app headers, favicon, and loading screens).
- **Brand Aesthetic**: Modern, high-density Personal Operating System (OS). Clean, crisp typography, rich glassmorphism, subtle glowing accents, and smooth micro-interactions.
- **Theme Priority**:
  - **Light Theme (Primary Default)**: Specified via `<html data-theme="light">`. Light primary background (`#f8fafc`), pure white cards (`#ffffff`), and subtle slate borders.
  - **Dark Theme (Secondary Toggleable)**: Specified via `<html data-theme="dark">`. Deep obsidian background (`#0a0a0f`), dark glass cards (`#12121a`), and subtle glowing borders.
- **Localization Defaults**:
  - **Country**: India (IN)
  - **Location**: Pune, India (Default weather telemetry & location)
  - **Currency**: `₹` (INR - Indian Rupee). Never default to `$`.

---

## 2. Design Tokens (`index.css`)

### Color Palette (Light vs. Dark)

| Token Name | Light Theme Value | Dark Theme Value | Usage |
| :--- | :--- | :--- | :--- |
| `--color-bg-primary` | `#f8fafc` | `#0a0a0f` | Main application backdrop |
| `--color-bg-secondary` | `#ffffff` | `#12121a` | Card & panel backgrounds |
| `--color-bg-tertiary` | `#f1f5f9` | `#1a1a2e` | Subtle inset containers, list items |
| `--color-bg-elevated` | `#ffffff` | `#1e1e32` | Elevated dropdowns & modals |
| `--color-text-primary` | `#0f172a` | `#e8e8f0` | Main headings & primary body text |
| `--color-text-secondary` | `#475569` | `#a0a0b8` | Subtitles, labels, metadata |
| `--color-text-muted` | `#94a3b8` | `#525266` | Placeholders & disabled text |
| `--color-accent` | `#4f46e5` | `#6366f1` | Primary indigo accent |
| `--color-accent-hover` | `#6366f1` | `#818cf8` | Accent hover state |
| `--color-accent-gradient` | `linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)` | `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)` | Primary button backgrounds & glowing bars |
| `--color-accent-subtle` | `rgba(79, 70, 229, 0.08)` | `rgba(99, 102, 241, 0.15)` | Spinner tracks & subtle highlights |

### Glassmorphism & Elevation Tokens

```css
--glass-bg: rgba(255, 255, 255, 0.85);          /* Light Mode Glass */
--glass-bg-elevated: rgba(255, 255, 255, 0.95); /* Modal Glass */
--glass-border: rgba(226, 232, 240, 0.8);
--glass-blur: blur(12px);

--shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06);
--shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
--shadow-lg: 0 10px 25px rgba(15, 23, 42, 0.12);
--shadow-glow: 0 0 20px rgba(79, 70, 229, 0.2);
```

---

## 3. Page Header Standards

- **Minimalist Page Titles**: Each feature module header displays **ONLY** a clean `<h1>` page title (e.g. `Tasks & Action Items`, `Projects & Initiatives`, `Goals & OKRs Matrix`).
- **No Subtitle Paragraphs**: Paragraph tags (`<p>`) with generic explanatory text below main page headers are intentionally omitted for a distraction-free, high-density interface.

---

## 4. UI Components Specification

### Button Component (`Button.tsx`)
- Supports variants: `primary`, `secondary`, `ghost`, `danger`, `outline`.
- Supports size: `sm` (32px), `md` (40px), `lg` (48px).
- **Icon Prop Usage**: Icons must be passed using the dedicated `icon={<svg />}` prop (or `rightIcon`) rather than raw inline JSX inside children. This ensures proper flex spacing (`gap: 10px` or `margin-right: 4px`).
- **Loading State**: Renders `<Spinner>` with `color="currentColor"`.

### Spinner Component (`Spinner.tsx` & `Spinner.css`)
- Hardware-accelerated smooth rotation using `@keyframes pccSpin` (0.75s infinite rotation).
- Adaptive track using `var(--color-accent-subtle)` to remain crisp in Light and Dark themes.
- **Accessibility**: Includes `<span className="sr-only">Loading...</span>`.

### Page Loader Component (`PageLoader.tsx` & `PageLoader.css`)
- Glassmorphism overlay used for route transitions and initial app load.
- Features top shimmer progress bar (`pccTopBarShimmer`), logo pulse (`/logo.png`), and counter-rotating glowing rings.

### Accessible Screen Reader Utility (`.sr-only`)
- All visually-hidden screen reader content must use `.sr-only` defined in `index.css` & `Spinner.css` to prevent layout shifts or visible text rotation.

---

## 5. Animation Keyframes Reference

| Keyframe Name | Duration / Easing | Description |
| :--- | :--- | :--- |
| `pccSpin` | `0.75s cubic-bezier(0.5, 0.1, 0.5, 0.9)` | Spinner 360-degree rotation |
| `pccLogoPulse` | `2s ease-in-out infinite` | Pulsing brand logo glow |
| `pccTopBarShimmer` | `1.5s ease-in-out infinite` | Top progress bar loading shimmer |
| `pccCardPopIn` | `0.4s cubic-bezier(0.16, 1, 0.3, 1)` | Glassmorphism card entrance |
| `fadeIn` | `0.35s ease-out` | Smooth page opacity transition |
