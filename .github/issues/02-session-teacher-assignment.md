## Parent

#7

## What to build

Add Session-level Teacher assignment and Session status. Each Session gets an optional `teacher_user_id` and a `status` (`scheduled` | `cancelled`). Migrate existing workshop-level teacher to all sessions of that workshop. Public Workshop detail shows the assigned Teacher per Session.

## Acceptance criteria

- [ ] `workshop_sessions` has `teacher_user_id` and `status` columns with migration from `workshops.teacher_user_id`
- [ ] Public catalog and Workshop detail display assigned Teacher per Session
- [ ] Cancelled Sessions are not bookable and are visually distinct or hidden
- [ ] RLS updated so Session writes remain Owner-only (prep for later slices)
- [ ] Seed data reflects session-level assignment

## Blocked by

None - can start immediately
