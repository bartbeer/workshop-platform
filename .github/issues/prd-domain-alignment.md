## Problem Statement

Makerslabo has a working booking and payment loop, but the codebase contradicts the agreed domain model. Teachers can create Workshops even though Workshops are platform-owned. Teachers are linked at the Workshop level, not per Session. The profile role `guest` collides with "unauthenticated visitor." Legacy Registration terminology persists in the schema. Teachers have no view of their assigned Sessions or attendee lists. The Owner cannot cancel an entire Session. These gaps block a coherent launch where the Owner centrally manages the catalog and Teachers focus on running assigned Sessions.

## Solution

Align the platform with the domain glossary in `CONTEXT.md`: platform-owned Workshops, Session-level Teacher assignment, Participant role (replacing guest), Owner-only Workshop creation, a Teacher dashboard for assigned Sessions and attendance, Owner-driven Session cancellation, and both Teacher onboarding paths (invite and application).

## User Stories

1. As a Visitor, I want to browse Workshops and Sessions without an account, so that I can discover offerings before committing.
2. As a Visitor, I want to book attendee spots on a Session, so that I can reserve a place at a workshop date.
3. As a Participant, I want to create an account or sign in when booking, so that I can manage my Bookings in a dashboard.
4. As a Participant, I want to book multiple attendee spots in one Booking, so that I can bring friends without them needing accounts.
5. As a Participant, I want to pay for paid Sessions via Stripe, so that I can complete my reservation securely.
6. As a Participant, I want to book free Sessions without payment, so that I can join no-cost offerings easily.
7. As a Participant, I want to receive a confirmation email after booking, so that I have proof of my reservation.
8. As a Participant, I want to see my upcoming and past Bookings on a dashboard, so that I know what I am registered for.
9. As a Participant, I want to cancel my own Booking, so that I can free my attendee spots when I cannot attend.
10. As a Participant, I want clear messaging that paid Booking cancellations do not auto-refund, so that I know to contact the Owner for refunds.
11. As a new booker without an account, I want to receive an invite email after checkout, so that I can set a password and access my dashboard.
12. As a Participant, I want my profile role to be called Participant (not guest), so that terminology matches my relationship to the platform.
13. As the Owner, I want to create Workshops with one or more Sessions, so that I control the platform catalog.
14. As the Owner, I want to assign a Teacher to each Session when creating or editing a Workshop, so that different Teachers can run different dates.
15. As the Owner, I want to assign myself as Teacher on a Session, so that I can run workshops I teach.
16. As the Owner, I want to edit any Workshop and Session, so that I can fix errors without asking a Teacher.
17. As the Owner, I want to invite someone to become a Teacher by email, so that I can onboard known instructors.
18. As the Owner, I want to review and approve or reject Teacher applications, so that inbound interest is gated.
19. As the Owner, I want to cancel an entire Session, so that I can handle venue or schedule problems in one action.
20. As the Owner, I want all confirmed Bookings on a cancelled Session to be cancelled automatically, so that capacity and records stay consistent.
21. As the Owner, I want Participants on a cancelled Session to be notified, so that they know not to show up.
22. As the Owner, I want to handle paid Booking refunds manually in Stripe after Session cancellation, so that v1 avoids complex refund automation.
23. As a Teacher, I want to see Sessions assigned to me, so that I know when and where I am teaching.
24. As a Teacher, I want to see who booked each assigned Session (booker contact and attendee spot count), so that I can prepare for the class.
25. As a Teacher, I want to mark attendance for attendee spots on my assigned Sessions, so that I can record who showed up.
26. As a Teacher, I want to apply to become a Teacher via a self-serve form, so that I can express interest without waiting for an invite.
27. As a Teacher applicant, I want to see my application status, so that I know whether I am approved.
28. As a Participant, I want cancelled Sessions hidden or clearly marked on the public catalog, so that I do not book dates that will not run.
29. As a Participant, I want to see which Teacher runs each Session on the Workshop detail page, so that I know who will instruct the class.
30. As the Owner, I want Teachers to be unable to create or edit Workshop catalog content, so that the platform-owned model is enforced.

## Implementation Decisions

- Adopt vocabulary from `CONTEXT.md` throughout code, UI copy (Dutch where user-facing), and database comments.
- Rename profile role `guest` → `participant` via migration updating the check constraint and all existing rows; update RLS policies, auth guards, and invite flows accordingly.
- Add `teacher_user_id` (nullable FK to auth.users) on `workshop_sessions`; migrate existing data from `workshops.teacher_user_id` to all sessions of that workshop; deprecate workshop-level teacher for authorization (keep column temporarily for backward compatibility or remove after migration).
- Add `status` on `workshop_sessions` with values `scheduled` and `cancelled` (default `scheduled`); cancelled sessions excluded from public booking UI.
- Restrict Workshop and Session write operations to Owner only; remove or gate the current Teacher create-workshop flow.
- Move Workshop creation UI to Owner admin area; include per-Session Teacher assignment (dropdown of approved Teachers + Owner).
- Teacher dashboard: list Sessions where `teacher_user_id` matches current user and status is `scheduled`; show Workshop title, datetime, location, capacity, confirmed attendee spots, and booker details from confirmed Bookings.
- Attendance: add `session_attendance` table or attendance fields linking Booking + Session with per-spot present/absent; Teachers can update only for their assigned Sessions.
- Session cancellation server action (Owner only): set session status to cancelled, bulk-update confirmed/pending Bookings to cancelled, trigger notification emails (reuse Resend patterns from enrollment confirmation).
- Teacher application flow: enable `/dashboard/become-teacher` form writing to `teacher_applications`; Owner admin view to approve/reject and promote profile role to `teacher`.
- Keep `workshop_registrations` table but do not extend; no new features on legacy Registration model.
- Keep manual refund policy for v1; document in cancellation UI for Participants and in Owner session-cancel flow.

## Testing Decisions

- No automated test suite exists today; introduce tests only where they verify externally observable behavior.
- Prefer integration tests at the server-action boundary (booking, workshop creation, session cancel, role checks) using a test Supabase project or mocked admin client where feasible.
- RLS policy changes should be verified with representative user contexts: Visitor (anon), Participant, Teacher (assigned vs unassigned), Owner.
- Attendance and session cancellation: assert end-state in database (session status, booking statuses, capacity freed) rather than internal function calls.
- Stripe webhook and checkout flows already work; regression-test capacity enforcement and fulfillment idempotency when touching booking code.
- Manual smoke test checklist for each vertical slice: Owner creates workshop → Participant books → Teacher sees assignment → Teacher marks attendance → Owner cancels session.

## Out of Scope

- Automatic Stripe refunds on Booking or Session cancellation
- Co-teaching (multiple Teachers per Session)
- Multi-Owner / admin roles beyond the single Owner
- Workshop draft vs published workflow (Workshops go live on create unless added later)
- Newsletter, shop, artists, and other marketing placeholders
- Removing the legacy `workshop_registrations` table (deprecate only)
- Participant self-service partial cancellation of attendee spots (change count on existing booking)
- Mobile app or offline attendance

## Further Notes

- Domain glossary established in grill-with-docs session; see `CONTEXT.md`.
- Current MVP already supports Session booking, Stripe checkout, Participant dashboard, and Owner teacher invites — this PRD focuses on aligning roles, ownership, assignment, and Teacher/Owner workflows with the agreed model.
- Testing seams: server actions (highest practical layer), Supabase RLS, existing Stripe webhook route. No new test infrastructure unless a slice requires it.
