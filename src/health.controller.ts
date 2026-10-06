import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  health() {
    return {
      ok: true,
      service: "reservation-qa-showcase",
      time: new Date().toISOString(),
    };
  }
}
