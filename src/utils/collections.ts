import type { SaleTransaction, MenuItem, MenuCategory, Location } from "../types/models";
import {
  assertArrayOf,
  assertDate,
  assertString,
  assertValue,
  isCurrency,
  isLocation,
  isMenuItem,
  isSaleTransaction,
  isSortOrder,
} from "./inputGuards";

export function filterSalesByLocation(
  sales: SaleTransaction[],
  locationId: string
): SaleTransaction[] {
  assertArrayOf(sales, "sales", isSaleTransaction);
  assertString(locationId, "locationId");
  return sales.filter((sale) => sale.locationId === locationId);
}

export function filterSalesByDateRange(
  sales: SaleTransaction[],
  startDate: Date,
  endDate: Date
): SaleTransaction[] {
  assertArrayOf(sales, "sales", isSaleTransaction);
  assertDate(startDate, "startDate");
  assertDate(endDate, "endDate");
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  if (Number.isNaN(startTime) || Number.isNaN(endTime) || startTime > endTime) {
    return [];
  }

  return sales.filter((sale) => {
    const saleTime = sale.timestamp.getTime();
    return !Number.isNaN(saleTime) && saleTime >= startTime && saleTime <= endTime;
  });
}

export function filterMenuItemsByCategory(
  items: MenuItem[],
  category: MenuCategory
): MenuItem[] {
  assertArrayOf(items, "items", isMenuItem);
  assertValue(
    category,
    "category",
    (value): value is MenuCategory =>
      value === "Meat" ||
      value === "Side" ||
      value === "Beverage" ||
      value === "Dessert" ||
      value === "Combo"
  );
  return items.filter((item) => item.category === category);
}

export function filterActiveLocations(
  locations: Location[]
): Location[] {
  assertArrayOf(locations, "locations", isLocation);
  return locations.filter((location) => location.status === "Active");
}

export function sortLocationsByCapacity(
  locations: Location[],
  order: "asc" | "desc"
): Location[] {
  assertArrayOf(locations, "locations", isLocation);
  assertValue(order, "order", isSortOrder);
  return [...locations].sort((left, right) =>
    order === "asc"
      ? left.seatingCapacity - right.seatingCapacity
      : right.seatingCapacity - left.seatingCapacity
  );
}

export function sortMenuItemsByPrice(
  items: MenuItem[],
  currency: "USD" | "COP",
  order: "asc" | "desc"
): MenuItem[] {
  assertArrayOf(items, "items", isMenuItem);
  assertValue(currency, "currency", isCurrency);
  assertValue(order, "order", isSortOrder);
  return [...items].sort((left, right) =>
    order === "asc"
      ? left.basePrice[currency] - right.basePrice[currency]
      : right.basePrice[currency] - left.basePrice[currency]
  );
}