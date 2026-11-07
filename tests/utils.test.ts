import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  Location,
  MenuItem,
  SaleTransaction,
  WasteRecord,
} from "../src/types/models";
import {
  filterActiveLocations,
  filterMenuItemsByCategory,
  filterSalesByDateRange,
  filterSalesByLocation,
  sortLocationsByCapacity,
  sortMenuItemsByPrice,
} from "../src/utils/collections";
import {
  binarySearchLocationByCapacity,
  findLocationById,
  findMenuItemByName,
} from "../src/utils/search";
import {
  calculateAverageTicket,
  calculateCountryComparison,
  calculateDailyRevenue,
  calculateLocationMargin,
  calculateWasteCost,
  convertCurrency,
  countSalesByPaymentMethod,
  findTopSellingItems,
  groupWasteByReason,
  rankLocationsByPerformance,
  scoreLocationPerformance,
} from "../src/utils/transformations";
import {
  validateLocation,
  validateMenuItem,
  validateSaleTransaction,
} from "../src/utils/validations";

function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: "location-1",
    name: "Centro",
    city: "Bogota",
    country: "Colombia",
    openingYear: 2020,
    seatingCapacity: 20,
    staffCount: 8,
    monthlyRentCost: { USD: 1000, COP: 4_000_000 },
    averageMonthlyUtilities: { USD: 150, COP: 600_000 },
    manager: "Alex",
    status: "Active",
    ...overrides,
  };
}

function makeMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: "item-1",
    name: "Hamburguesa",
    category: "Meat",
    basePrice: { USD: 12, COP: 48_000 },
    ingredientCost: { USD: 4, COP: 16_000 },
    prepTimeMinutes: 15,
    isAvailableInColombia: true,
    isAvailableInUSA: false,
    allergens: [],
    status: "Active",
    ...overrides,
  };
}

function makeSale(overrides: Partial<SaleTransaction> = {}): SaleTransaction {
  return {
    id: "sale-1",
    locationId: "location-1",
    itemId: "item-1",
    quantity: 1,
    totalPrice: { USD: 10, COP: 40_000 },
    paymentMethod: "Cash",
    timestamp: new Date("2024-02-01T12:00:00.000Z"),
    waiterName: "Sam",
    ...overrides,
  };
}

function makeWaste(overrides: Partial<WasteRecord> = {}): WasteRecord {
  return {
    id: "waste-1",
    locationId: "location-1",
    itemId: "item-1",
    quantity: 1,
    reason: "Expired",
    cost: { USD: 5, COP: 20_000 },
    timestamp: new Date("2024-02-01T12:00:00.000Z"),
    reportedBy: "Sam",
    ...overrides,
  };
}

test("los filtros encuentran coincidencias, devuelven vacíos y admiten fechas límite", () => {
  const firstSale = makeSale({
    id: "first",
    locationId: "location-1",
    timestamp: new Date("2024-02-01T00:00:00.000Z"),
  });
  const middleSale = makeSale({
    id: "middle",
    locationId: "location-2",
    timestamp: new Date("2024-02-01T12:00:00.000Z"),
  });
  const lastSale = makeSale({
    id: "last",
    locationId: "location-1",
    timestamp: new Date("2024-02-02T00:00:00.000Z"),
  });
  const outsideSale = makeSale({
    id: "outside",
    timestamp: new Date("2024-02-02T00:00:00.001Z"),
  });
  const sales = [firstSale, middleSale, lastSale, outsideSale];

  assert.deepEqual(
    filterSalesByLocation(sales, "location-1").map((sale) => sale.id),
    ["first", "last", "outside"]
  );
  assert.deepEqual(filterSalesByLocation([], "location-1"), []);
  assert.deepEqual(
    filterSalesByDateRange(
      sales,
      new Date("2024-02-01T00:00:00.000Z"),
      new Date("2024-02-02T00:00:00.000Z")
    ).map((sale) => sale.id),
    ["first", "middle", "last"]
  );
  assert.deepEqual(
    filterSalesByDateRange([], new Date("2024-02-01"), new Date("2024-02-02")),
    []
  );
  assert.deepEqual(
    filterSalesByDateRange(
      sales,
      new Date("invalid"),
      new Date("2024-02-02T00:00:00.000Z")
    ),
    []
  );

  const burger = makeMenuItem({ id: "burger", category: "Meat" });
  const cake = makeMenuItem({ id: "cake", category: "Dessert" });
  assert.deepEqual(filterMenuItemsByCategory([burger, cake], "Dessert"), [cake]);
  assert.deepEqual(filterMenuItemsByCategory([], "Dessert"), []);

  const active = makeLocation({ id: "active", status: "Active" });
  const closed = makeLocation({ id: "closed", status: "Temporarily closed" });
  assert.deepEqual(filterActiveLocations([active, closed]), [active]);
  assert.deepEqual(filterActiveLocations([]), []);
});

