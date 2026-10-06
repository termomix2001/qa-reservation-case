# Requirements traceability

| ID | Requirement | Automated evidence |
|---|---|---|
| R-01 | A standard vehicle uses the catalog base price | `returns the base price for a standard vehicle` |
| R-02 | Larger vehicles receive a 20% surcharge | `applies vehicle and heavy-dirtiness surcharges independently` |
| R-03 | Heavy dirtiness affects interior work only | Unit and parameterized pytest quote tests |
| R-04 | Extreme interior dirtiness is individually priced | Unit and pytest quote tests |
| R-05 | Pickup below threshold costs 499 | `charges pickup below the free-pickup threshold` |
| R-06 | Duplicate services are not billed twice | `rejects duplicate services before they can be billed twice` |
| R-07 | Booking requires 48 hours notice | `rejects a reservation with less than 48 hours notice` |
| R-08 | Work runs only in business windows | Friday-to-Monday rollover unit test |
| R-09 | Active reservations cannot overlap | TypeScript and Python conflict tests |
| R-10 | Adjacent reservations are allowed | Adjacent interval unit test |
| R-11 | Workflow steps cannot be skipped | Unit state matrix and E2E workflow test |
| R-12 | Unknown request properties are rejected | Pytest unknown-property test |
| R-13 | Service IDs are unique and schema-compliant | Pytest catalog contract test |
