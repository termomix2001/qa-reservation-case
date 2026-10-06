import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../../src/app.module";
import { ReservationsService } from "../../src/reservations/reservations.service";

describe("reservation API (e2e)", () => {
  let app: INestApplication;
  let reservationsService: ReservationsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
    reservationsService = app.get(ReservationsService);
  });

  beforeEach(() => reservationsService.resetForTests());
  afterAll(async () => app.close());

  it("exposes a machine-readable health response", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/health")
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        service: "reservation-qa-showcase",
        time: expect.any(String),
      }),
    );
    expect(Number.isNaN(Date.parse(response.body.time))).toBe(false);
  });

  it("returns a transparent quote breakdown", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/reservations/quote")
      .send({
        pickupRequested: true,
        vehicles: [
          {
            dirtiness: "heavy",
            serviceIds: ["interior-comfort"],
            vehicleType: "suv",
          },
        ],
      })
      .expect(200);

    expect(response.body.data).toMatchObject({
      basePrice: 2499,
      dirtinessSurcharge: 500,
      pickupFee: 0,
      totalPrice: 3499,
      vehicleSurcharge: 500,
    });
  });

  it("rejects an unknown service at the API boundary", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/reservations/quote")
      .send({
        vehicles: [
          {
            dirtiness: "normal",
            serviceIds: ["service-that-does-not-exist"],
            vehicleType: "standard",
          },
        ],
      })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining("serviceIds")]),
    );
  });

  it("rejects malformed customer data", async () => {
    const payload = validReservationPayload();
    payload.customer.email = "not-an-email";

    await request(app.getHttpServer())
      .post("/api/reservations")
      .send(payload)
      .expect(400);
  });

  it("creates a reservation and exposes it through GET", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/reservations")
      .send(validReservationPayload())
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/api/reservations/${created.body.data.id}`)
      .expect(200);

    expect(response.body.data).toMatchObject({
      customer: { email: "alex@example.test" },
      id: created.body.data.id,
      status: "new",
    });
  });

  it("returns 409 when two active reservations overlap", async () => {
    const payload = validReservationPayload();

    await request(app.getHttpServer())
      .post("/api/reservations")
      .send(payload)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post("/api/reservations")
      .send({
        ...payload,
        customer: { ...payload.customer, email: "second@example.test" },
        startTime: "11:00",
      })
      .expect(409);

    expect(response.body.message).toContain("overlaps reservation");
  });

  it("enforces the workflow state machine", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/reservations")
      .send(validReservationPayload())
      .expect(201);
    const id = created.body.data.id as string;

    await request(app.getHttpServer())
      .patch(`/api/reservations/${id}/status`)
      .send({ status: "confirmed" })
      .expect(200);

    const invalidTransition = await request(app.getHttpServer())
      .patch(`/api/reservations/${id}/status`)
      .send({ status: "delivered" })
      .expect(400);

    expect(invalidTransition.body.message).toContain("not allowed");
  });
});

function validReservationPayload() {
  return {
    customer: {
      email: "alex@example.test",
      name: "Alex Tester",
      phone: "+420700000000",
    },
    pickupRequested: false,
    startDate: nextWeekdayDate(7),
    startTime: "10:00",
    vehicles: [
      {
        dirtiness: "normal",
        serviceIds: ["interior-comfort"],
        vehicleType: "standard",
      },
    ],
  };
}

function nextWeekdayDate(daysAhead: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);

  while ([0, 6].includes(date.getUTCDay())) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return date.toISOString().slice(0, 10);
}