test("los ordenamientos ascendente y descendente no alteran los arreglos originales", () => {
  const large = makeLocation({ id: "large", seatingCapacity: 40 });
  const small = makeLocation({ id: "small", seatingCapacity: 10 });
  const medium = makeLocation({ id: "medium", seatingCapacity: 25 });
  const locations = [large, small, medium];
  const originalLocations = [...locations];

  assert.deepEqual(
    sortLocationsByCapacity(locations, "asc").map((item) => item.id),
    ["small", "medium", "large"]
  );
  assert.deepEqual(
    sortLocationsByCapacity(locations, "desc").map((item) => item.id),
    ["large", "medium", "small"]
  );
  assert.deepEqual(locations, originalLocations);

  const expensive = makeMenuItem({
    id: "expensive",
    basePrice: { USD: 20, COP: 80_000 },
  });
  const cheap = makeMenuItem({ id: "cheap", basePrice: { USD: 5, COP: 20_000 } });
  const menuItems = [expensive, cheap];
  const originalItems = [...menuItems];

  assert.deepEqual(
    sortMenuItemsByPrice(menuItems, "USD", "asc").map((item) => item.id),
    ["cheap", "expensive"]
  );
  assert.deepEqual(
    sortMenuItemsByPrice(menuItems, "USD", "desc").map((item) => item.id),
    ["expensive", "cheap"]
  );
  assert.deepEqual(menuItems, originalItems);
});

test("las búsquedas encuentran coincidencias y manejan ausentes y mayúsculas", () => {
  const first = makeLocation({ id: "first", seatingCapacity: 10 });
  const second = makeLocation({ id: "second", seatingCapacity: 20 });
  const third = makeLocation({ id: "third", seatingCapacity: 30 });
  const locations = [first, second, third];
  assert.equal(findLocationById(locations, "second"), second);
  assert.equal(findLocationById(locations, "missing"), null);
  assert.equal(findLocationById([], "missing"), null);

  const item = makeMenuItem({ name: "Pollo Brasaland" });
  assert.equal(findMenuItemByName([item], "pOlLo bRaSaLaNd"), item);
  assert.equal(findMenuItemByName([item], "no existe"), null);

  assert.equal(binarySearchLocationByCapacity(locations, 20), 1);
  assert.equal(binarySearchLocationByCapacity(locations, 25), -1);
});

test("las validaciones rechazan estructuras nulas, incompletas y campos mal tipados", () => {
  const invalidMenuItems: unknown[] = [
    null,
    undefined,
    {},
    { ...makeMenuItem(), name: null },
    { ...makeMenuItem(), basePrice: undefined },
    { ...makeMenuItem(), basePrice: null },
    { ...makeMenuItem(), ingredientCost: null },
  ];
  for (const item of invalidMenuItems) {
    const result = validateMenuItem(item);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  }

  const validSale = makeSale();
  const invalidSales: unknown[] = [
    null,
    undefined,
    {},
    { ...validSale, waiterName: null },
    { ...validSale, totalPrice: undefined },
    { ...validSale, totalPrice: null },
  ];
  for (const sale of invalidSales) {
    const result = validateSaleTransaction(sale);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  }

  const validLocation = makeLocation();
  const invalidLocations: unknown[] = [
    null,
    undefined,
    {},
    { ...validLocation, monthlyRentCost: undefined },
    { ...validLocation, monthlyRentCost: null },
    { ...validLocation, averageMonthlyUtilities: null },
  ];
  for (const location of invalidLocations) {
    const result = validateLocation(location, 2025);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  }
});

