# 🎨 Fakturio Style Guide

Complete design system documentation including colors, typography, spacing, border radius, and all design tokens used throughout the application.

**Version:** 1.0  
**Last Updated:** December 2024

---

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Border Radius](#border-radius)
4. [Spacing](#spacing)
5. [Shadows](#shadows)
6. [Transitions & Animations](#transitions--animations)
7. [Component Styles](#component-styles)
8. [Dark Mode](#dark-mode)
9. [Responsive Breakpoints](#responsive-breakpoints)
10. [Usage Examples](#usage-examples)

---

## Color Palette

### Primary Colors

| Color | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| **Background** | `#F7F5F2` | `#141414` | Main page background |
| **Surface** | `#ffffff` | `#252525` | Cards, modals, panels |
| **Surface Gray** | `#f5f5f3` | `#2a2a2a` | Secondary surfaces, inputs |
| **Surface Dark** | `#1f1f1f` | `#1f1f1f` | Sidebar, dark surfaces |
| **Surface Inverted** | `#141414` | `#141414` | Dark backgrounds |

### Text Colors

| Color | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| **Default** | `#141414` | `#ffffff` | Primary text |
| **Weak** | `rgba(21,21,20,0.8)` | `#aaaaaa` | Secondary text |
| **Muted** | `#555555` | `#aaaaaa` | Tertiary text, labels |
| **Disabled** | `#9e9e9e` | `#666666` | Disabled text, placeholders |
| **Label** | `#474743` | `#999999` | Form labels |
| **Subtitle** | `#666666` | `#999999` | Card titles, subtitles |

### Border Colors

| Color | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| **Default** | `rgba(21,21,20,0.14)` | `#333333` | Default borders |
| **Light** | `#e0e0e0` | `#333333` | Card borders, dividers |
| **Medium** | `#d0d0d0` | `#444444` | Hover states |
| **Dark** | `#141414` | `#ffffff` | Focus states |
| **Error** | `#ef4444` | `#ef4444` | Error states (red-500) |

### Interactive Colors

| Color | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| **Primary Button** | `#141414` | `#ffffff` | Primary actions |
| **Primary Hover** | `#333333` | `#e0e0e0` | Primary button hover |
| **Primary Active** | `#000000` | `#d0d0d0` | Primary button active |
| **Secondary Background** | `#ffffff` | `#2a2a2a` | Secondary buttons |
| **Hover Background** | `#f5f5f5` | `#333333` | Hover states |
| **Active Background** | `#ebebeb` | `#3a3a3a` | Active states |
| **Accent** | `#5B5CFF` | `#5B5CFF` | Accent color (purple) |

### Semantic Colors

| Color | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| **Success** | `#10b981` | `#10b981` | Success states (green-500) |
| **Error** | `#ef4444` | `#f87171` | Error states (red-500/red-400) |
| **Warning** | `#f59e0b` | `#f59e0b` | Warning states (amber-500) |
| **Info** | `#3b82f6` | `#60a5fa` | Info states (blue-500/blue-400) |

### Color Usage in Tailwind Config

```javascript
colors: {
  background: '#fcfcfa',
  'surface/inverted': '#141414',
  'border/default': 'rgba(21,21,20,0.14)',
  'content/default': '#141414',
  'content/weak': 'rgba(21,21,20,0.8)',
  'surface/gray': '#f5f5f3',
}
```

---

## Typography

### Font Family

**Primary Font:** `Radio Canada Big`

**Fallback Stack:**
```css
'Radio Canada Big', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif
```

**Configuration:**
```javascript
fontFamily: {
  'sans': ['Radio Canada Big', 'sans-serif'],
}
```

### Font Sizes

| Size | Value | Usage | Example |
|------|-------|-------|---------|
| **xs** | `12px` | Small labels, error messages | Error text |
| **sm** | `13px` | Labels, captions | Form labels, card titles |
| **base** | `14px` | Body text, inputs | Input fields, buttons |
| **md** | `15px` | Medium text | Secondary buttons |
| **lg** | `18px` | Modal titles | Modal headers |
| **xl** | `24px` | Page titles (mobile) | Page headers (mobile) |
| **2xl** | `32px` | Page titles (desktop) | Page headers (desktop) |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| **Regular** | `400` | Body text, inputs |
| **Medium** | `500` | Labels, buttons |
| **Semibold** | `600` | Headings, emphasized text |
| **Bold** | `700` | Strong emphasis (rarely used) |

### Line Heights

- **Tight**: `1.1` - Headings
- **Normal**: `1.3` - Body text
- **Relaxed**: `1.5` - Long-form content

### Letter Spacing

- **Tight**: `-0.025em` - Headings (tracking-tight)
- **Wide**: `0.05em` - Uppercase labels (tracking-wide)

### Typography Examples

```jsx
// Page Title
<h1 className="font-semibold text-[32px] text-[#141414] dark:text-white tracking-tight">
  Dashboard
</h1>

// Section Title
<h2 className="text-[18px] font-semibold text-[#141414] dark:text-white">
  Section Title
</h2>

// Body Text
<p className="text-[14px] text-[#141414] dark:text-white">
  Body text content
</p>

// Label
<label className="font-medium text-[13px] text-[#474743] dark:text-[#999]">
  Label Text
</label>

// Caption
<span className="text-[12px] text-[#666666] dark:text-[#999]">
  Caption text
</span>
```

---

## Border Radius

### Radius Scale

| Size | Value | Tailwind Class | Usage |
|------|-------|----------------|-------|
| **Small** | `6px` | `rounded-md` | Small buttons, badges |
| **Medium** | `8px` | `rounded-lg` | Inputs, small cards |
| **Large** | `12px` | `rounded-xl` | Cards, modals, panels |
| **Extra Large** | `16px` | `rounded-2xl` | Large cards, sidebars |
| **Full** | `50%` | `rounded-full` | Buttons, avatars, icons |

### Usage by Component

| Component | Radius | Class |
|-----------|--------|-------|
| **Buttons** | `50%` | `rounded-full` |
| **Inputs** | `8px` | `rounded-lg` |
| **Cards** | `12px` | `rounded-xl` |
| **Modals** | `16px` | `rounded-2xl` |
| **Sidebar** | `16px` | `rounded-2xl` |
| **Date Picker** | `12px` | `rounded-xl` |
| **Select Dropdown** | `8px` | `rounded-lg` |
| **Select Menu** | `8px` | `rounded-lg` |
| **Select Option** | `6px` | `rounded-md` |

### Examples

```jsx
// Button (full radius)
<button className="rounded-full">Click</button>

// Input (medium radius)
<input className="rounded-lg" />

// Card (large radius)
<div className="rounded-xl">Card content</div>

// Modal (extra large radius)
<div className="rounded-2xl">Modal content</div>
```

---

## Spacing

### Spacing Scale

The application uses Tailwind's default spacing scale with some custom values:

| Size | Value | Usage |
|------|-------|-------|
| **0** | `0px` | No spacing |
| **1** | `4px` | Tight spacing (gap-1) |
| **2** | `8px` | Small spacing (gap-2) |
| **3** | `12px` | Medium spacing (gap-3, p-3) |
| **4** | `16px` | Standard spacing (gap-4, p-4) |
| **5** | `20px` | Large spacing (p-5) |
| **6** | `24px` | Extra large spacing (gap-6, p-6) |

### Component Spacing

#### Buttons

| Size | Padding | Height | Class |
|------|---------|--------|-------|
| **Small** | `px-4 py-2` | `36px` | `h-[36px]` |
| **Default** | `px-5 py-2.5` | `44px` | `h-[44px]` |
| **Large** | `px-6 py-3` | `52px` | `h-[52px]` |
| **Icon** | `p-2.5` | `44px` | `h-[44px] w-[44px]` |

#### Inputs

| Property | Value | Class |
|----------|-------|-------|
| **Height** | `40px` | `h-[40px]` |
| **Padding** | `px-3 py-2` | `px-3 py-2` |
| **Gap (with label)** | `4px` | `gap-1` |

#### Cards

| Property | Value | Class |
|----------|-------|-------|
| **Padding (mobile)** | `16px` | `p-4` |
| **Padding (desktop)** | `24px` | `md:p-6` |
| **Header Padding** | `px-4 md:px-6 py-3` | `px-4 md:px-6 py-3` |

#### Modals

| Property | Value | Class |
|----------|-------|-------|
| **Header Padding** | `20px` | `p-5` |
| **Body Padding** | `20px` | `p-5` |
| **Footer Padding** | `px-5 pb-5` | `px-5 pb-5` |
| **Gap (body)** | `16px` | `gap-4` |
| **Gap (footer)** | `12px` | `gap-3` |

#### Sidebar

| Property | Value | Class |
|----------|-------|-------|
| **Width** | `260px` | `w-[260px]` |
| **Padding** | `px-3` | `px-3` |
| **Item Padding** | `px-3 py-2` | `px-3 py-2` |
| **Item Gap** | `12px` | `gap-3` |
| **Section Gap** | `24px` | `gap-6` |

### Gap Usage

| Gap | Value | Usage |
|-----|-------|-------|
| **gap-0.5** | `2px` | Tight spacing between related items |
| **gap-1** | `4px` | Small spacing (label to input) |
| **gap-2** | `8px` | Standard spacing between elements |
| **gap-3** | `12px` | Medium spacing (button groups, lists) |
| **gap-4** | `16px` | Large spacing (sections) |
| **gap-6** | `24px` | Extra large spacing (major sections) |

---

## Shadows

### Shadow Scale

| Shadow | Value | Usage |
|--------|-------|-------|
| **sm** | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | Cards, inputs |
| **md** | `0 4px 6px -1px rgba(0, 0, 0, 0.1)` | Elevated cards |
| **lg** | `0 10px 15px -3px rgba(0, 0, 0, 0.1)` | Modals, dropdowns |
| **xl** | `0 20px 25px -5px rgba(0, 0, 0, 0.1)` | Large modals |

### Custom Shadows

| Shadow | Value | Usage |
|--------|-------|-------|
| **Date Picker** | `0 4px 12px rgba(0, 0, 0, 0.08)` | Date picker dropdown |
| **Select Menu** | `0 4px 12px rgba(0, 0, 0, 0.08)` | Select dropdown menu |

### Usage by Component

| Component | Shadow | Class |
|-----------|--------|-------|
| **Cards** | Small | `shadow-sm` |
| **Modals** | Extra Large | `shadow-xl` |
| **Sidebar** | Small | `shadow-sm` |
| **Dropdowns** | Large | `shadow-lg` |

---

## Transitions & Animations

### Transition Duration

| Duration | Value | Usage |
|----------|-------|-------|
| **Fast** | `100ms` | Quick interactions |
| **Default** | `200ms` | Standard transitions |
| **Slow** | `300ms` | Complex animations |

### Transition Properties

| Property | Usage |
|----------|-------|
| **Colors** | `transition-colors duration-200` |
| **All** | `transition-all duration-200` |
| **Ease** | `ease-in-out` |

### Common Transition Patterns

```jsx
// Color transitions
className="transition-colors duration-200"

// All property transitions
className="transition-all duration-200 ease-in-out"

// Hover states
className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
```

### Animation Examples

```jsx
// Sidebar slide animation
className="transition-all duration-300"

// Modal backdrop fade
className="backdrop-blur-sm transition-opacity duration-200"
```

---

## Component Styles

### Button Variants

#### Primary Button
```jsx
className="bg-[#141414] dark:bg-white text-white dark:text-[#141414] 
           hover:bg-[#333333] dark:hover:bg-[#e0e0e0] 
           active:bg-[#000000] dark:active:bg-[#d0d0d0] 
           rounded-full px-5 py-2.5 h-[44px]"
```

#### Secondary Button
```jsx
className="bg-white dark:bg-[#2a2a2a] text-[#141414] dark:text-white 
           border border-[#e0e0e0] dark:border-[#444] 
           hover:bg-[#f5f5f5] dark:hover:bg-[#333] 
           rounded-full px-5 py-2.5 h-[44px]"
```

#### Ghost Button
```jsx
className="bg-transparent text-[#555555] dark:text-[#aaa] 
           hover:bg-[#f5f5f5] dark:hover:bg-[#333] 
           hover:text-[#141414] dark:hover:text-white 
           rounded-lg px-3 py-2"
```

#### Destructive Button
```jsx
className="bg-white dark:bg-[#2a2a2a] text-red-600 dark:text-red-400 
           border border-[#e0e0e0] dark:border-[#444] 
           hover:bg-red-50 dark:hover:bg-red-900/20 
           rounded-full px-5 py-2.5 h-[44px]"
```

### Input Styles

```jsx
className="w-full h-[40px] px-3 py-2 
           bg-[#F7F5F2] dark:bg-[#2a2a2a] 
           border border-[#e0e0e0] dark:border-[#444] 
           rounded-lg text-[14px] 
           text-[#141414] dark:text-white 
           placeholder-[#9e9e9e] dark:placeholder-[#666]
           focus:outline-none focus:border-[#141414] dark:focus:border-white
           transition-all duration-200"
```

### Card Styles

```jsx
className="bg-white dark:bg-[#252525] 
           border border-[#e0e0e0] dark:border-[#333] 
           rounded-xl shadow-sm 
           transition-colors duration-200"
```

### Modal Styles

```jsx
// Modal Container
className="bg-white dark:bg-[#252525] rounded-2xl shadow-xl"

// Modal Backdrop
className="bg-black/50 backdrop-blur-sm"

// Modal Header
className="p-5 border-b border-[#e0e0e0] dark:border-[#333]"

// Modal Body
className="p-5 flex flex-col gap-4"

// Modal Footer
className="flex gap-3 px-5 pb-5"
```

### Sidebar Styles

```jsx
// Sidebar Container
className="bg-white dark:bg-[#1f1f1f] 
           border border-[#e0e0e0] dark:border-[#333] 
           rounded-2xl shadow-sm"

// Sidebar Item (active)
className="bg-[#eaeaeb]/50 dark:bg-[#333]/50 
           text-[#141414] dark:text-white font-medium"

// Sidebar Item (inactive)
className="text-[#555555] dark:text-[#aaa] 
           hover:bg-[#eaeaeb] dark:hover:bg-[#333] 
           hover:text-[#141414] dark:hover:text-white"
```

---

## Dark Mode

### Implementation

Dark mode is implemented using Tailwind's `dark:` variant with the `class` strategy.

**Configuration:**
```javascript
darkMode: 'class'
```

**Toggle:**
- Adds/removes `dark` class on `<html>` element
- Stored in `localStorage` as `fakturio_theme`
- Respects system preference on first load

### Dark Mode Color Mapping

| Light Mode | Dark Mode | Component |
|------------|-----------|-----------|
| `#F7F5F2` | `#141414` | Background |
| `#ffffff` | `#252525` | Surface |
| `#f5f5f3` | `#2a2a2a` | Secondary surface |
| `#141414` | `#ffffff` | Text |
| `#e0e0e0` | `#333333` | Borders |
| `#555555` | `#aaaaaa` | Muted text |

### Dark Mode Patterns

```jsx
// Background
className="bg-white dark:bg-[#252525]"

// Text
className="text-[#141414] dark:text-white"

// Border
className="border-[#e0e0e0] dark:border-[#333]"

// Hover
className="hover:bg-[#f5f5f5] dark:hover:bg-[#333]"
```

---

## Responsive Breakpoints

### Breakpoint Scale

| Breakpoint | Value | Usage |
|------------|-------|-------|
| **sm** | `640px` | Small tablets |
| **md** | `768px` | Tablets |
| **lg** | `1024px` | Desktops |
| **xl** | `1280px` | Large desktops |
| **2xl** | `1536px` | Extra large desktops |

### Common Responsive Patterns

```jsx
// Font sizes (no responsive scaling)
className="text-[32px]"

// Padding responsive
className="p-4 md:p-6"

// Grid responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Sidebar visibility
className="hidden lg:block"
```

### Component-Specific Breakpoints

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| **Page Title** | `32px` | `32px` | `32px` |
| **Card Padding** | `16px` | `24px` | `24px` |
| **Sidebar** | Hidden (overlay) | Hidden | Visible |
| **Modal Width** | Full width | `max-w-md` | `max-w-md` |

---

## Scrollbar Styles

### Custom Scrollbar

```css
/* Scrollbar Track */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

/* Scrollbar Thumb (Light) */
::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #d4d4d4;
}

/* Scrollbar Thumb (Dark) */
.dark ::-webkit-scrollbar-thumb {
  background: #333;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #444;
}
```

---

## Focus States

### Focus Ring

```jsx
// Default focus
className="focus:outline-none focus:ring-2 focus:ring-offset-1"

// Input focus
className="focus:border-[#141414] dark:focus:border-white 
           focus:ring-0"

// Button focus
className="focus:ring-2 focus:ring-[#141414] dark:focus:ring-white 
           focus:ring-offset-1"
```

### Focus Colors

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Input Border** | `#141414` | `#ffffff` |
| **Button Ring** | `#141414` | `#ffffff` |
| **Select Border** | `#141414` | `#ffffff` |

---

## Z-Index Scale

| Layer | Value | Usage |
|-------|-------|-------|
| **Base** | `0` | Default |
| **Dropdown** | `10` | Dropdown menus |
| **Sticky** | `20` | Sticky headers |
| **Modal Backdrop** | `40` | Modal overlays |
| **Modal** | `50` | Modals, sidebars |
| **Tooltip** | `60` | Tooltips (future) |
| **Notification** | `70` | Notifications (future) |

---

## Usage Examples

### Complete Button Example

```jsx
<button className="
  inline-flex items-center justify-center 
  font-medium transition-all duration-200 ease-in-out 
  focus:outline-none focus:ring-2 focus:ring-offset-1 
  disabled:opacity-50 disabled:cursor-not-allowed 
  rounded-full 
  px-5 py-2.5 text-[14px] h-[44px]
  bg-[#141414] dark:bg-white 
  text-white dark:text-[#141414] 
  hover:bg-[#333333] dark:hover:bg-[#e0e0e0] 
  active:bg-[#000000] dark:active:bg-[#d0d0d0] 
  focus:ring-[#141414] dark:focus:ring-white
">
  Button Text
</button>
```

### Complete Input Example

```jsx
<div className="flex flex-col gap-1 w-full">
  <label className="font-medium text-[13px] text-[#474743] dark:text-[#999]">
    Label
  </label>
  <input
    className="
      w-full h-[40px] px-3 py-2 
      bg-[#F7F5F2] dark:bg-[#2a2a2a] 
      border border-[#e0e0e0] dark:border-[#444] 
      rounded-lg 
      text-[14px] 
      text-[#141414] dark:text-white 
      placeholder-[#9e9e9e] dark:placeholder-[#666]
      transition-all duration-200
      focus:outline-none focus:ring-0
      focus:border-[#141414] dark:focus:border-white
    "
    placeholder="Enter text..."
  />
</div>
```

### Complete Card Example

```jsx
<div className="
  bg-white dark:bg-[#252525] 
  border border-[#e0e0e0] dark:border-[#333] 
  rounded-xl shadow-sm 
  transition-colors duration-200
  p-4 md:p-6
">
  <h3 className="text-[18px] font-semibold text-[#141414] dark:text-white mb-4">
    Card Title
  </h3>
  <p className="text-[14px] text-[#141414] dark:text-white">
    Card content goes here.
  </p>
</div>
```

---

## Design Tokens Summary

### Quick Reference

```javascript
// Colors
const colors = {
  background: { light: '#F7F5F2', dark: '#141414' },
  surface: { light: '#ffffff', dark: '#252525' },
  text: { light: '#141414', dark: '#ffffff' },
  border: { light: '#e0e0e0', dark: '#333333' },
}

// Typography
const typography = {
  fontFamily: 'Radio Canada Big',
  sizes: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
}

// Spacing
const spacing = {
  button: {
    sm: { padding: 'px-4 py-2', height: '36px' },
    default: { padding: 'px-5 py-2.5', height: '44px' },
    lg: { padding: 'px-6 py-3', height: '52px' },
  },
  input: { height: '40px', padding: 'px-3 py-2' },
}

// Border Radius
const borderRadius = {
  sm: '6px',   // rounded-md
  md: '8px',   // rounded-lg
  lg: '12px',  // rounded-xl
  xl: '16px',  // rounded-2xl
  full: '50%', // rounded-full
}

// Transitions
const transitions = {
  default: 'duration-200',
  fast: 'duration-100',
  slow: 'duration-300',
}
```

---

## Accessibility

### Color Contrast

All text colors meet WCAG AA contrast requirements:
- **Default text** (`#141414` on `#F7F5F2`): 15.8:1 ✅
- **Muted text** (`#555555` on `#F7F5F2`): 6.2:1 ✅
- **Dark mode text** (`#ffffff` on `#141414`): 15.8:1 ✅

### Focus Indicators

- All interactive elements have visible focus states
- Focus rings use 2px width with offset
- Focus colors contrast with backgrounds

### Touch Targets

- Buttons minimum height: `36px` (small) to `52px` (large)
- Inputs minimum height: `40px`
- Interactive elements have adequate spacing

---

## Best Practices

### Do's ✅

- Use semantic color names (e.g., `text-[#141414]` not `text-black`)
- Always include dark mode variants
- Use consistent spacing scale
- Apply transitions to interactive elements
- Use appropriate border radius for component type
- Follow responsive patterns (mobile-first)

### Don'ts ❌

- Don't use arbitrary colors without dark mode variant
- Don't mix spacing scales (stick to Tailwind defaults)
- Don't use inline styles (use Tailwind classes)
- Don't skip focus states
- Don't use fixed widths without responsive variants

---

## Component Style Checklist

When creating a new component:

- [ ] Includes light and dark mode variants
- [ ] Uses consistent spacing scale
- [ ] Has appropriate border radius
- [ ] Includes hover/focus/active states
- [ ] Has transition animations
- [ ] Meets accessibility requirements
- [ ] Is responsive (mobile-first)
- [ ] Uses semantic color tokens
- [ ] Follows existing component patterns

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Maintained by:** Fakturio Design Team

