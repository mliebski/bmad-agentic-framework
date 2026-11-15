# Prepared answers

- **Project name:** ClinicSlot. **Track:** enterprise. Greenfield for the patient side; it must
  integrate with the existing practice-management system, which owns the calendar. It has a
  web user interface, used mostly on phones.
- **Users:** about 40,000 registered patients, many over 65; 30 reception staff; 60 clinicians
  (read-only view of their day).
- **Problem cost:** about 35 % of morning calls abandoned; no-show rate 12 %.
- **Success:** 40 % of appointments booked online within six months; no-show rate under 8 %;
  abandoned calls under 15 %.
- **Must have:** patient identity verification, see free slots per clinic and clinician, book,
  reschedule, cancel, reminders by SMS and email, staff view to override, audit trail of every
  access to patient data.
- **Later, not now:** video consultations, payments, prescriptions, waiting-list auto-fill,
  native mobile apps.
- **Integration:** the practice-management system exposes a REST API for slots and
  appointments; it is the source of truth; it is sometimes unavailable for minutes at a time
  and has a rate limit of 10 requests a second.
- **Regulation:** health data of EU residents — GDPR special-category data; data must stay in
  the EU; access must be logged and logs kept six years; patients can request export and deletion.
- **Availability:** 99.9 % during 06:00–22:00; double bookings are unacceptable.
- **Performance:** slot search under 1 second at the 95th percentile with 300 concurrent users.
- **Accessibility:** WCAG 2.2 AA is mandatory; many users have low vision.
- **Constraints:** team of four, five months, hosted in the organisation's EU cloud tenancy,
  penetration test required before go-live.
- **Anything unanswered:** choose the conservative option and record it as an open question.
