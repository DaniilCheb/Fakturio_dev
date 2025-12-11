# Design Variables Reference

This document describes the design system variables that have been integrated into the project.

## Overview

The design variables from your Figma design have been converted to CSS variables and integrated into the Tailwind configuration. These variables automatically adapt to light and dark modes.

**All shadcn UI components now automatically use the design system colors** through CSS variable mappings.

## Available Variables

### Background Colors
- `design-background` - Main page background (`#f7f5f3` in light mode)
- `design-surface-default` - Default surface color for cards, modals (`#ffffff` in light mode)
- `design-surface-field` - Input fields and secondary surfaces (`#f7f5f3` in light mode)
- `design-surface-inverted` - Dark/inverted surfaces (`#151514`)

### Content Colors (Text)
- `design-content-default` - Primary text color (`#151514` in light mode)
- `design-content-weak` - Secondary/weaker text (`#434343` in light mode)
- `design-content-weakest` - Tertiary/weakest text (for labels, hints)

### Border Colors
- `design-border-default` - Default border color (`#e0e0e0` in light mode)

### Button Colors
- `design-button-primary` - Primary button background (`#151514` in light mode)
- `design-on-button-content` - Text color on primary buttons (`#ffffff`)
- `design-on-button-content-inverted` - Text color on inverted buttons (`#151514`)

## Usage in Tailwind Classes

### Background Colors
```tsx
<div className="bg-design-background">...</div>
<div className="bg-design-surface-default">...</div>
<div className="bg-design-surface-field">...</div>
<div className="bg-design-surface-inverted">...</div>
```

### Text Colors
```tsx
<p className="text-design-content-default">Primary text</p>
<p className="text-design-content-weak">Secondary text</p>
<p className="text-design-content-weakest">Tertiary text</p>
```

### Border Colors
```tsx
<div className="border border-design-border-default">...</div>
```

### Button Colors
```tsx
<button className="bg-design-button-primary text-design-on-button-content">
  Primary Button
</button>
```

## Opacity Support

For colors that need opacity (like `content-weakest` which was `#15151466`), you can use Tailwind's opacity modifiers:

```tsx
<p className="text-design-content-default/40">Text with 40% opacity</p>
<div className="bg-design-surface-default/50">Background with 50% opacity</div>
```

## Dark Mode

All variables automatically adapt to dark mode. No need to add `dark:` variants - the CSS variables handle this automatically.

## Migration from Hardcoded Colors

### Before
```tsx
<div className="bg-[#f7f5f3] dark:bg-[#141414]">
  <p className="text-[#141414] dark:text-white">Text</p>
</div>
```

### After
```tsx
<div className="bg-design-background">
  <p className="text-design-content-default">Text</p>
</div>
```

## Updated Components

The following components have been updated to use the new design variables:
- `Button.tsx` - All button variants now use design variables
- `Card.tsx` - Card backgrounds and borders use design variables
- `TextArea.tsx` - Input styling uses design variables
- `GuestSidebar.tsx` - Sidebar colors use design variables
- `page.tsx` - Main page background and text colors use design variables

## Shadcn UI Components

All shadcn UI components automatically use the design system through CSS variable mappings:

- **Input** (`app/components/ui/input.tsx`) - Uses `bg-design-surface-field` for input backgrounds
- **Textarea** (`app/components/ui/textarea.tsx`) - Uses `bg-design-surface-field` for textarea backgrounds
- **Select** (`app/components/ui/select.tsx`) - Uses `bg-design-surface-field` for select triggers
- **Button** (`app/components/ui/button.tsx`) - Uses design system colors via `--primary` and `--primary-foreground`
- **Card** (`app/components/ui/card.tsx`) - Uses design system colors via `--card` and `--card-foreground`
- **Dialog, Popover, Dropdown** - All use design system colors via `--popover`, `--background`, etc.

### CSS Variable Mappings

The standard shadcn CSS variables are mapped to design system variables:

| Shadcn Variable | Design System Variable |
|----------------|------------------------|
| `--background` | `--design-background` |
| `--foreground` | `--design-content-default` |
| `--card` | `--design-surface-default` |
| `--primary` | `--design-button-primary` |
| `--primary-foreground` | `--design-on-button-content` |
| `--border` | `--design-border-default` |
| `--input` | `--design-border-default` |
| `--muted` | `--design-surface-field` |
| `--muted-foreground` | `--design-content-weak` |
| `--accent` | `--design-surface-field` |
| `--accent-foreground` | `--design-content-default` |

This means all shadcn components automatically inherit the design system colors without needing individual updates.

## CSS Variables Location

The CSS variables are defined in `app/globals.css` under the `:root` and `.dark` selectors. They use HSL format for better color manipulation.

## Tailwind Config

The design variables are available in `tailwind.config.js` under the `design` color namespace.

