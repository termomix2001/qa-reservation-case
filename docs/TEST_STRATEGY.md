# Risk-based test strategy

## Objective

Provide fast feedback on the reservation rules with the highest financial or
operational impact, then verify the public HTTP contract independently from the
implementation language.

## Product risks

| Risk | Impact | Likelihood | Primary coverage |
|---|---:|---:|---|
| Incorrect quote or surcharge | High | Medium | Unit + API parameterization |
| Two active jobs occupy the same bay | Critical | Medium | E2E conflict test |
| UI and backend disagree on duration | High | Medium | Catalog/quote contract + bug regression |
| Illegal workflow transition | High | Medium | Unit state matrix + E2E |
| Reservation accepted outside business rules | High | Medium | Unit boundaries + API negative tests |
| Breaking API response shape | Medium | Medium | Python JSON Schema tests |
| Test automation modifies production | Critical | Low | Local-host safety guard |
| PII appears in logs or fixtures | High | Low | Synthetic `.test` data only; full security suite out of scope |

## Test layers

### 1. Domain unit tests

The fastest layer covers quote mathematics, rounding, pickup thresholds, weekend
rollover, adjacent intervals, 48-hour notice, and all legal workflow steps. Inputs
use fixed timestamps to avoid flaky tests.

### 2. Nest HTTP end-to-end tests

The application is booted in process and called through Supertest. These tests
exercise routing, DTO transformation, whitelist behavior, validation error codes,
serialization, storage orchestration, conflict handling, and workflow updates.

### 3. Python black-box tests

Pytest knows only the HTTP API. It validates response schemas, catalog invariants,
parameterized pricing, invalid equivalence classes, overlap errors, and a complete
workflow. This suite can later target an isolated deployed environment by changing
`QA_API_URL`.

## Test design techniques

- Equivalence partitioning: supported/unsupported vehicle and dirtiness types.
- Boundary value analysis: 08:00, 19:30, 20:00, 47:59, and 48:00 notice.
- Decision tables: vehicle surcharge x dirtiness surcharge x interior content.
- State transition testing: happy path, cancellation exits, and forbidden skips.
- Pairwise candidates: vehicle type, dirtiness, service category, and pickup.
- Contract testing: required fields, types, unique catalog IDs, unknown fields.

## Test data and isolation

- Customer identities are synthetic and use the reserved `.test` domain.
- Unit tests use immutable fixed dates.
- API tests use future weekdays and unique email addresses.
- The demo repository resets between TypeScript E2E tests.
- Remote black-box execution is denied by default.

## Exit criteria

- TypeScript build succeeds.
- All unit and E2E tests pass.
- Python contract and workflow tests pass against a fresh API process.
- No secrets or production identifiers are present in the repository.
- Coverage thresholds pass when running `npm run test:coverage`.

## Residual risks and next tests

- PostgreSQL race conditions require concurrent integration tests and a database
  constraint or serializable transaction, not only an application-level lookup.
- DST transitions require timezone-aware tests in `Europe/Prague`.
- Authentication/authorization requires role and object-level access tests.
- PII encryption requires key-rotation and non-disclosure tests.
- File upload requires MIME sniffing, size limits, malware scanning, signed URL,
  and object-deletion tests.
- Performance should be measured with realistic reservation counts and p95/p99
  service-level objectives.
