import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type {
  CreateReservationDto,
  QuoteRequestDto,
  ReservationStatus,
} from "./dto";
import {
  addBusinessMinutes,
  assertBookableStart,
  assertStatusTransition,
  calculateQuote,
  DomainValidationError,
  intervalsOverlap,
  parseBusinessDate,
  type ReservationQuote,
} from "./reservation-domain";

export type ReservationRecord = {
  createdAt: string;
  customer: CreateReservationDto["customer"];
  finishAt: string;
  id: string;
  quote: ReservationQuote;
  startAt: string;
  status: ReservationStatus;
  vehicles: CreateReservationDto["vehicles"];
};

@Injectable()
export class ReservationsService {
  private readonly reservations = new Map<string, ReservationRecord>();
  private sequence = 1;

  quote(input: QuoteRequestDto) {
    return this.asBadRequest(() => calculateQuote(input));
  }

  list() {
    return [...this.reservations.values()].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }

  findOne(id: string) {
    const reservation = this.reservations.get(id);

    if (!reservation) {
      throw new NotFoundException("Reservation not found.");
    }

    return reservation;
  }

  create(input: CreateReservationDto, now = new Date()) {
    return this.asBadRequest(() => {
      const quote = calculateQuote(input);
      const start = parseBusinessDate(input.startDate, input.startTime);

      assertBookableStart(start, now);

      const finish = addBusinessMinutes(start, quote.durationMinutes);
      const conflict = this.list().find(
        (reservation) =>
          !["cancelled", "no-show"].includes(reservation.status) &&
          intervalsOverlap(
            start,
            finish,
            new Date(reservation.startAt),
            new Date(reservation.finishAt),
          ),
      );

      if (conflict) {
        throw new ConflictException(
          `The selected slot overlaps reservation ${conflict.id}.`,
        );
      }

      const id = `QA-${start.getUTCFullYear()}-${String(this.sequence).padStart(3, "0")}`;
      this.sequence += 1;

      const reservation: ReservationRecord = {
        createdAt: now.toISOString(),
        customer: input.customer,
        finishAt: finish.toISOString(),
        id,
        quote,
        startAt: start.toISOString(),
        status: "new",
        vehicles: input.vehicles,
      };

      this.reservations.set(id, reservation);
      return reservation;
    });
  }

  updateStatus(id: string, status: ReservationStatus) {
    const reservation = this.findOne(id);

    return this.asBadRequest(() => {
      assertStatusTransition(reservation.status, status);
      const updated = { ...reservation, status };

      this.reservations.set(id, updated);
      return updated;
    });
  }

  resetForTests() {
    this.reservations.clear();
    this.sequence = 1;
  }

  private asBadRequest<T>(operation: () => T) {
    try {
      return operation();
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
