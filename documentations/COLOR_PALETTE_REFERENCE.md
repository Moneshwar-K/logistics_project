# Google/Microsoft Professional Color Palette Reference

## Primary Colors

### Light Theme (Default)
```css
--background: #ffffff          /* Clean white background */
--foreground: #202124          /* Dark gray text for readability */
--primary: #1f2937             /* Charcoal for main actions */
--accent: #1a73e8              /* Google Blue for highlights */
--border: #dadce0              /* Subtle light gray borders */
```

### Dark Mode Alternative
```css
--background: #121212          /* Deep black background */
--foreground: #f3f3f3          /* Light gray text */
--primary: #8ab4f8             /* Light blue for dark mode */
--accent: #8ab4f8              /* Light blue accents */
--border: #424242              /* Medium gray borders */
```

## Card & Container Colors
```css
--card: #f8f9fa                /* Light gray cards (light theme) */
--card: #1e1e1e                /* Dark cards (dark theme) */
--muted: #e0e0e0               /* Disabled/inactive background */
--input: #ffffff               /* White input fields (light theme) */
--input: #1e1e1e               /* Dark input fields (dark theme) */
```

## Status Colors (Logistics Operations)
```css
--status-delivered: #34a853    /* Google Green - Successful delivery */
--status-in-transit: #1a73e8   /* Google Blue - In process */
--status-pending: #fbbc04      /* Google Yellow - Awaiting action */
--status-on-hold: #d33b27      /* Google Red - Blocked/held */
--status-exception: #ea4335    /* Google Red - Error/exception */
```

## Usage Examples

### KPI Cards (Audit Dashboard)
- Total HAWBs: Blue (#1a73e8)
- Pending Audits: Yellow (#fbbc04)
- Audited Today: Green (#34a853)
- Discrepancies: Red (#d33b27)

### Status Badges
```jsx
<span className="bg-green-50 text-green-600">Delivered</span>
<span className="bg-blue-50 text-blue-600">In Transit</span>
<span className="bg-yellow-50 text-yellow-600">Pending</span>
<span className="bg-red-50 text-red-600">On Hold</span>
```

### Icon Colors
- Map/Location: `text-blue-600` (primary navigation)
- Package/Cartons: `text-blue-600` (inventory)
- Calendar/Date: `text-blue-600` (scheduling)
- Alerts/Error: `text-red-600` (critical)
- Success/Completed: `text-green-600` (confirmation)

### Gradients
- Hero Sections: `from-blue-600 to-blue-500`
- Headers: `from-blue-50 to-white`
- Cards: `bg-blue-50` (light theme)

## Tailwind Class Mappings

| Element | Light Theme | Dark Theme |
|---------|-------------|-----------|
| Background | `bg-white` | `bg-slate-950` |
| Text | `text-gray-900` | `text-gray-100` |
| Cards | `bg-blue-50 border-blue-200` | `bg-slate-900 border-slate-800` |
| Inputs | `bg-white border-gray-300` | `bg-slate-800 border-slate-700` |
| Primary Button | `bg-blue-600 hover:bg-blue-700` | `bg-blue-500 hover:bg-blue-600` |
| Status Badge | `bg-[color]-50 text-[color]-600` | `bg-[color]-900 text-[color]-300` |

## Implementation in Components

```jsx
// Header with proper theming
<div className="bg-blue-50 border-b border-blue-200 p-4">
  <h1 className="text-gray-900">Dashboard</h1>
</div>

// Status indicator
<span className="bg-green-50 text-green-600 px-3 py-1 rounded">Delivered</span>

// Icon with color
<MapPin className="text-blue-600" />

// Card layout
<div className="bg-white border border-blue-200 rounded-lg p-6">
  {/* Content */}
</div>
```

## Notes
- All colors are defined as CSS variables in `/app/globals.css`
- Use semantic class names: `text-foreground`, `bg-card`, `border-border`
- Status colors automatically adjust for light/dark mode
- Google's color palette ensures accessibility (WCAG AA compliant)
