# Makerslabo

Dutch-language workshop booking platform for a craft studio at De Oude Brouwerij van Kampenhout. This glossary defines domain terms for the platform — not implementation details.

## Catalog & scheduling

**Workshop**:
Shared catalog entry for a craft offering — title, description, image, and default price. Not directly bookable.
_Avoid_: Event, class (when meaning a single dated run)

**Session**:
One dated, bookable occurrence of a Workshop — start time, location, capacity, and price.
_Avoid_: Event (when meaning the catalog entry), date slot

**Attendee spot**:
One seat toward a Session's capacity. A Booking may include multiple attendee spots; only the booker has a platform account — companions are unnamed headcount.
_Avoid_: Participant (when meaning a seat count), ticket

## Bookings & payments

**Booking**:
One Participant account reserving one or more attendee spots on one Session. Capacity is counted in spots, not in booking rows.
_Avoid_: Registration, enrollment, inschrijving (Dutch UI copy only)

**Booking cancellation**:
A Participant cancels their own Booking, freeing attendee spots. Paid bookings are not automatically refunded in v1 — the Owner handles refunds manually.
_Avoid_: Unsubscribe, deregistration

**Session cancellation**:
The Owner cancels an entire Session. All confirmed Bookings on that Session are cancelled; Participants are notified; paid refunds are handled manually in v1.
_Avoid_: Workshop cancellation (when only one date is affected)

## People & roles

**Visitor**:
Unauthenticated person browsing the marketing site or workshop catalog.
_Avoid_: Guest (reserved for the deprecated profile role name)

**Participant**:
Registered user who books Sessions but does not teach. Renamed from the legacy `guest` profile role.
_Avoid_: Guest, customer, member

**Teacher**:
Person assigned to run one or more Sessions. Onboarded via Owner invite or approved self-serve application — the Owner is always the gatekeeper.
_Avoid_: Instructor (acceptable in marketing copy), artist

**Owner**:
Single platform super-admin who creates Workshops, assigns Teachers to Sessions, manages the catalog, and can override any content. May also be assigned to run Sessions.
_Avoid_: Admin (when meaning any staff), platform operator

## Ownership model

**Platform-owned Workshop**:
Workshops belong to the platform, not to individual Teachers. The Owner creates all Workshops and assigns Teachers per Session.
_Avoid_: Teacher-owned workshop, instructor catalog

**Teacher assignment**:
Link between a Teacher and a Session they will run. Assignment is per Session — different Teachers may run different dates of the same Workshop.
_Avoid_: Workshop teacher (when sessions differ), instructor link

## Deprecated terms

**Registration**:
Legacy per-Workshop enrollment model, superseded by Session-level Bookings. Do not use in new domain language.
_Avoid_: _(do not revive)_

**Guest** (profile role):
Deprecated name for Participant. Use Visitor for unauthenticated users and Participant for the registered booker role.
_Avoid_: Guest role, guest user
