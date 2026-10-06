export type ServiceDefinition = {
  category: "interior" | "exterior" | "package";
  durationMinutes: number;
  id: string;
  includesInterior: boolean;
  name: string;
  price: number;
};

export const serviceCatalog: ServiceDefinition[] = [
  {
    category: "interior",
    durationMinutes: 120,
    id: "interior-standard",
    includesInterior: true,
    name: "Standard interior cleaning",
    price: 999,
  },
  {
    category: "interior",
    durationMinutes: 240,
    id: "interior-comfort",
    includesInterior: true,
    name: "Comfort wet cleaning",
    price: 2499,
  },
  {
    category: "exterior",
    durationMinutes: 90,
    id: "exterior-basic",
    includesInterior: false,
    name: "Basic exterior wash",
    price: 999,
  },
  {
    category: "exterior",
    durationMinutes: 180,
    id: "exterior-advanced",
    includesInterior: false,
    name: "Advanced exterior wash",
    price: 1999,
  },
  {
    category: "package",
    durationMinutes: 720,
    id: "package-full",
    includesInterior: true,
    name: "Complete interior and exterior package",
    price: 6499,
  },
];

export const servicesById = new Map(
  serviceCatalog.map((service) => [service.id, service]),
);
