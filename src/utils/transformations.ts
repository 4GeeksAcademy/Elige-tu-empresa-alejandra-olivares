import type {
  WasteRecord,
  SaleTransaction,
  PaymentMethod,
  WasteReason,
  MenuItem,
  Location,
  Country,
  CountryMetrics,
} from "../types/models";

export function convertCurrency(
  amount: number,
  fromCurrency: "USD" | "COP",
  toCurrency: "USD" | "COP"
): number {
  const exchangeRate = 4000;

  if (fromCurrency === toCurrency) {
    return amount;
  }

  const convertedAmount =
    fromCurrency === "USD" ? amount * exchangeRate : amount / exchangeRate;

  return Math.round(convertedAmount * 100) / 100;
}

export function calculateWasteCost(
  wasteRecords: WasteRecord[],
  locationId: string,
  currency: "USD" | "COP"
): number {
  const totalCost = wasteRecords
    .filter((record) => record.locationId === locationId)
    .reduce((total, record) => total + record.cost[currency], 0);

  return Math.round(totalCost * 100) / 100;
}

export function calculateAverageTicket(
  sales: SaleTransaction[],
  currency: "USD" | "COP"
): number {
  if (sales.length === 0) {
    return 0;
  }

  const total = sales.reduce(
    (sum, sale) => sum + sale.totalPrice[currency],
    0
  );

  return Math.round((total / sales.length) * 100) / 100;
}

export function countSalesByPaymentMethod(
  sales: SaleTransaction[]
): Record<PaymentMethod, number> {
  return sales.reduce<Record<PaymentMethod, number>>(
    (counts, sale) => {
      counts[sale.paymentMethod] += 1;
      return counts;
    },
    {
      Cash: 0,
      "Credit card": 0,
      "Debit card": 0,
      "Digital wallet": 0,
    }
  );
}

export function groupWasteByReason(
  wasteRecords: WasteRecord[]
): Record<WasteReason, WasteRecord[]> {
  return wasteRecords.reduce<Record<WasteReason, WasteRecord[]>>(
    (groups, record) => {
      groups[record.reason].push(record);
      return groups;
    },
    {
      Expired: [],
      "Cooking error": [],
      "Customer return": [],
      Damage: [],
      Other: [],
    }
  );
}

// Agrupa las ventas por día UTC para evitar diferencias entre zonas horarias.
export function calculateDailyRevenue(
  sales: SaleTransaction[],
  date: Date,
  currency: "USD" | "COP"
): number {
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const dailyTotal = sales
    .filter((sale) => {
      if (Number.isNaN(sale.timestamp.getTime())) {
        return false;
      }

      return (
        sale.timestamp.getUTCFullYear() === year &&
        sale.timestamp.getUTCMonth() === month &&
        sale.timestamp.getUTCDate() === day
      );
    })
    .reduce((total, sale) => total + sale.totalPrice[currency], 0);

  return Math.round(dailyTotal * 100) / 100;
}

export function calculateLocationMargin(
  sales: SaleTransaction[],
  menuItems: MenuItem[],
  locationId: string,
  currency: "USD" | "COP"
): number {
  const locationSales = sales.filter((sale) => sale.locationId === locationId);

  if (locationSales.length === 0) {
    return 0;
  }

  let totalRevenue = 0;
  let totalIngredientCost = 0;

  for (const sale of locationSales) {
    const item = menuItems.find((menuItem) => sale.itemId === menuItem.id);

    if (!item) {
      throw new Error(
        `Menu item "${sale.itemId}" for sale "${sale.id}" was not found.`
      );
    }

    totalRevenue += sale.totalPrice[currency];
    totalIngredientCost += item.ingredientCost[currency] * sale.quantity;
  }

  if (totalRevenue === 0) {
    return 0;
  }

  const marginPercentage = Math.min(
    Math.max(((totalRevenue - totalIngredientCost) / totalRevenue) * 100, 0),
    100
  );
  return Math.round(marginPercentage * 100) / 100;
}

export function findTopSellingItems(
  sales: SaleTransaction[],
  menuItems: MenuItem[],
  topN: number
): Array<{ item: MenuItem; totalSold: number }> {
  if (sales.length === 0 || !Number.isInteger(topN) || topN <= 0) {
    return [];
  }

  const menuItemsById = new Map(
    menuItems.map((item) => [item.id, item] as const)
  );
  const quantitiesByItemId = new Map<string, number>();

  for (const sale of sales) {
    if (!menuItemsById.has(sale.itemId)) {
      throw new Error(
        `Menu item "${sale.itemId}" for sale "${sale.id}" was not found.`
      );
    }

    quantitiesByItemId.set(
      sale.itemId,
      (quantitiesByItemId.get(sale.itemId) ?? 0) + sale.quantity
    );
  }

  return Array.from(quantitiesByItemId, ([itemId, totalSold]) => ({
    item: menuItemsById.get(itemId)!,
    totalSold,
  }))
    .sort((first, second) => second.totalSold - first.totalSold)
    .slice(0, topN);
}

