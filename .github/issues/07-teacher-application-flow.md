## Parent

#7

## What to build

Enable self-serve Teacher applications and Owner review. Participants submit an application form. Owner sees pending applications in admin, approves or rejects, and approved applicants receive Teacher role. Invite flow continues to work alongside applications.

## Acceptance criteria

- [ ] `/dashboard/become-teacher` shows application form for Participants (not already Teachers)
- [ ] Submission creates a `teacher_applications` row with status `pending`
- [ ] Applicant sees pending/approved/rejected status on dashboard
- [ ] Owner can approve or reject from admin; approval sets profile role to `teacher`
- [ ] Existing Owner invite flow still works
- [ ] Rejected applicants remain Participants

## Blocked by

#1
