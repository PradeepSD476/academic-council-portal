# Mentorship Portal - Design System & UI Guidelines

This document outlines the design language, color palettes, and UI components established for the Student Mentorship Program (SMP) portal. Our goal is to maintain a premium, cohesive, and modern "Light Mode Glassmorphism" aesthetic across all pages.

## 1. Theme Concept & Aesthetic
The platform utilizes a highly polished, clean light-mode interface. It combines extensive use of whitespace, refined typography, and subtle micro-animations. 

**Key Characteristics:**
- **Glassmorphism & Blurs:** Extensive use of `backdrop-blur` on headers, sidebars, and overlay elements.
- **Ambient Glows:** Backgrounds are not flat white; they utilize large, highly blurred colorful shapes to create an ambient, ethereal glow.
- **Premium Borders:** Soft, highly transparent borders (`border-outline-variant/30` or `border-white/20`) to separate sections without harsh lines.

## 2. Color Palette

### Base & Surfaces
- **Surface (Main Background):** `#f8fafc` or pure `#ffffff` with light tints.
- **Surface Container Lowest (Cards/Modals):** Pure white `bg-white` with subtle shadow (`shadow-sm`).
- **Text Primary (`on-surface`):** Deep slate/black `#111827` or `#0f172a` for high contrast readability.
- **Text Variant (`on-surface-variant`):** Softer grayish-blue `#475569` or `#64748b` for secondary text and descriptions.

### Accent Colors
- **Primary:** Bright Blue (`#3b82f6` / `blue-500`) transitioning to Deep Indigo (`#4f46e5` / `indigo-600`).
- **Ambient Glow Colors:** 
  - Soft Blue: `bg-blue-300/20`
  - Warm Amber: `bg-amber-200/30`
  - Cool Indigo: `bg-indigo-200/10`

## 3. Typography
- **Primary Font:** Clean, modern Sans-Serif (`Inter`, `Plus Jakarta Sans`, or similar modern geometric sans).
- **Hero & Display Accent Font:** Elegant Serif Italics (`font-serif italic font-normal`) used to highlight specific emotional or impactful keywords (e.g., *"expert mentorship"*).
- **Text Highlighting (Gradients & Glows):** Important words in headings use a subtle primary gradient with a soft drop shadow (halo effect):
  ```css
  bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(59,130,246,0.35)]
  ```
- **Text Highlighting (Solid):** Inline description text uses slightly heavier font-weights and subtle glows:
  ```css
  font-semibold text-primary/90 drop-shadow-[0_0_10px_rgba(59,130,246,0.25)]
  ```

## 4. Background Choice & Layouts

### Ambient Background Tint (Dashboards & Landing)
Instead of a plain white background, the application uses a fixed, non-interactive layer of highly blurred glowing shapes overlaid with `mix-blend-multiply` to create a beautiful, watercolor-like gradient effect that permeates the entire app:
```jsx
<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
  <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[70%] bg-blue-300/20 blur-[140px] rounded-full mix-blend-multiply"></div>
  <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[70%] bg-amber-200/30 blur-[140px] rounded-full mix-blend-multiply"></div>
  <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] bg-indigo-200/10 blur-[140px] rounded-full mix-blend-multiply"></div>
</div>
```

### Dashboard Layout Structure
- **Sidebar:** Fixed left side (`w-72`), translucent glass background (`bg-surface-container-low`), extending full height.
- **Top Navbar:** Fixed top (`h-20`), heavily blurred (`bg-surface/80 backdrop-blur-xl`), with `left-0 lg:left-72` for precise responsive anchoring.
- **Main Content Area:** Padded sufficiently (`pt-28`) to clear the absolute/fixed navbar and prevent content overlapping.

## 5. UI Components

### Buttons
**1. Primary Call-to-Action (Navbar "Register"):**
A stunning gradient button featuring a beautifully enclosed icon to represent premium interaction.
- **Classes:** `bg-gradient-to-r from-primary to-indigo-500 hover:from-primary hover:to-indigo-400 text-white rounded-full border border-primary/50 shadow-sm hover:shadow-[0_4px_15px_rgba(59,130,246,0.3)]`
- **Icon Container:** `w-7 h-7 rounded-full border border-white/30 bg-white/20 flex items-center justify-center`

**2. Secondary/Glossy Button (Landing Page Actions):**
A transparent, glass-like button that relies on backdrop blurring and subtle borders.
- **Classes:** `bg-white/60 backdrop-blur-md text-[#0f172a] border border-outline-variant/30 hover:bg-white hover:shadow-[0_0_20px_rgba(0,0,0,0.08)] hover:border-transparent transition-all duration-300`

### Forms & Inputs
Inputs across the application (e.g., Profile editing, settings) share a unified, highly legible style that brightens on focus to guide the user's eye.
- **Input Classes:** `w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-on-surface-variant/50`

### Avatars & Imagery
- **Large Avatars (Profile Tab):** Large circular elements (`w-32 h-32`), housed in a container with a subtle gradient background (`from-primary to-primary-container`), overlaid with a dark translucent hover state (`bg-black/40 backdrop-blur-[2px]`) revealing a "Change" icon.
- **Network SVG Visualization:** Uses dynamic SVGs configured with `preserveAspectRatio="xMidYMid meet"` in wide containers (`max-w-[1400px]`) allowing networks and nodes to stretch elegantly toward the edges of wide monitors while seamlessly collapsing onto mobile viewports (using separate `<svg>` elements targeted via `hidden md:block` and `block md:hidden`).
