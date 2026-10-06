# Mapping to the source product

This portfolio does not copy the commercial monorepo. It preserves the behavior
of one vertical slice and rewrites infrastructure boundaries for safe review.

| Source responsibility | Portfolio location | Treatment |
|---|---|---|
| Reservation DTO validation | `src/reservations/dto.ts` | Reduced to quote, customer, schedule, and status fields |
| Price and duration calculation | `src/reservations/reservation-domain.ts` | Extracted into pure functions for deterministic tests |
| Reservation orchestration | `src/reservations/reservations.service.ts` | PostgreSQL repository replaced with an in-memory map |
| Reservation HTTP endpoints | `src/reservations/reservations.controller.ts` | Reduced to list, get, quote, create, and status update |
| Shared service catalog | `src/catalog.ts` | Anonymized and shortened to five representative services |
| Production API tests | `test/` and `qa/tests/` | New portfolio-focused white-box and black-box coverage |

Excluded on purpose:

- authentication tokens and role setup;
- customer records and encrypted PII values;
- database schema and migrations;
- Cloudflare R2 credentials and stored object keys;
- production URLs, notification webhooks, and calendar feed tokens;
- branded assets and generated protocols.

This separation is part of the QA story: select the smallest system boundary that
still demonstrates meaningful risk, then make it reproducible and safe to share.
