# Room shifting and shared service menu

Routes: `/room-shifting`, `/user/dashboard/shifting`, `/admin/dashboard/shifting`.
Requires the matching Room Shifting backend module and migration; deploy the backend before exposing the frontend route.

The first release includes private item photos (3 × 1 MB), manual addresses/optional coordinates, pickup/drop-off floors and access, Nepal-time scheduling, vehicle/labour/extras, admin quotes and crew assignment, explicit owner acceptance, booking-specific messages, cancellation before moving starts, and one completed-booking review. There is no payment, automatic dispatch or push/SMS delivery. Use Refresh for updates.

`components/common/ServicesMenu.tsx` is the single service drawer used by public navbar, user mobile header, admin header/mobile sidebar and the new mobile bottom-nav Menu button. Original Home/Jobs/Add/Messages/Profile destinations remain. The bottom bar remains 68px tall; its six slots fit small screens without changing other pages' spacing. Desktop dashboard sidebars remain unchanged apart from the Room Shifting link. Filters, account dropdowns, job flows and message actions are not replaced.

The drawer is a fixed 100dvh dialog with a non-scrolling title/close area and a separate scroll container. It locks background scroll using the existing Radix modal, has focus trapping/Escape/close controls, closes on navigation, uses a unique tile-section ID per instance, and has its own overlay above the chatbot and bottom navigation. No global CSS or unrelated service APIs were modified. Unimplemented services remain labelled Coming soon.

## Verification before merge

- `pnpm install --frozen-lockfile` then `pnpm build` in a full checkout.
- Check the new route in English/Nepali, logged out, user and admin.
- On a narrow mobile screen, open each menu launcher; scroll to the last tile, close/Escape, and confirm the previous page scroll is restored. Test the oldest supported iPhone viewport and desktop.
- Test other services: rooms list filters, job pages, message search, profile, add-room form and dashboard links.
- Exercise the backend smoke-test sequence documented in the companion backend change before enabling real bookings.

Implementation checks performed in the editing environment: isolated TypeScript checks of the new frontend/backend modules, using existing API contracts and UI types, plus backend unit/rule tests. The isolated frontend check used already-installed scoped Radix types because installing the unified `radix-ui` package was blocked. This is not a full Next.js production build or a browser/E2E test.