test("las utilidades de colecciones rechazan arrays inválidos y elementos nulos descriptivamente", () => {
  assert.throws(
    // @ts-expect-error Deliberately invalid runtime input for guard coverage.
    () => filterSalesByLocation(null, "location-1"),
    /sales debe ser un arreglo/
  );
  assert.throws(
    // @ts-expect-error This array intentionally violates the MenuItem contract.
    () => sortMenuItemsByPrice([null], "USD", "asc"),
    /items\[0\] no es un elemento válido/
  );
  assert.throws(
    // @ts-expect-error This array intentionally violates the Location contract.
    () => findLocationById([null], "missing"),
    /locations\[0\] no es un elemento válido/
  );
  assert.throws(
    // @ts-expect-error This array intentionally violates the SaleTransaction contract.
    () => calculateAverageTicket([null], "USD"),
    /sales\[0\] no es un elemento válido/
  );
  assert.deepEqual(filterSalesByLocation([], "location-1"), []);
  assert.equal(findMenuItemByName([], "missing"), null);
});

test("convierte monedas en ambos sentidos y conserva valores de la misma moneda", () => {
  assert.equal(convertCurrency(2, "USD", "COP"), 8000);
  assert.equal(convertCurrency(5000, "COP", "USD"), 1.25);
  assert.equal(convertCurrency(17.25, "USD", "USD"), 17.25);
  assert.equal(convertCurrency(17_250, "COP", "COP"), 17_250);
});

test("calcula ingresos diarios por fecha UTC, costo de desperdicios y ticket promedio", () => {
  const utcSameDay = makeSale({
    id: "utc-same-day",
    totalPrice: { USD: 7, COP: 28_000 },
    timestamp: new Date("2024-01-31T23:30:00.000-02:00"),
  });
  const utcEndOfDay = makeSale({
    id: "utc-end-of-day",
    totalPrice: { USD: 3, COP: 12_000 },
    timestamp: new Date("2024-02-01T23:59:59.999Z"),
  });
  const nextUtcDay = makeSale({
    id: "next-day",
    totalPrice: { USD: 100, COP: 400_000 },
    timestamp: new Date("2024-02-02T00:00:00.000Z"),
  });
  const dailySales = [utcSameDay, utcEndOfDay, nextUtcDay];

  assert.equal(
    calculateDailyRevenue(dailySales, new Date("2024-02-01T12:00:00.000Z"), "USD"),
    10
  );
  assert.equal(calculateDailyRevenue(dailySales, new Date("invalid"), "USD"), 0);

  const wasteRecords = [
    makeWaste({ id: "w1", cost: { USD: 12.2, COP: 48_800 } }),
    makeWaste({ id: "w2", locationId: "location-2", cost: { USD: 100, COP: 400_000 } }),
    makeWaste({ id: "w3", cost: { USD: 3.3, COP: 13_200 } }),
  ];
  assert.equal(calculateWasteCost(wasteRecords, "location-1", "USD"), 15.5);
  assert.equal(calculateWasteCost(wasteRecords, "location-1", "COP"), 62_000);
  assert.equal(calculateWasteCost([], "location-1", "USD"), 0);

  const ticketSales = [
    makeSale({ totalPrice: { USD: 20, COP: 80_000 } }),
    makeSale({ totalPrice: { USD: 30, COP: 120_000 } }),
  ];
  assert.equal(calculateAverageTicket(ticketSales, "USD"), 25);
  assert.equal(calculateAverageTicket(ticketSales, "COP"), 100_000);
  assert.equal(calculateAverageTicket([], "USD"), 0);
});

test("calcula margen por cantidad, pérdidas y casos sin ventas o con producto inexistente", () => {
  const ingredients = makeMenuItem({
    ingredientCost: { USD: 10, COP: 40_000 },
  });
  const profitableSale = makeSale({
    quantity: 3,
    totalPrice: { USD: 100, COP: 400_000 },
  });
  assert.equal(
    calculateLocationMargin([profitableSale], [ingredients], "location-1", "USD"),
    70
  );

  const lossSale = makeSale({
    quantity: 2,
    totalPrice: { USD: 10, COP: 40_000 },
  });
  assert.equal(
    calculateLocationMargin([lossSale], [ingredients], "location-1", "USD"),
    0
  );

  const breakEvenSale = makeSale({
    quantity: 2,
    totalPrice: { USD: 20, COP: 80_000 },
  });
  assert.equal(
    calculateLocationMargin([breakEvenSale], [ingredients], "location-1", "USD"),
    0
  );

  assert.equal(calculateLocationMargin([], [ingredients], "location-1", "USD"), 0);
  assert.throws(
    () => calculateLocationMargin([profitableSale], [], "location-1", "USD"),
    /Menu item.*was not found/
  );
});

