## Parent

#7

## What to build

Rename the profile role from `guest` to `participant` end-to-end. Migrate existing profile rows and the check constraint. Update auth guards, invite-after-checkout flow, and any UI or type references. Unauthenticated users remain **Visitors** in domain language — never called "guest" in new copy.

## Acceptance criteria

- [ ] Database migration renames role value `guest` → `participant` on all existing profiles and updates the check constraint
- [ ] Auth role types, guards, and profile upserts use `participant` consistently
- [ ] Checkout invite flow creates profiles with role `participant`
- [ ] No user-facing or developer-facing references to "guest" role remain (Visitor used for anonymous users where needed)
- [ ] Existing Participant flows (login, dashboard, booking) continue to work

## Blocked by

None - can start immediately
