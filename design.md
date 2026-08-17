# ACC Portal — Design System

> Design reference for all pages across the Academic & Career Council portal.
> Agents and developers should follow these guidelines for visual consistency.

---

## 1. Color Palette

### Core

| Token            | Hex       | Usage                                    |
|------------------|-----------|------------------------------------------|
| `--acc-black`    | `#0A0A0A` | Primary page & section background        |
| `--acc-surface`  | `#141414` | Card & container surfaces                |
| `--acc-border`   | `#262626` | Card borders (`neutral-800`)             |
| `--acc-white`    | `#FFFFFF` | Primary headings & high-contrast text    |
| `--acc-gray-300` | `#D1D5DB` | Body copy and descriptions               |
| `--acc-gray-400` | `#9CA3AF` | Secondary labels, subheadings            |
| `--acc-gray-500` | `#6B7280` | Footer copyright, subtle metadata        |

### Accent

| Token            | Hex       | Usage                                    |
|------------------|-----------|------------------------------------------|
| `--acc-orange`   | `#E85D25` | Signature accent bars, badges, highlights|
| `--acc-glow`     | `rgba(232, 93, 37, 0.15)` | Subtle interactive glow  |

---

## 2. Typography

### Font Stack

```
Primary:  'Inter', system-ui, -apple-system, sans-serif
Headings: 'Inter', sans-serif  (weight 800-900 for display)
Legacy:   'Hanuman', sans-serif  (available, not primary)
```

### Scale

| Role              | Size (desktop)  | Weight | Letter-spacing | Line-height |
|-------------------|-----------------|--------|----------------|-------------|
| Display (hero)    | 64-80px         | 900    | -0.03em        | 1.05        |
| H2 (section)      | 36-48px         | 800    | -0.02em        | 1.15        |
| H3 (card)         | 24px            | 700    | -0.01em        | 1.3         |
| Body              | 16-18px         | 400    | 0              | 1.6         |
| Nav link          | 15px            | 500    | 0              | 1           |
| Label / Caption   | 12-13px         | 600    | 0.03em         | 1           |
| Bracket button    | 14-15px         | 500    | 0.02em         | 1           |

---

## 3. Button Styles

### Bracketed Outline (Primary CTA on light backgrounds)

```
Text:        [ Label -> ]
Font:        14px, weight 500, tracking 0.02em
Border:      1px solid #0A0A0A
Background:  transparent
Padding:     10px 20px
Hover:       background #0A0A0A, text #FFFFFF
Transition:  200ms ease
```

### Solid Dark

```
Background:  #0A0A0A
Text:        #FFFFFF, 14px, weight 600
Padding:     12px 28px
Border:      none
Hover:       background #1F2937
```

### Ghost / Text Link

```
Text:        #4B5563 or #2563EB
No border, no background
Hover:       underline or color shift
```

---

## 4. Component Patterns

### Navbar

- **Background**: Translucent frosted glass `bg-black/20` with `backdrop-blur-md`
- **Height**: `64px` desktop, `56px` mobile
- **Left**: Bold text logo "Academic & Career Council" with glowing orange dot
- **Center**: Nav links -- `font-weight: 500`, `15px`, sliding orange underline hover
- **Right**: Bracketed `[ Login ]` button; user dropdown when authenticated

### Hero Section

- **Layout**: Two-column on desktop (text left, description right), stacked on mobile
- **Headline**: Display size, weight 900, white `#FFFFFF` with drop shadow
- **Orange accent bar**: `3px x 40px` glowing vertical bar separating headline from description
- **Description**: `16-18px`, weight 400, `#D1D5DB`
- **Background image**: Full page bleed at `top: 0`, under dark overlay `bg-black/60`
- **CTA**: Solid white `Explore →` button with orange hover and shadow glow

### Section Cards (Mission / Vision / Wings)

- **Background**: Dark surface `#141414` with border `#262626`
- **Layout**: Two-column (image + text) or grid
- **Heading**: All-caps, `32-36px`, weight 800, white `#FFFFFF`
- **Orange accent bar**: `3px x 32px` before section heading with glowing shadow
- **Hover**: Lift translate, image scale, and elevated glow `shadow-[0_20px_60px_rgba(0,0,0,0.5)]`

### Footer

- **Background**: Deep obsidian `#0C0C0C` with structural borders `#1F1F1F`
- **Text**: White headings, `#D1D5DB` body links
- **Bottom bar**: Dark border top, copyright centered

---

## 5. Spacing & Layout

| Token           | Value    | Usage                          |
|-----------------|----------|--------------------------------|
| Base unit       | `8px`    | All spacing multiples of 8     |
| Page max-width  | `1280px` | Content container              |
| Edge padding    | `24px`   | Mobile horizontal padding      |
| Edge padding    | `64px`   | Desktop horizontal padding     |
| Section gap     | `80px`   | Vertical space between sections|
| Card padding    | `40px`   | Internal card padding          |

---

## 6. Accent Bar

The **orange vertical accent bar** is a signature element:
- Width: `3px`
- Height: `32-48px`
- Color: `#E85D25`
- Placement: Left edge of description blocks, or before section headings
- CSS class: `.accent-bar`

---

## 7. Shadows & Effects

| Element      | Shadow                                           |
|--------------|--------------------------------------------------|
| Cards        | `0 1px 3px rgba(0,0,0,0.06)`                    |
| Cards hover  | `0 8px 25px rgba(0,0,0,0.08)`                   |
| Navbar       | None (flat)                                      |
| Buttons      | None (flat), subtle on hover                     |
| Dropdown     | `0 10px 40px rgba(0,0,0,0.12)`                  |

---

## 8. Motion

- **Duration**: 200-400ms for micro-interactions, 600-800ms for page entrances
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like) for entrances
- **Hover**: `200ms ease` for color/shadow transitions
- **Page load**: Fade-up with staggered delay (`0ms`, `150ms`, `300ms`)
