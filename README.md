# Detailing Reservation API - QA Case Study

This repository is a **sanitized, production-inspired excerpt** of a real
vehicle-detailing reservation system. It is intentionally small enough to review
during an interview while retaining the failure modes that matter to a Software
Engineer in QA: pricing rules, time calculations, double booking, API validation,
and workflow transitions.

It contains no production database, customer data, credentials, storage keys, or
deployment URLs.

## What this demonstrates

- A NestJS REST API with runtime DTO validation and a reviewable OpenAPI contract.
- Pure domain logic separated from HTTP and persistence concerns.
- White-box unit tests for boundary-heavy business rules.
- End-to-end API tests through the real Nest HTTP stack.
- Black-box Python/pytest contract and workflow tests.
- A risk-based test strategy, traceability matrix, and realistic defect report.
- CI that builds the service and runs both TypeScript and Python test layers.

## System under test

The API supports a focused reservation lifecycle:

1. Read the detailing service catalog.
2. Calculate a quote for one or more vehicles.
3. Create a reservation after notice-period and overlap checks.
4. Move the reservation through a controlled state machine.

Important business rules retained from the source domain:

- Opening hours are Monday-Friday, 08:00-20:00.
- Online booking requires at least 48 hours notice.
- Large vehicles and heavy interior dirtiness change the quote independently.
- Extreme interior dirtiness requires individual pricing.
- Pickup below the configured threshold adds a fee.
- Active reservation intervals may not overlap.
- Long jobs continue in the next business window instead of running overnight.

The demo uses an in-memory repository so it is deterministic and needs no
external infrastructure. The production system uses PostgreSQL and object
storage; those integrations are outside this interview excerpt.

## Repository map

```text
src/                 NestJS API and extracted domain logic
test/unit/           Fast white-box business-rule tests
test/e2e/            HTTP tests using Nest and Supertest
qa/tests/            Black-box API automation in Python/pytest
docs/api-contract.yaml  Reviewable OpenAPI contract
docs/                Strategy, traceability, architecture, and bug report
.github/workflows/   Reproducible CI pipeline
```

## Quick start

Prerequisites: Node.js 22+, npm 10+, and optionally Python 3.11+.

```bash
npm install
npm run build
npm test
npm run start:dev
```

The API starts at `http://127.0.0.1:3100/api`. Its static, version-controlled
contract is in `docs/api-contract.yaml`.

Run the independent black-box suite while the API is running:

```bash
cd qa
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
python -m pip install -r requirements.txt
pytest -v
```

The Python suite refuses to run against a remote host unless
`QA_ALLOW_REMOTE=true` is explicitly set. This guard prevents accidental test
data creation in production.

## Suggested 10-minute interview walkthrough

1. Start with `docs/TEST_STRATEGY.md` and explain the risk model.
2. Show `src/reservations/reservation-domain.ts` as the testable production
   boundary.
3. Open `test/unit/reservation-domain.spec.ts` for pricing and calendar edges.
4. Open `test/e2e/api.e2e-spec.ts` for validation, conflicts, and state changes.
5. Show `qa/tests/` to demonstrate technology-independent black-box coverage.
6. Finish with `docs/BUG_REPORT.md` and the regression test that should follow it.

## Deliberate limitations

- Persistence is in memory and resets after restart.
- Authentication, PII encryption, R2 uploads, and PDF generation are excluded to
  keep the sample safe and reviewable.
- Business-clock values are represented in UTC in this demo. A production suite
  must test the `Europe/Prague` timezone and daylight-saving transitions.
- This is not a copy of the full commercial repository. Names and data are
  anonymized, and only the domain needed for the QA discussion is included.
