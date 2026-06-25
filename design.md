# Beauty Picks — Design Document

## Overview
A single-page affiliate link hub ("Linktree-style") for curated beauty brand recommendations. The design communicates freshness, trust, and modern simplicity through a mint-forward palette and generous whitespace.

---

## Design Direction

**Tone:** Fresh, clean, approachable, lightly luxurious  
**Metaphor:** A perfectly organized vanity tray — everything in its place, inviting to browse, effortless to use.  
**Energy:** Calm confidence, not clinical coldness.

---

## Color Palette

### Semantic Tokens (CSS Variables)
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.985 0.008 150)` | Page background, mint wash |
| `--foreground` | `oklch(0.22 0.02 160)` | Primary text |
| `--primary` | `oklch(0.55 0.14 155)` | CTAs, icons, accents |
| `--primary-foreground` | `oklch(0.985 0.005 150)` | Text on primary buttons |
| `--secondary` | `oklch(0.94 0.02 155)` | Secondary surfaces |
| `--secondary-foreground` | `oklch(0.35 0.05 160)` | Text on secondary |
| `--card` | `oklch(0.99 0.005 150)` | Link cards, elevated surfaces |
| `--card-foreground` | `oklch(0.22 0.02 160)` | Text on cards |
| `--muted` | `oklch(0.92 0.015 155)` | Subtle backgrounds |
| `--muted-foreground` | `oklch(0.55 0.04 160)` | Secondary text, labels |
| `--border` | `oklch(0.88 0.02 155)` | Dividers, card outlines |
| `--accent` | `oklch(0.85 0.06 155)` | Highlights, hover states |
| `--destructive` | `oklch(0.55 0.18 25)` | Delete, danger actions |

### Gradients & Effects
| Token | Value |
|-------|-------|
| `--gradient-mint` | `linear-gradient(180deg, oklch(0.985 0.008 150) 0%, oklch(0.96 0.015 155) 100%)` |
| `--gradient-button` | `linear-gradient(135deg, oklch(0.55 0.14 155), oklch(0.45 0.12 160))` |
| `--shadow-soft` | `0 4px 24px -8px oklch(0.4 0.06 155 / 0.15)` |
| `--shadow-card` | `0 8px 32px -12px oklch(0.4 0.06 155 / 0.2)` |

---

## Typography

| Role | Font | Weight | Size | Letter-spacing |
|------|------|--------|------|----------------|
| Display / Name | System UI / -apple-system | 600 | 24–30px | -0.02em |
| Body | System UI / -apple-system | 400 | 14–16px | normal |
| Link Title | System UI / -apple-system | 600 | 16px | -0.01em |
| Link Description | System UI / -apple-system | 400 | 12px | normal |
| Label / Caption | System UI / -apple-system | 500 | 11–12px | 0.05em (uppercase labels) |

Line-height: 1.4 for body, 1.2 for headings.

---

## Spacing System

| Token | Value |
|-------|-------|
| Page padding | `px-5` (20px) |
| Max content width | `max-w-xl` (576px) |
| Section gap | `gap-3` (12px) between links |
| Card padding | `p-4` (16px) |
| Card border-radius | `rounded-2xl` (16px) |
| Button border-radius | `rounded-full` or `rounded-md` |

---

## Components

### Link Card
- Surface: `--card` background
- Border: `1px solid --border`
- Shadow: `--shadow-card`
- Hover: `translateY(-2px)` + deeper shadow `0 14px 36px -12px oklch(0.4 0.08 155 / 0.3)`
- Active arrow icon: circular `--secondary` background, transitions to `--primary` on hover
- Structure: title (truncate) + optional description (truncate) + arrow icon

### Profile Header
- Avatar area: `h-20 w-20` circular card with `--shadow-soft`
- Icon: `Sparkles` in `--primary`
- Name: Display typography
- Tagline: Body typography in `--muted-foreground`

### Admin Toggle
- Position: top-right of page
- Style: pill button, `bg-card/70 backdrop-blur`, `--muted-foreground` text
- Hover: `--foreground` text

### Admin Form Card
- Surface: `--card` with `--shadow-card`
- Section label: uppercase, `--muted-foreground`, letter-spaced
- Inputs: standard `Input` / `Textarea` components with `--border`

---

## Layout

### Public Page (`/`)
```
Full-height mint gradient background
└─ Centered max-width column (max-w-xl)
   ├─ Admin pill link (top-right)
   ├─ Profile header (centered)
   ├─ Stack of link cards (flex-col gap-3)
   └─ Footer text (centered, muted)
```

### Admin Page (`/admin`)
```
Standard background (--background)
└─ Centered max-width column (max-w-2xl)
   ├─ Back link + action buttons row
   ├─ "Admin" heading + description
   ├─ Profile card (name + tagline inputs)
   ├─ Links card (draggable list with edit/remove)
   └─ Tip footer
```

---

## Motion & Interaction

- **Link card hover:** `translateY(-2px)` + shadow lift, 200ms ease-out
- **Arrow icon hover:** background color transition to `--primary`, icon to `--primary-foreground`
- **Button interactions:** standard shadcn transition (colors, 150ms)
- **Page transitions:** none (simple server-rendered feel)
- **Reorder buttons:** instant swap, no animation needed for this scope

---

## Responsive Behavior

| Breakpoint | Change |
|------------|--------|
| Mobile (default) | `px-5`, `py-10`, full width |
| `sm:` (640px+) | `py-16`, slightly larger type |

No complex breakpoints — the single-column layout scales naturally.

---

## Assets

| Asset | Usage | Notes |
|-------|-------|-------|
| `Sparkles` (lucide) | Profile avatar placeholder | Mint-colored icon in circular card |
| `ArrowUpRight` (lucide) | Link card CTA | Circular button, hover state |
| `Settings` (lucide) | Admin entry icon | Small pill button |
| `ArrowLeft` (lucide) | Admin back navigation | |
| `GripVertical`, `Plus`, `Save`, `Trash2`, `RotateCcw`, `Download` (lucide) | Admin controls | |

No custom images or illustrations — purely icon-driven.

---

## Accessibility

- All links open in new tab with `rel="noopener noreferrer sponsored"`
- Admin page: `robots: noindex,nofollow`
- Icon buttons have `aria-label`
- Color contrast meets WCAG AA for all text/background pairs
- Focus rings: `focus-visible:ring-1 focus-visible:ring-ring`

---

## Design Principles

1. **One breath per card** — each link card is self-contained, scannable, and actionable.
2. **Mint as air** — the gradient background should feel like fresh air, not decoration.
3. **Elevate on interaction** — cards physically lift on hover; the interface responds to touch.
4. **No noise** — no decorative flourishes, no gradients on text, no drop shadows on static elements.
5. **Trust through clarity** — affiliate disclosure is visible but unobtrusive.
