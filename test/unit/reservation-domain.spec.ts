import {
  addBusinessMinutes,
  assertBookableStart,
  assertStatusTransition,
  calculateQuote,
  DomainValidationError,
  intervalsOverlap,
} from "../../src/reservations/reservation-domain";

describe("reservation domain", () => {
  describe("calculateQuote", () => {
    it("returns the base price for a standard vehicle", () => {
      const quote = calculateQuote({
        vehicles: [
          {
            dirtiness: "normal",
            serviceIds: ["interior-comfort"],
            vehicleType: "standard",
          },
        ],
      });

      expect(quote).toMatchObject({
        basePrice: 2499,
        dirtinessSurcharge: 0,
        durationMinutes: 240,
        pickupFee: 0,
        priceStatus: "estimated",
        totalPrice: 2499,
        vehicleSurcharge: 0,
      });
    });

    it("applies vehicle and heavy-dirtiness surcharges independently", () => {
      const quote = calculateQuote({
        vehicles: [
          {
            dirtiness: "heavy",
            serviceIds: ["interior-comfort"],
            vehicleType: "suv",
          },
        ],
      });

      expect(quote.vehicleSurcharge).toBe(500);
      expect(quote.dirtinessSurcharge).toBe(500);
      expect(quote.totalPrice).toBe(3499);
    });

    it("does not apply an interior dirtiness surcharge to exterior-only work", () => {
      const quote = calculateQuote({
        vehicles: [
          {
            dirtiness: "heavy",
            serviceIds: ["exterior-basic"],
            vehicleType: "standard",
          },
        ],
      });

      expect(quote.dirtinessSurcharge).toBe(0);
      expect(quote.totalPrice).toBe(999);
    });

    it("marks extreme interior dirtiness for individual pricing", () => {
      const quote = calculateQuote({
        vehicles: [
          {
            dirtiness: "extreme",
            serviceIds: ["interior-standard"],
            vehicleType: "standard",
          },
        ],
      });

      expect(quote.priceStatus).toBe("individual");
      expect(quote.estimatedTotal).toBe(999);
      expect(quote.totalPrice).toBeNull();
    });

    it("charges pickup below the free-pickup threshold", () => {
      const quote = calculateQuote({
        pickupRequested: true,
        vehicles: [
          {
            dirtiness: "normal",
            serviceIds: ["exterior-basic"],
            vehicleType: "standard",
          },
        ],
      });

      expect(quote.pickupFee).toBe(499);
      expect(quote.totalPrice).toBe(1498);
    });

    it("rejects duplicate services before they can be billed twice", () => {
      expect(() =>
        calculateQuote({
          vehicles: [
            {
              dirtiness: "normal",
              serviceIds: ["exterior-basic", "exterior-basic"],
              vehicleType: "standard",
            },
          ],
        }),
      ).toThrow(DomainValidationError);
    });
  });

  describe("scheduling", () => {
    it("continues long work on the next business day", () => {
      const friday = new Date("2030-06-14T18:00:00.000Z");

      expect(addBusinessMinutes(friday, 240).toISOString()).toBe(
        "2030-06-17T10:00:00.000Z",
      );
    });

    it("rejects a reservation with less than 48 hours notice", () => {
      expect(() =>
        assertBookableStart(
          new Date("2030-06-17T10:00:00.000Z"),
          new Date("2030-06-15T11:00:00.000Z"),
        ),
      ).toThrow("at least 48 hours");
    });

    it("treats adjacent intervals as non-overlapping", () => {
      expect(
        intervalsOverlap(
          new Date("2030-06-17T08:00:00.000Z"),
          new Date("2030-06-17T10:00:00.000Z"),
          new Date("2030-06-17T10:00:00.000Z"),
          new Date("2030-06-17T12:00:00.000Z"),
        ),
      ).toBe(false);
    });
  });

  describe("workflow", () => {
    it.each([
      ["new", "confirmed"],
      ["confirmed", "received"],
      ["received", "in-progress"],
      ["in-progress", "ready-for-handover"],
      ["ready-for-handover", "delivered"],
    ] as const)("allows %s -> %s", (current, next) => {
      expect(() => assertStatusTransition(current, next)).not.toThrow();
    });

    it("rejects skipping directly from new to delivered", () => {
      expect(() => assertStatusTransition("new", "delivered")).toThrow(
        "not allowed",
      );
    });
  });
});
