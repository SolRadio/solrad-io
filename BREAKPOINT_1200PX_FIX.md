# Breakpoint Fix: 1200px Desktop Threshold

## Summary
Fixed responsive layout issues where devices with 900-1200px viewport widths incorrectly rendered the Desktop layout, causing token card overlap and compression on small laptops, Surface devices, and tablets in landscape.

## Problem
Previously, the Desktop layout activated at `lg` (1024px) or `xl` (1280px), but the internal 4-column grid had different breakpoints, creating a mismatch that caused:
- Token cards to compress in narrow spaces
- Overlapping content on Surface devices
- Inconsistent layout between 1024-1280px

## Solution
Implemented **exact 1200px breakpoint** using Tailwind's arbitrary value syntax (`min-[1200px]:`):

### New Breakpoint Structure
```
Mobile:   < 768px   → MobileTerminal
Tablet:   768-1199px → TabletTerminal  
Desktop:  ≥ 1200px   → DesktopTerminal (4-column grid)
```

## Files Changed

### 1. `/app/globals.css`
- Added custom breakpoint documentation in `@theme inline`
- No actual CSS changes needed (using Tailwind arbitrary values)

### 2. `/app/page.tsx`
**Changes:**
- Line 423: Tablet layout now uses `hidden md:block min-[1200px]:hidden` (768-1199px)
- Line 441: Desktop layout now uses `hidden min-[1200px]:flex` (≥1200px)
- Line 448: Desktop padding uses `min-[1200px]:px-8`
- Line 449: Desktop grid uses `min-[1200px]:grid min-[1200px]:grid-cols-[260px_minmax(0,1fr)]`
- Line 451: Token Index sidebar uses `hidden min-[1200px]:flex`
- Line 769: Right rail ads stay at `2xl:flex` (1536px+)

### 3. `/components/desktop-terminal.tsx`
**Changes:**
- Line 123-124: Simplified grid to `grid-cols-4` (no responsive breakpoint needed)
- Removed `md:grid-cols-2 xl:grid-cols-4` since DesktopTerminal only renders at ≥1200px

## Validation

### Breakpoint Behavior
| Viewport Width | Active Layout | Grid Columns | Status |
|---------------|---------------|--------------|--------|
| 767px | Mobile | N/A | ✅ Mobile view |
| 768px | Tablet | 2 columns | ✅ Tablet activates |
| 1024px | Tablet | 2 columns | ✅ No Desktop yet |
| 1199px | Tablet | 2 columns | ✅ Tablet maximum |
| 1200px | Desktop | 4 columns | ✅ Desktop activates |
| 1536px | Desktop | 4 cols + right rail | ✅ Right rail shows |

### Device-Specific Testing
- ✅ **Surface Pro (1024x768)**: Tablet layout, 2 columns
- ✅ **Small laptop (1366x768)**: Desktop layout, 4 columns
- ✅ **iPad Pro landscape (1366x1024)**: Desktop layout, 4 columns
- ✅ **MacBook 13" (1440x900)**: Desktop layout, 4 columns
- ✅ **Standard desktop (1920x1080)**: Desktop layout with right rail

## Technical Details

### Why 1200px?
1. **Minimum space for 4 columns**: Each token card needs ~250px minimum width
2. **Account for padding/gaps**: 260px sidebar + gaps + 4 cards = ~1200px minimum
3. **Safe margin**: Prevents compression on devices with 1024-1199px viewports

### Using Tailwind Arbitrary Values
Tailwind v4 supports arbitrary breakpoints with `min-[XXXpx]:` syntax:
```tsx
// Old (using predefined xl breakpoint at 1280px)
className="hidden xl:flex"

// New (using exact 1200px breakpoint)
className="hidden min-[1200px]:flex"
```

### Grid Simplification
Since DesktopTerminal only renders at ≥1200px (guaranteed by parent), its internal grid doesn't need responsive breakpoints:
```tsx
// Before: Responsive grid that could render at 768px
<div className="grid md:grid-cols-2 xl:grid-cols-4">

// After: Fixed 4-column grid (only visible at ≥1200px)
<div className="grid grid-cols-4">
```

## No Side Effects
✅ No data changes
✅ No logic changes  
✅ No visual design changes
✅ No token filtering changes
✅ Large desktop experience identical (≥1200px)

## Result
- **Devices 900-1199px**: Now correctly show Tablet layout (2 columns)
- **Devices ≥1200px**: Show Desktop layout (4 columns)
- **No overlap**: Token cards have adequate space at all breakpoints
- **Consistent**: All components use same 1200px threshold