test("cuenta pagos, agrupa desperdicios y suma cantidades para productos más vendidos", () => {
  const sales = [
    makeSale({ id: "cash", paymentMethod: "Cash", itemId: "burger", quantity: 2 }),
    makeSale({ id: "credit", paymentMethod: "Credit card", itemId: "fries", quantity: 4 }),
    makeSale({ id: "debit", paymentMethod: "Debit card", itemId: "burger", quantity: 3 }),
    makeSale({ id: "wallet", paymentMethod: "Digital wallet", itemId: "burger", quantity: 1 }),
  ];
  assert.deepEqual(countSalesByPaymentMethod(sales), {
    Cash: 1,
    "Credit card": 1,
    "Debit card": 1,
    "Digital wallet": 1,
  });
  assert.deepEqual(countSalesByPaymentMethod([]), {
    Cash: 0,
    "Credit card": 0,
    "Debit card": 0,
    "Digital wallet": 0,
  });

  const expired = makeWaste({ id: "expired", reason: "Expired" });
  const damage = makeWaste({ id: "damage", reason: "Damage" });
  const grouped = groupWasteByReason([expired, damage]);
  assert.deepEqual(grouped.Expired, [expired]);
  assert.deepEqual(grouped.Damage, [damage]);
  assert.deepEqual(grouped.Other, []);
  assert.deepEqual(groupWasteByReason([]).Expired, []);

  const burger = makeMenuItem({ id: "burger", name: "Burger" });
  const fries = makeMenuItem({ id: "fries", name: "Fries", category: "Side" });
  const originalSales = [...sales];
  const rankedItems = findTopSellingItems(sales, [burger, fries], 2);
  assert.deepEqual(rankedItems, [
    { item: burger, totalSold: 6 },
    { item: fries, totalSold: 4 },
  ]);
  assert.deepEqual(sales, originalSales);
  assert.deepEqual(findTopSellingItems([], [burger, fries], 2), []);
  assert.deepEqual(findTopSellingItems(sales, [burger, fries], 0), []);
  assert.throws(
    () => findTopSellingItems([makeSale({ itemId: "missing" })], [burger], 1),
    /Menu item.*was not found/
  );
});

test("compara ingresos de Colombia y USA en ambas monedas", () => {
  const colombianMain = makeLocation({ id: "co-main", country: "Colombia" });
  const colombianClosed = makeLocation({
    id: "co-closed",
    country: "Colombia",
    status: "Temporarily closed",
  });
  const usLocation = makeLocation({ id: "us-main", country: "USA" });
  const comparison = calculateCountryComparison(
    [
      makeSale({ locationId: "co-main", totalPrice: { USD: 10, COP: 40_000 } }),
      makeSale({ locationId: "co-main", totalPrice: { USD: 20, COP: 80_000 } }),
      makeSale({ locationId: "us-main", totalPrice: { USD: 7, COP: 28_000 } }),
    ],
    [colombianMain, colombianClosed, usLocation],
    []
  );

  assert.deepEqual(comparison, {
    Colombia: {
      totalLocations: 2,
      totalRevenue: { USD: 30, COP: 120_000 },
      averageRevenuePerLocation: { USD: 15, COP: 60_000 },
      totalSales: 2,
    },
    USA: {
      totalLocations: 1,
      totalRevenue: { USD: 7, COP: 28_000 },
      averageRevenuePerLocation: { USD: 7, COP: 28_000 },
      totalSales: 1,
    },
  });
});

