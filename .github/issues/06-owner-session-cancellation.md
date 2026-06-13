## Parent

#7

## What to build

Owner can cancel an entire Session. Sets Session status to `cancelled`, cancels all confirmed and pending Bookings on that Session, frees capacity, and notifies affected Participants by email. Paid Bookings are not auto-refunded — Owner handles manually (note in UI).

## Acceptance criteria

- [ ] Owner-only action cancels a Session
- [ ] All non-cancelled Bookings on that Session become `cancelled`
- [ ] Cancelled Session no longer accepts new Bookings
- [ ] Affected Participants receive notification email
- [ ] UI states that paid refunds are handled manually by Owner

## Blocked by

#2
