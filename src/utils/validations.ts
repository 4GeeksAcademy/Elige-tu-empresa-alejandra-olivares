import type { Location, MenuItem, SaleTransaction } from "../types/models";

export function validateMenuItem(
  item: MenuItem
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (item.name.trim().length === 0) {
    errors.push("El nombre no debe estar vacío ni contener solo espacios.");
  }

  if (!Number.isFinite(item.basePrice.USD) || item.basePrice.USD <= 0) {
    errors.push("El precio base en USD debe ser un número finito mayor que 0.");
  }

  if (!Number.isFinite(item.basePrice.COP) || item.basePrice.COP <= 0) {
    errors.push("El precio base en COP debe ser un número finito mayor que 0.");
  }

  if (
    !Number.isFinite(item.ingredientCost.USD) ||
    item.ingredientCost.USD <= 0
  ) {
    errors.push(
      "El costo de ingredientes en USD debe ser un número finito mayor que 0."
    );
  }

  if (
    !Number.isFinite(item.ingredientCost.COP) ||
    item.ingredientCost.COP <= 0
  ) {
    errors.push(
      "El costo de ingredientes en COP debe ser un número finito mayor que 0."
    );
  }

  if (
    !Number.isFinite(item.prepTimeMinutes) ||
    item.prepTimeMinutes <= 0 ||
    item.prepTimeMinutes > 60
  ) {
    errors.push(
      "El tiempo de preparación debe ser un número finito mayor que 0 y menor o igual que 60 minutos."
    );
  }

  if (!item.isAvailableInColombia && !item.isAvailableInUSA) {
    errors.push("El producto debe estar disponible en Colombia, en USA o en ambos.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSaleTransaction(
  sale: SaleTransaction
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Number.isFinite(sale.quantity) || sale.quantity <= 0) {
    errors.push("La cantidad debe ser un número finito mayor que 0.");
  }

  if (!Number.isFinite(sale.totalPrice.USD) || sale.totalPrice.USD <= 0) {
    errors.push("El precio total en USD debe ser un número finito mayor que 0.");
  }

  if (!Number.isFinite(sale.totalPrice.COP) || sale.totalPrice.COP <= 0) {
    errors.push("El precio total en COP debe ser un número finito mayor que 0.");
  }

  if (sale.waiterName.trim().length === 0) {
    errors.push("El nombre del mesero no debe estar vacío ni contener solo espacios.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/** Uses the current UTC year when currentYear is omitted. */
export function validateLocation(
  location: Location,
  currentYear: number = new Date().getUTCFullYear()
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (
    !Number.isFinite(location.openingYear) ||
    location.openingYear < 2008 ||
    location.openingYear > currentYear
  ) {
    errors.push(
      `El año de apertura debe ser un número finito entre 2008 y ${currentYear}, inclusive.`
    );
  }

  if (!Number.isFinite(location.seatingCapacity) || location.seatingCapacity <= 0) {
    errors.push("La capacidad de asientos debe ser un número finito mayor que 0.");
  }

  if (!Number.isFinite(location.staffCount) || location.staffCount <= 0) {
    errors.push("La cantidad de empleados debe ser un número finito mayor que 0.");
  }

  if (
    !Number.isFinite(location.monthlyRentCost.USD) ||
    location.monthlyRentCost.USD <= 0
  ) {
    errors.push("El alquiler mensual en USD debe ser un número finito mayor que 0.");
  }

  if (
    !Number.isFinite(location.monthlyRentCost.COP) ||
    location.monthlyRentCost.COP <= 0
  ) {
    errors.push("El alquiler mensual en COP debe ser un número finito mayor que 0.");
  }

  if (
    !Number.isFinite(location.averageMonthlyUtilities.USD) ||
    location.averageMonthlyUtilities.USD <= 0
  ) {
    errors.push(
      "Los servicios públicos mensuales en USD deben ser un número finito mayor que 0."
    );
  }

  if (
    !Number.isFinite(location.averageMonthlyUtilities.COP) ||
    location.averageMonthlyUtilities.COP <= 0
  ) {
    errors.push(
      "Los servicios públicos mensuales en COP deben ser un número finito mayor que 0."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}