test("valida menú válido, límites, campos vacíos, NaN e Infinity", () => {
  assert.deepEqual(
    validateMenuItem(makeMenuItem({ prepTimeMinutes: 60 })),
    { valid: true, errors: [] }
  );

  const invalid = validateMenuItem(
    makeMenuItem({
      name: "   ",
      basePrice: { USD: Number.NaN, COP: Number.POSITIVE_INFINITY },
      ingredientCost: { USD: 0, COP: Number.NEGATIVE_INFINITY },
      prepTimeMinutes: Number.NaN,
      isAvailableInColombia: false,
      isAvailableInUSA: false,
    })
  );
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length, 7);
  assert.ok(invalid.errors.some((error) => error.includes("nombre")));
  assert.ok(invalid.errors.some((error) => error.includes("USD")));
  assert.ok(invalid.errors.some((error) => error.includes("COP")));
});

test("valida transacciones válidas y acumula errores de cantidad, precios y nombre", () => {
  assert.deepEqual(validateSaleTransaction(makeSale()), { valid: true, errors: [] });

  const invalid = validateSaleTransaction(
    makeSale({
      quantity: Number.POSITIVE_INFINITY,
      totalPrice: { USD: Number.NaN, COP: Number.NEGATIVE_INFINITY },
      waiterName: "  ",
    })
  );
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length, 4);
  assert.ok(invalid.errors.some((error) => error.includes("cantidad")));
  assert.ok(invalid.errors.some((error) => error.includes("USD")));
  assert.ok(invalid.errors.some((error) => error.includes("COP")));
  assert.ok(invalid.errors.some((error) => error.includes("mesero")));
});

test("valida locaciones en los años límite y reúne errores numéricos", () => {
  assert.deepEqual(
    validateLocation(makeLocation({ openingYear: 2008 }), 2008),
    { valid: true, errors: [] }
  );
  assert.deepEqual(
    validateLocation(makeLocation({ openingYear: 2025 }), 2025),
    { valid: true, errors: [] }
  );
  assert.equal(
    validateLocation(makeLocation({ openingYear: 2026 }), 2025).valid,
    false
  );

  const stableLocation = makeLocation({ openingYear: 2020 });
  assert.deepEqual(
    validateLocation(stableLocation, 2025),
    validateLocation(stableLocation, 2025)
  );

  for (const currentYear of [2007, 2025.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    const invalidYear = validateLocation(stableLocation, currentYear);
    assert.equal(invalidYear.valid, false);
    assert.ok(invalidYear.errors.some((error) => error.includes("año de referencia")));
  }

  const invalid = validateLocation(
    makeLocation({
      openingYear: Number.POSITIVE_INFINITY,
      seatingCapacity: Number.NaN,
      staffCount: Number.POSITIVE_INFINITY,
      monthlyRentCost: { USD: Number.NaN, COP: Number.POSITIVE_INFINITY },
      averageMonthlyUtilities: { USD: 0, COP: Number.NEGATIVE_INFINITY },
    }),
    2025
  );
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length, 7);
});

test("calcula manualmente el puntaje con fecha fija y filtra datos por sucursal", () => {
  const location = makeLocation({
    id: "scored",
    openingYear: 2024,
    seatingCapacity: 10,
  });
  const menuItem = makeMenuItem({
    id: "scoring-item",
    ingredientCost: { USD: 100, COP: 400_000 },
  });
  const sales = [
    makeSale({
      id: "score-sale-1",
      locationId: "scored",
      itemId: "scoring-item",
      quantity: 1,
      totalPrice: { USD: 500, COP: 2_000_000 },
    }),
    makeSale({
      id: "score-sale-2",
      locationId: "scored",
      itemId: "scoring-item",
      quantity: 1,
      totalPrice: { USD: 500, COP: 2_000_000 },
    }),
    makeSale({
      id: "other-location-sale",
      locationId: "other",
      totalPrice: { USD: 100_000, COP: 400_000_000 },
    }),
  ];
  const wasteRecords = [
    makeWaste({
      id: "score-waste",
      locationId: "scored",
      cost: { USD: 50, COP: 200_000 },
    }),
    makeWaste({
      id: "other-location-waste",
      locationId: "other",
      cost: { USD: 100_000, COP: 400_000_000 },
    }),
  ];
  const referenceDate = new Date("2024-01-11T00:00:00.000Z");

  // Revenue: 100 / 1000 * 40 = 4; efficiency: 2 / 10 * 30 = 6;
  // waste: 5% gives 10; margin: 80% / 10 gives 8. Total: 28.
  const score = scoreLocationPerformance(
    location,
    sales,
    wasteRecords,
    [menuItem],
    referenceDate
  );
  assert.equal(score, 28);
  assert.equal(
    scoreLocationPerformance(
      location,
      sales,
      wasteRecords,
      [menuItem],
      new Date(referenceDate.getTime())
    ),
    score
  );
});

