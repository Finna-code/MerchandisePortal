# Design Guide

This document defines the lightweight UI/UX conventions used across the project to keep the experience cohesive and easy to extend.

## Foundations
- **Typography**
  - Use system defaults via the configured fonts (Geist family in `src/app/layout.tsx`).
  - Text contrast should respect light/dark mode.
- **Color**
  - Primary action button: black background, white text.
  - Secondary actions: outlined button.
  - Destructive actions: red (destructive) variant.
- **Spacing & Layout**
  - Page container: `max-w-7xl mx-auto px-4`.
  - Section spacing: `py-8` for app/admin pages, `py-16+` for marketing/landing sections.
  - Use `Card > CardHeader > CardTitle > CardContent` to group forms and tables.
- **Elevation**
  - Subtle shadows only. Avoid heavy drop shadows except for large CTAs.

## Components
- **Buttons (`@/components/ui/button`)**
  - Default/Primary: black bg, white text (see `button.tsx`).
  - Outline: for secondary/neutral actions and header auth controls.
  - Destructive: for irreversible actions.
  - Sizes: `size="sm"` for compact controls (tables, toolbars), `size="lg"` for prominent CTAs.
- **Inputs & Forms**
  - Use `@/components/ui/input` and `@/components/ui/form` consistently.
  - Label every input using `FormLabel`; display validation messages via `FormMessage`.
  - Input adornments (icons, toggles) should be positioned with `relative`/`absolute` container wrappers.
- **Tables**
  - Use `@/components/ui/table` for admin listings.
  - Right-align the Actions column; use compact `size="sm"` buttons.
- **Header**
  - Sticky top header with brand and auth controls (`UserMenu`).
  - Use outline variant for Sign in / Sign out for visual hierarchy vs page primary actions.

## Behavior
- **Feedback**
  - Use inline error banners in forms; toast notifications can be added later for success actions.
- **Transitions & Motion**
  - Keep animations subtle: `transition-colors`/`transition-shadow`.
  - Avoid large or inconsistent animations.
- **Auth**
  - Users can browse without authentication.
  - Sign-in is available via the header and where required by protected routes.

## Implementation References
- `src/components/ui/button.tsx`: primary button style = black/white.
- `src/app/layout.tsx`: sticky header with brand and `UserMenu`.
- `src/components/user-menu.tsx`: consistent Sign in/Sign out buttons.
- `src/app/signin/page.tsx`: password visibility toggle with eye icon, shadcn form components.
- `src/app/page.tsx`: landing CTA links to `/products` to avoid duplicate sign-in CTAs.

## Future Enhancements
- Add toast notifications for common success actions.
- Add navigation links (Products, Dashboard, Admin) to the header.
- Add skeleton loaders for admin lists.
