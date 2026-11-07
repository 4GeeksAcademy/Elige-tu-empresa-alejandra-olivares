import type {
  WasteRecord,
  SaleTransaction,
  PaymentMethod,
  WasteReason,
  MenuItem,
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

  const marginPercentage = ((totalRevenue - totalIngredientCost) / totalRevenue) * 100;
  return Math.round(marginPercentage * 100) / 100;
}