export function calculateCountryComparison(
  sales: SaleTransaction[],
  locations: Location[],
  menuItems: MenuItem[]
): { Colombia: CountryMetrics; USA: CountryMetrics } {
  // Keep menuItems in the signature for briefing compatibility; these metrics only use sales and locations.
  void menuItems;

  const locationsById = new Map(
    locations.map((location) => [location.id, location] as const)
  );
  const totalLocations: Record<Country, number> = {
    Colombia: 0,
    USA: 0,
  };
  const totals: Record<Country, { revenueUSD: number; revenueCOP: number; totalSales: number }> = {
    Colombia: { revenueUSD: 0, revenueCOP: 0, totalSales: 0 },
    USA: { revenueUSD: 0, revenueCOP: 0, totalSales: 0 },
  };

  for (const location of locations) {
    totalLocations[location.country] += 1;
  }

  for (const sale of sales) {
    const location = locationsById.get(sale.locationId);

    if (!location) {
      throw new Error(
        `Location "${sale.locationId}" for sale "${sale.id}" was not found.`
      );
    }

    totals[location.country].revenueUSD += sale.totalPrice.USD;
    totals[location.country].revenueCOP += sale.totalPrice.COP;
    totals[location.country].totalSales += 1;
  }

  const roundToTwoDecimals = (value: number): number =>
    Math.round(value * 100) / 100;

  const makeMetrics = (country: Country): CountryMetrics => {
    const locationCount = totalLocations[country];
    const countryTotals = totals[country];

    return {
      totalLocations: locationCount,
      totalRevenue: {
        USD: roundToTwoDecimals(countryTotals.revenueUSD),
        COP: roundToTwoDecimals(countryTotals.revenueCOP),
      },
      averageRevenuePerLocation: {
        USD:
          locationCount === 0
            ? 0
            : roundToTwoDecimals(countryTotals.revenueUSD / locationCount),
        COP:
          locationCount === 0
            ? 0
            : roundToTwoDecimals(countryTotals.revenueCOP / locationCount),
      },
      totalSales: countryTotals.totalSales,
    };
  };

  return {
    Colombia: makeMetrics("Colombia"),
    USA: makeMetrics("USA"),
  };
}

/**
 * Estima la apertura el 1 de enero UTC. Sin ingresos, los puntajes de ingresos, desperdicio y margen son 0.
 * referenceDate es obligatorio para mantener resultados reproducibles.
 */
export function scoreLocationPerformance(
  location: Location,
  sales: SaleTransaction[],
  wasteRecords: WasteRecord[],
  menuItems: MenuItem[],
  referenceDate: Date
): number {
  if (Number.isNaN(referenceDate.getTime())) {
    throw new Error("La fecha de referencia no es válida.");
  }

  const openingDate = new Date(Date.UTC(location.openingYear, 0, 1));

  if (referenceDate.getTime() < openingDate.getTime()) {
    throw new Error(
      `La fecha de referencia es anterior a la apertura estimada de la locación (${location.openingYear}-01-01 UTC).`
    );
  }

  const locationSales = sales.filter(
    (sale) => sale.locationId === location.id
  );
  const locationWasteRecords = wasteRecords.filter(
    (record) => record.locationId === location.id
  );
  const totalRevenue = locationSales.reduce(
    (total, sale) => total + sale.totalPrice.USD,
    0
  );
  const totalWasteCost = locationWasteRecords.reduce(
    (total, record) => total + record.cost.USD,
    0
  );
  const fullOperationalDays = Math.floor(
    (referenceDate.getTime() - openingDate.getTime()) / 86_400_000
  );
  const operationalDays = Math.max(fullOperationalDays, 1);

  const revenueScore =
    totalRevenue === 0
      ? 0
      : Math.min(((totalRevenue / operationalDays) / 1000) * 40, 40);
  const efficiencyScore =
    location.seatingCapacity <= 0
      ? 0
      : Math.min((locationSales.length / location.seatingCapacity) * 30, 30);
  const wasteScore =
    totalRevenue === 0
      ? 0
      : Math.max(20 - (totalWasteCost / totalRevenue) * 100 * 2, 0);
  const marginScore =
    totalRevenue === 0
      ? 0
      : Math.min(
          Math.max(
            calculateLocationMargin(
              locationSales,
              menuItems,
              location.id,
              "USD"
            ) / 10,
            0
          ),
          10
        );

  const totalScore = revenueScore + efficiencyScore + wasteScore + marginScore;
  return Math.round(Math.min(Math.max(totalScore, 0), 100) * 100) / 100;
}

/** referenceDate es obligatorio para comparar sucursales de forma reproducible. */
export function rankLocationsByPerformance(
  locations: Location[],
  sales: SaleTransaction[],
  wasteRecords: WasteRecord[],
  menuItems: MenuItem[],
  referenceDate: Date
): Array<{ location: Location; score: number }> {
  if (locations.length === 0) {
    return [];
  }

  return locations
    .map((location) => ({
      location,
      score: scoreLocationPerformance(
        location,
        sales,
        wasteRecords,
        menuItems,
        referenceDate
      ),
    }))
    .sort((first, second) => second.score - first.score);
}