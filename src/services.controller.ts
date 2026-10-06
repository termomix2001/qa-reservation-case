import { Controller, Get } from "@nestjs/common";

import { serviceCatalog } from "./catalog";

@Controller("services")
export class ServicesController {
  @Get()
  list() {
    return { data: serviceCatalog };
  }
}
