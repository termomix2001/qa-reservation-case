import { servicesById, type ServiceDefinition } from "../catalog";
import type {
  DirtinessLevel,
  QuoteRequestDto,
  ReservationStatus,
  VehicleType,
} from "./dto";

export const BUSINESS_OPEN_HOUR = 8;
export const BUSINESS_CLOSE_HOUR = 20;
export const MINIMUM_NOTICE_HOURS = 48;
export const PICKUP_FEE = 499;
export const PICKUP_FREE_THRESHOLD = 1999;
export const VEHICLE_SURCHARGE_RATE = 0.2;
export const HEAVY_DIRTINESS_RATE = 0.2;

export class DomainValidationError extends Error {}

export type VehicleQuote = {
  basePrice: number;
  dirtiness: DirtinessLevel;
  dirtinessSurcharge: number;
  durationMinutes: number;
  requiresIndividualPricing: boolean;
  serviceIds: string[];
  vehicleSurcharge: number;
  vehicleType: VehicleType;
};

export type ReservationQuote = {
  basePrice: number;
  dirtinessSurcharge: number;
  durationMinutes: number;
  estimatedTotal: number;
  pickupFee: number;
  priceStatus: "estimated" | "individual";
  totalPrice: number | null;
  vehicleSurcharge: number;
  vehicles: VehicleQuote[];
};

const allowedTransitions: Record<ReservationStatus, ReservationStatus[]> = {
  new: ["confirmed", "cancelled", "no-show"],
  confirmed: ["received", "cancelled", "no-show"],
  received: ["in-progress", "cancelled"],
  "in-progress": ["ready-for-handover", "cancelled"],
  "ready-for-handover": ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  "no-show": [],
};

export function calculateQuote(input: QuoteRequestDto): ReservationQuote {
  if (input.vehicles.length === 0) {
    throw new DomainValidationError("At least one vehicle is required.");
  }

  const vehicles = input.vehicles.map((vehicle) => {
    const serviceIds = [...new Set(vehicle.serviceIds)];

    if (serviceIds.length !== vehicle.serviceIds.length) {
      throw new DomainValidationError("A service cannot be selected twice for one vehicle.");
    }

    const services = serviceIds.map(resolveService);
    const basePrice = sum(services.map((service) => service.price));
    const interiorBasePrice = sum(
      services
        .filter((service) => service.includesInterior)
        .map((service) => service.price),
    );
    const vehicleSurcharge =
      vehicle.vehicleType === "standard"
        ? 0
        : Math.round(basePrice * VEHICLE_SURCHARGE_RATE);
    const dirtinessSurcharge =
      vehicle.dirtiness === "heavy"
        ? Math.round(interiorBasePrice * HEAVY_DIRTINESS_RATE)
        : 0;
    const requiresIndividualPricing =
      vehicle.dirtiness === "extreme" && interiorBasePrice > 0;

    return {
      basePrice,
      dirtiness: vehicle.dirtiness,
      dirtinessSurcharge,
      durationMinutes: sum(services.map((service) => service.durationMinutes)),
      requiresIndividualPricing,
      serviceIds,
      vehicleSurcharge,
      vehicleType: vehicle.vehicleType,
    } satisfies VehicleQuote;
  });

  const basePrice = sum(vehicles.map((vehicle) => vehicle.basePrice));
  const vehicleSurcharge = sum(
    vehicles.map((vehicle) => vehicle.vehicleSurcharge),
  );
  const dirtinessSurcharge = sum(
    vehicles.map((vehicle) => vehicle.dirtinessSurcharge),
  );
  const subtotal = basePrice + vehicleSurcharge + dirtinessSurcharge;
  const pickupFee =
    input.pickupRequested && subtotal < PICKUP_FREE_THRESHOLD ? PICKUP_FEE : 0;
  const estimatedTotal = subtotal + pickupFee;
  const requiresIndividualPricing = vehicles.some(
    (vehicle) => vehicle.requiresIndividualPricing,
  );

  return {
    basePrice,
    dirtinessSurcharge,
    durationMinutes: sum(vehicles.map((vehicle) => vehicle.durationMinutes)),
    estimatedTotal,
    pickupFee,
    priceStatus: requiresIndividualPricing ? "individual" : "estimated",
    totalPrice: requiresIndividualPricing ? null : estimatedTotal,
    vehicleSurcharge,
    vehicles,
  };
}

export function parseBusinessDate(startDate: string, startTime: string) {
  const parsed = new Date(`${startDate}T${startTime}:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new DomainValidationError("Invalid reservation date or time.");
  }

  return parsed;
}

export function assertBookableStart(start: Date, now: Date) {
  if (!isBusinessDay(start)) {
    throw new DomainValidationError("Reservations are available Monday to Friday.");
  }

  const hour = start.getUTCHours();
  const minute = start.getUTCMinutes();

  if (
    hour < BUSINESS_OPEN_HOUR ||
    hour >= BUSINESS_CLOSE_HOUR ||
    ![0, 30].includes(minute)
  ) {
    throw new DomainValidationError(
      "Reservation must start on a 30-minute slot between 08:00 and 20:00.",
    );
  }

  const earliestStart = new Date(
    now.getTime() + MINIMUM_NOTICE_HOURS * 60 * 60 * 1000,
  );

  if (start < earliestStart) {
    throw new DomainValidationError(
      "Reservation must be created at least 48 hours in advance.",
    );
  }
}

export function addBusinessMinutes(start: Date, durationMinutes: number) {
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new DomainValidationError("Duration must be a positive whole number.");
  }

  let cursor = new Date(start);
  let remaining = durationMinutes;

  while (remaining > 0) {
    cursor = normalizeToBusinessTime(cursor);
    const close = new Date(cursor);
    close.setUTCHours(BUSINESS_CLOSE_HOUR, 0, 0, 0);
    const availableToday = Math.floor((close.getTime() - cursor.getTime()) / 60_000);
    const consumed = Math.min(remaining, availableToday);

    cursor = new Date(cursor.getTime() + consumed * 60_000);
    remaining -= consumed;

    if (remaining > 0) {
      cursor = nextBusinessOpening(cursor);
    }
  }

  return cursor;
}

export function intervalsOverlap(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date,
) {
  return leftStart < rightEnd && rightStart < leftEnd;
}

export function assertStatusTransition(
  current: ReservationStatus,
  next: ReservationStatus,
) {
  if (!allowedTransitions[current].includes(next)) {
    throw new DomainValidationError(
      `Status transition from ${current} to ${next} is not allowed.`,
    );
  }
}

function resolveService(serviceId: string): ServiceDefinition {
  const service = servicesById.get(serviceId);

  if (!service) {
    throw new DomainValidationError(`Unknown service: ${serviceId}.`);
  }

  return service;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function isBusinessDay(date: Date) {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function normalizeToBusinessTime(value: Date) {
  let cursor = new Date(value);

  if (!isBusinessDay(cursor) || cursor.getUTCHours() >= BUSINESS_CLOSE_HOUR) {
    return nextBusinessOpening(cursor);
  }

  if (cursor.getUTCHours() < BUSINESS_OPEN_HOUR) {
    cursor.setUTCHours(BUSINESS_OPEN_HOUR, 0, 0, 0);
  }

  return cursor;
}

function nextBusinessOpening(value: Date) {
  const cursor = new Date(value);

  cursor.setUTCDate(cursor.getUTCDate() + 1);
  cursor.setUTCHours(BUSINESS_OPEN_HOUR, 0, 0, 0);

  while (!isBusinessDay(cursor)) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return cursor;
}
