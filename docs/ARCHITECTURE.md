# Architecture and extraction notes

## Context

The source product consists of a customer booking frontend, an administration
frontend, and a NestJS backend. The complete product also integrates PostgreSQL,
object storage, notifications, calendar feeds, PDF protocols, and encrypted PII.

Copying the complete monorepo would make an interview review slower and could
expose irrelevant implementation details. This case study therefore extracts one
cohesive vertical slice: reservation quote, schedule validation, creation, and
status workflow.

## Boundaries

```text
HTTP request
  -> ValidationPipe / DTO contract
  -> ReservationsController
  -> ReservationsService (orchestration and in-memory repository)
  -> reservation-domain.ts (pure business rules)
```

Pure functions hold calculations and transition rules. This permits exhaustive,
fast tests without booting Nest. HTTP behavior is tested separately through the
real framework pipeline, including serialization and `class-validator`.

## Why an in-memory repository

The database is not the subject of this excerpt. An in-memory repository provides:

- a one-command setup for an interviewer;
- deterministic data isolation;
- real conflict behavior without credentials;
- a clear seam where PostgreSQL contract tests would be added.

In a full environment, repository contract tests should run against disposable
PostgreSQL (for example, Testcontainers) and verify transactions, indexes,
concurrent reservation creation, and migrations.

## Known simplification

Scheduling uses UTC as a business clock. Production should use an explicit IANA
timezone (`Europe/Prague`). DST gaps and repeated hours are listed as a residual
risk in the test strategy rather than hidden by the sample.