test("limita el puntaje, maneja ingresos cero y rechaza fechas inválidas o anteriores", () => {
  const location = makeLocation({
    id: "edge",
    openingYear: 2024,
    seatingCapacity: 1,
  });
  const freeIngredients = makeMenuItem({
    id: "free-ingredients",
    ingredientCost: { USD: 0, COP: 0 },
  });
  const highSales = [
    makeSale({
      locationId: "edge",
      itemId: "free-ingredients",
      totalPrice: { USD: 10_000, COP: 40_000_000 },
    }),
    makeSale({
      id: "high-sale-2",
      locationId: "edge",
      itemId: "free-ingredients",
      totalPrice: { USD: 10_000, COP: 40_000_000 },
    }),
  ];
  assert.equal(
    scoreLocationPerformance(
      location,
      highSales,
      [],
      [freeIngredients],
      new Date("2024-01-02T00:00:00.000Z")
    ),
    100
  );

  const zeroRevenueSale = makeSale({
    locationId: "edge",
    totalPrice: { USD: 0, COP: 0 },
  });
  assert.equal(
    scoreLocationPerformance(
      location,
      [zeroRevenueSale],
      [makeWaste({ locationId: "edge", cost: { USD: 10, COP: 40_000 } })],
      [makeMenuItem()],
      new Date("2024-01-02T00:00:00.000Z")
    ),
    30
  );
  assert.equal(
    scoreLocationPerformance(
      location,
      [],
      [],
      [],
      new Date("2024-01-02T00:00:00.000Z")
    ),
    0
  );
  assert.throws(
    () => scoreLocationPerformance(location, [], [], [], new Date("invalid")),
    /fecha de referencia no es válida/
  );
  assert.throws(
    () =>
      scoreLocationPerformance(
        location,
        [],
        [],
        [],
        new Date("2023-12-31T23:59:59.999Z")
      ),
    /anterior a la apertura estimada/
  );
});

test("ordena el ranking con la misma fecha fija y conserva el arreglo original", () => {
  const low = makeLocation({ id: "low", openingYear: 2024, seatingCapacity: 10 });
  const high = makeLocation({ id: "high", openingYear: 2024, seatingCapacity: 10 });
  const locations = [low, high];
  const originalLocations = [...locations];
  const item = makeMenuItem({
    id: "rank-item",
    ingredientCost: { USD: 100, COP: 400_000 },
  });
  const wasteRecords = [
    makeWaste({ locationId: "high", cost: { USD: 50, COP: 200_000 } }),
  ];
  const referenceDate = new Date("2024-01-11T00:00:00.000Z");
  const sales = [
    makeSale({
      id: "rank-sale-1",
      locationId: "high",
      itemId: "rank-item",
      totalPrice: { USD: 500, COP: 2_000_000 },
    }),
    makeSale({
      id: "rank-sale-2",
      locationId: "high",
      itemId: "rank-item",
      totalPrice: { USD: 500, COP: 2_000_000 },
    }),
  ];
  const ranking = rankLocationsByPerformance(
    locations,
    sales,
    wasteRecords,
    [item],
    referenceDate
  );

  assert.deepEqual(
    ranking.map(({ location: rankedLocation, score }) => ({
      id: rankedLocation.id,
      score,
    })),
    [
      { id: "high", score: 28 },
      { id: "low", score: 0 },
    ]
  );
  assert.deepEqual(
    rankLocationsByPerformance(
      locations,
      sales,
      wasteRecords,
      [item],
      new Date(referenceDate.getTime())
    ),
    ranking
  );
  assert.deepEqual(locations, originalLocations);
  assert.deepEqual(
    rankLocationsByPerformance(
      [],
      [],
      [],
      [],
      new Date("2024-01-11T00:00:00.000Z")
    ),
    []
  );
});