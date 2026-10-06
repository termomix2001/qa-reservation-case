import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";

import { serviceCatalog } from "../catalog";

export const vehicleTypes = ["standard", "suv", "seven-seater", "van"] as const;
export type VehicleType = (typeof vehicleTypes)[number];

export const dirtinessLevels = ["normal", "heavy", "extreme"] as const;
export type DirtinessLevel = (typeof dirtinessLevels)[number];

export const reservationStatuses = [
  "new",
  "confirmed",
  "received",
  "in-progress",
  "ready-for-handover",
  "delivered",
  "cancelled",
  "no-show",
] as const;
export type ReservationStatus = (typeof reservationStatuses)[number];

const serviceIds = serviceCatalog.map((service) => service.id);

export class QuoteVehicleDto {
  @IsIn(vehicleTypes)
  vehicleType!: VehicleType;

  @IsIn(dirtinessLevels)
  dirtiness!: DirtinessLevel;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(serviceIds, { each: true })
  serviceIds!: string[];
}

export class QuoteRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteVehicleDto)
  vehicles!: QuoteVehicleDto[];

  @IsOptional()
  @IsBoolean()
  pickupRequested?: boolean;
}

export class CustomerDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;
}

export class CreateReservationDto extends QuoteRequestDto {
  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @Matches(/^([01]\d|2[0-3]):(?:00|30)$/)
  startTime!: string;
}

export class UpdateStatusDto {
  @IsIn(reservationStatuses)
  status!: ReservationStatus;
}
