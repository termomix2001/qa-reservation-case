import { Module } from "@nestjs/common";

import { HealthController } from "./health.controller";
import { ReservationsController } from "./reservations/reservations.controller";
import { ReservationsService } from "./reservations/reservations.service";
import { ServicesController } from "./services.controller";

@Module({
  controllers: [HealthController, ServicesController, ReservationsController],
  providers: [ReservationsService],
})
export class AppModule {}
