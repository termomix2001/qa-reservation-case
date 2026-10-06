# Sample defect report

## Title

Reservation detail shows a two-hour job while the administration calendar blocks
four hours.

## Classification

- Severity: High
- Priority: High
- Area: Booking / schedule synchronization
- Reproducibility: Consistent for the affected service

## Preconditions

- The catalog defines `Comfort wet cleaning` with a duration of four hours.
- A free weekday slot starts at 16:00.

## Steps to reproduce

1. Create a booking for `Comfort wet cleaning` at 16:00.
2. Submit the reservation.
3. Open the customer reservation summary.
4. Open the same reservation in the administration calendar.

## Actual result

The customer detail displays 16:00-18:00, while the administration calendar
occupies 16:00-20:00.

## Expected result

Both views derive the finish time from the same catalog duration and display
16:00-20:00.

## Impact

The customer may arrive before the vehicle is ready. Staff see different data
from the customer, and later reservations may be planned using an incorrect
assumption.

## Evidence to collect

- Service catalog response for the selected service.
- Quote response `durationMinutes`.
- Create-reservation request and response.
- Customer detail API response.
- Calendar API response for the same reservation ID.

## Suspected cause

Duration is duplicated or converted independently in the frontend and backend.
One path may use a stale two-hour value while calendar capacity uses the current
four-hour catalog value.

## Regression automation

Create one contract test that selects every catalog service and verifies:

```text
finishAt - startAt across business windows == quote.durationMinutes
customer detail finishAt == admin calendar finishAt
```

The assertion should use the reservation ID as the correlation key and must not
recalculate duration from UI text.
