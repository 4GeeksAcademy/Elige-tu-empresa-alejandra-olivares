import type { SaleTransaction, MenuItem, MenuCategory, Location } from "../types/models";

export function filterSalesByLocation(
  sales: SaleTransaction[],
  locationId: string
): SaleTransaction[] {
  return sales.filter((sale) => sale.locationId === locationId);
}

export function filterSalesByDateRange(
  sales: SaleTransaction[],
  startDate: Date,
  endDate: Date
): SaleTransaction[] {
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
  return items.filter((item) => item.category === category);
}

export function filterActiveLocations(
  locations: Location[]
): Location[] {
  return locations.filter((location) => location.status === "Active");
}

export function sortLocationsByCapacity(
  locations: Location[],
  order: "asc" | "desc"
): Location[] {
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
  return [...items].sort((left, right) =>
    order === "asc"
      ? left.basePrice[currency] - right.basePrice[currency]
      : right.basePrice[currency] - left.basePrice[currency]
  );
}