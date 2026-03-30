# Design System Specification: The Obsidian Ledger

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Curator"**

This design system is built to transform the mundane act of logging work into a high-end editorial experience. We are moving away from the "cluttered dashboard" aesthetic and toward a "Digital Ledger"—a space that feels as authoritative as a code editor but as refined as a premium timepiece.

By utilizing **intentional asymmetry** and **tonal depth**, we break the standard "SaaS box" template. This system prioritizes breathing room and content-first layouts, where the developer’s work is the hero. We achieve a custom feel by eschewing standard borders in favor of layered, obsidian-like surfaces that feel carved rather than drawn.

---

## 2. Colors: Depth in the Dark
The palette is rooted in a "Dark Mode by Default" philosophy. We use high-contrast accents sparingly to signal achievement and system status.

### The Palette (Material Design Tokens)
*   **Background (The Void):** `#10131a` (Surface-Dim)
*   **Primary (The Signal):** `#b2c5ff` (Electric Blue) | Container: `#5d8bff`
*   **Secondary (The Status):** `#7bdb80` (GitHub Green) | Container: `#007124`
*   **Tertiary (The Achievement):** `#e9c400` (Verified Gold) | Container: `#c9a900`
*   **Surface Hierarchy:**
    *   `surface_container_lowest`: `#0b0e14` (Deep Obsidian)
    *   `surface_container_low`: `#191c22`
    *   `surface_container`: `#1d2026`
    *   `surface_container_high`: `#272a31`

### Core Color Rules
*   **The "No-Line" Rule:** 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through background color shifts. If a section needs to stand out, move from `surface_container_low` to `surface_container`.
*   **The "Glass & Gradient" Rule:** Use Glassmorphism for floating elements (e.g., Modals, Tooltips). Apply `surface_variant` at 60% opacity with a 12px backdrop-blur. 
*   **Signature Textures:** For primary actions, use a subtle linear gradient from `primary` to `primary_container` (135° angle). This adds a "lithographic" soul to buttons that flat colors lack.

---

## 3. Typography: Editorial Utility
We pair the human-centric **Inter** with the technical precision of **Space Grotesk** (and JetBrains Mono for snippets) to create an "Editorial-meets-IDE" vibe.

*   **Display (The Statement):** `display-lg` (3.5rem / Inter). Used for massive, low-opacity background watermarks or hero numbers (e.g., "365 DAY STREAK").
*   **Headlines (The Anchor):** `headline-md` (1.75rem / Inter / Semi-Bold). Minimalist and authoritative.
*   **Labels (The Metadata):** `label-md` (0.75rem / Space Grotesk / Medium / All-Caps). Used for "Verified" statuses and system labels to provide a tactical, engineered feel.
*   **Body (The Content):** `body-md` (0.875rem / Inter). High legibility for long-form updates.

---

## 4. Elevation & Depth: Tonal Layering
In this system, depth is a matter of light, not lines.

*   **The Layering Principle:** Stack surfaces to create focus.
    *   *Base:* `surface_dim` (#10131a)
    *   *Layout Sections:* `surface_container_low` (#191c22)
    *   *Interactive Cards:* `surface_container` (#1d2026)
*   **Ambient Shadows:** For floating elements, use `0 20px 40px rgba(0, 0, 0, 0.4)`. The shadow must be large and diffused, mimicking a soft overhead studio light.
*   **The "Ghost Border":** If accessibility requires a stroke, use `outline_variant` (#424654) at 15% opacity. It should feel like a faint suggestion of a boundary.

---

## 5. Components

### Input Cards ("Daily Standups")
Designed to look like an IDE terminal. 
*   **Background:** `surface_container_lowest`.
*   **Styling:** No border. A 4px vertical accent of `primary` on the left edge indicates the "active" focus.
*   **Typography:** Use JetBrains Mono for the input text to emphasize the "Proof of Work" nature.

### Heat Map Grids (Contribution Tracking)
*   **Empty State:** `surface_container_highest` at 30% opacity.
*   **Active State:** Transitions from `secondary_container` to `secondary` (GitHub Green) based on intensity.
*   **Shape:** `rounded-sm` (0.125rem) to maintain a crisp, technical look.

### Buttons & CTAs
*   **Primary:** Gradient of `primary` to `primary_container`. Text color `on_primary`. Roundedness: `md` (0.375rem).
*   **Secondary:** Ghost style. No background, only `label-md` typography in `on_surface`. On hover, shift background to `surface_container_high`.

### The "Verified" Badge
A signature component. A circular `tertiary` (#FFD700) icon with a subtle outer glow (0 0 12px `tertiary_container` at 40% opacity). It should feel like a gold-stamped seal of quality.

### Lists & Feeds
*   **Rule:** Forbid divider lines.
*   **Separation:** Use `1.5` (0.3rem) vertical spacing for tight groups and `8` (1.75rem) for distinct work logs. Separation is achieved through white space and alternating `surface_container_low` and `surface_container_lowest` backgrounds.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts. Let a "Standup Card" take up 60% of the screen while the heat map takes 40%.
*   **Do** use `Space Grotesk` for anything that feels "calculated" (dates, commit IDs, badge counts).
*   **Do** use `secondary_fixed` (#97f999) for success messages; it pops against the obsidian background without being jarring.

### Don’t:
*   **Don’t** use a pure white (#FFFFFF). Use `on_surface` (#e1e2eb) for text to prevent eye strain.
*   **Don’t** use rounded corners larger than `xl` (0.75rem). We want the system to feel sharp and professional, not "bubbly" or consumer-grade.
*   **Don’t** use standard "Drop Shadows" on cards. Use tonal shifts. If a card is important, make it one shade lighter than its parent container.