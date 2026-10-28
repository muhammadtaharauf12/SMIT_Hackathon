# Nexora visual system

## Direction

Nexora is a composed operations workspace for people teams. The supplied Nexora HCM references use a quiet, high-trust interface: deep navy for navigation and authority, teal for progress and primary action, pale blue-gray surfaces for separation, and restrained color for status. The product should feel dependable during daily HR work, with one memorable moment reserved for the AI assistant.

The visual reference files are `Assets/Nexora HCM Desktop.png` and `Assets/Nexora HCM Mobile.png`. Their sample records are visual inspiration only; Nexora starts with empty data per the official HCM Lite brief.

## Tokens

| Token | Value | Use |
|---|---|---|
| Ink / navy | `#14213D` | Sidebar, headings, strong controls |
| Ink soft | `#53627A` | Supporting copy and metadata |
| Teal | `#0FA88F` | Primary actions, present/success status |
| Aqua | `#2CB6C8` | Informational highlights and charts |
| Violet | `#6654D9` | AI surfaces and smart insights |
| Amber | `#F2A62B` | Pending, attention, late status |
| Coral | `#E85C56` | Destructive/error/absent status |
| Canvas | `#F4F7FB` | App background |
| Panel | `#FFFFFF` | Cards, forms, tables |
| Line | `#E3E9F2` | Borders and dividers |

## Typography

- Geist Sans is the primary family, matching the existing Next setup and the reference's compact modern proportions.
- Page titles: 28-32px, weight 650, tight line height.
- Section titles: 16-18px, weight 650.
- Body: 14px with 1.5 line height.
- Metadata: 12px, medium weight, soft ink. Use sentence case; reserve uppercase for short system labels only.
- Keep readable line lengths below 80 characters and use numerals as information, not decoration.

## Layout

Desktop uses a 232px navy sidebar beside a fluid workspace. The content area uses a 24px outer gutter, a compact top bar, and a 12-column grid for dashboards. Panels use 14px radius, 1px line borders, and no diffuse shadow; elevation comes from canvas-to-panel contrast.

```text
┌───────────────┬─────────────────────────────────────────────┐
│ Nexora         │ Search       alerts       user                │
│ role-aware     ├─────────────────────────────────────────────┤
│ navigation     │ page title + context action                  │
│                │                                                │
│                │ KPI strip / primary work panel / side insight │
└───────────────┴─────────────────────────────────────────────┘
```

At 375px, the sidebar becomes a compact top bar or drawer, panels stack in one column, tables become row cards, and primary actions remain reachable without horizontal scrolling.

## Components

- `BrandMark`: geometric N mark in teal and aqua with a plain Nexora wordmark.
- `Sidebar`: role-aware menu with active white selection inside the navy workspace.
- `Topbar`: organization context, live status, role and user marker.
- `StatCard`: one meaning and one status line. Never show fabricated figures.
- `Panel`: white surface with a clear title, optional action, and generous internal spacing.
- `StatusPill`: teal present/approved, amber pending/late, violet AI, coral rejected/error.
- `PrimaryButton`: navy filled for high-consequence actions; teal for positive operational actions.
- `Input`: white field, visible label, 10px radius, 2px teal focus ring, inline error below.
- `EmptyState`: explain what is missing and give the next action, especially on first-run screens.

## Interaction principles

- First-run setup is a guided, calm form with a short explanation of why company details matter.
- Role changes navigation and dashboard language; it never replaces server authorization.
- Loading uses a quiet progress line or disabled action label. Errors name the action and recovery step.
- AI is visually distinct through violet accents and an `AI-generated` label. It never looks like the source of record.
- Use motion only for a single page entrance and action confirmation. Respect `prefers-reduced-motion`.
- Every control has a keyboard focus state, a label, and a mobile-sized hit area.

## Responsive checks

- 375px: setup/login form fits without zoom; panels stack.
- 768px: navigation and form columns transition without clipped labels.
- 1280px: sidebar, topbar and workspace retain the reference's calm density.
- Verify empty, loading, error and success states before adding secondary dashboards.
