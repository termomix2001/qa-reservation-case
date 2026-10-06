import { Body, Controller, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";

import {
  CreateReservationDto,
  QuoteRequestDto,
  UpdateStatusDto,
} from "./dto";
import { ReservationsService } from "./reservations.service";

@Controller("reservations")
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post("quote")
  @HttpCode(200)
  quote(@Body() input: QuoteRequestDto) {
    return { data: this.reservationsService.quote(input) };
  }

  @Get()
  list() {
    return { data: this.reservationsService.list() };
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return { data: this.reservationsService.findOne(id) };
  }

  @Post()
  create(@Body() input: CreateReservationDto) {
    return { data: this.reservationsService.create(input) };
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() input: UpdateStatusDto) {
    return { data: this.reservationsService.updateStatus(id, input.status) };
  }
}
