import { isFiniteNumber, isRecord } from "./inputGuards";

const menuCategories = ["Meat", "Side", "Beverage", "Dessert", "Combo"];
const menuItemStatuses = ["Active", "Seasonal", "Discontinued"];
const paymentMethods = ["Cash", "Credit card", "Debit card", "Digital wallet"];
const countries = ["Colombia", "USA"];
const locationStatuses = ["Active", "Temporarily closed", "Under renovation"];

function isOneOf(value: unknown, choices: readonly string[]): boolean {
  return typeof value === "string" && choices.some((choice) => choice === value);
}

function addStringError(
  value: unknown,
  label: string,
  errors: string[],
  mustBeNonBlank = false
): void {
  if (typeof value !== "string") {
    errors.push(`${label} debe ser texto.`);
  } else if (mustBeNonBlank && value.trim().length === 0) {
    errors.push(`${label} no debe estar vacío ni contener solo espacios.`);
  }
}

function addPositivePriceErrors(
  value: unknown,
  label: string,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${label} debe ser un objeto con valores USD y COP.`);
    return;
  }

  for (const currency of ["USD", "COP"] as const) {
    const amount = value[currency];
    if (!isFiniteNumber(amount) || amount <= 0) {
      errors.push(`${label} en ${currency} debe ser un número finito mayor que 0.`);
    }
  }
}

export function validateMenuItem(
  item: unknown
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isRecord(item)) {
    return { valid: false, errors: ["El producto debe ser un objeto válido."] };
  }

  addStringError(item.id, "El identificador del producto", errors);
  addStringError(item.name, "El nombre", errors, true);

  if (!isOneOf(item.category, menuCategories)) {
    errors.push("La categoría del producto no es válida.");
  }

  addPositivePriceErrors(item.basePrice, "El precio base", errors);
  addPositivePriceErrors(item.ingredientCost, "El costo de ingredientes", errors);

  if (
    !isFiniteNumber(item.prepTimeMinutes) ||
    item.prepTimeMinutes <= 0 ||
    item.prepTimeMinutes > 60
  ) {
    errors.push(
      "El tiempo de preparación debe ser un número finito mayor que 0 y menor o igual que 60 minutos."
    );
  }

  if (typeof item.isAvailableInColombia !== "boolean") {
    errors.push("La disponibilidad en Colombia debe ser un valor booleano.");
  }
  if (typeof item.isAvailableInUSA !== "boolean") {
    errors.push("La disponibilidad en USA debe ser un valor booleano.");
  }

  if (
    typeof item.isAvailableInColombia === "boolean" &&
    typeof item.isAvailableInUSA === "boolean" &&
    !item.isAvailableInColombia &&
    !item.isAvailableInUSA
  ) {
    errors.push("El producto debe estar disponible en Colombia, en USA o en ambos.");
  }

  if (
    !Array.isArray(item.allergens) ||
    item.allergens.some((allergen: unknown) => typeof allergen !== "string")
  ) {
    errors.push("Los alérgenos deben ser un arreglo de textos.");
  }
  if (!isOneOf(item.status, menuItemStatuses)) {
    errors.push("El estado del producto no es válido.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSaleTransaction(
  sale: unknown
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isRecord(sale)) {
    return { valid: false, errors: ["La transacción debe ser un objeto válido."] };
  }

  addStringError(sale.id, "El identificador de la transacción", errors);
  addStringError(sale.locationId, "El identificador de la sucursal", errors);
  addStringError(sale.itemId, "El identificador del producto vendido", errors);

  if (!isFiniteNumber(sale.quantity) || sale.quantity <= 0) {
    errors.push("La cantidad debe ser un número finito mayor que 0.");
  }

  addPositivePriceErrors(sale.totalPrice, "El precio total", errors);

  if (!isOneOf(sale.paymentMethod, paymentMethods)) {
    errors.push("El método de pago no es válido.");
  }

  if (!(sale.timestamp instanceof Date) || Number.isNaN(sale.timestamp.getTime())) {
    errors.push("La fecha de la transacción debe ser una fecha válida.");
  }

  addStringError(sale.waiterName, "El nombre del mesero", errors, true);

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateLocation(
  location: unknown,
  currentYear: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isRecord(location)) {
    return { valid: false, errors: ["La locación debe ser un objeto válido."] };
  }

  addStringError(location.id, "El identificador de la locación", errors);
  addStringError(location.name, "El nombre de la locación", errors);
  addStringError(location.city, "La ciudad", errors);
  addStringError(location.manager, "El nombre del responsable", errors);

  if (!isOneOf(location.country, countries)) {
    errors.push("El país de la locación no es válido.");
  }

  const isValidCurrentYear = Number.isInteger(currentYear) && currentYear >= 2008;

  if (!isValidCurrentYear) {
    errors.push("El año de referencia debe ser un entero válido mayor o igual que 2008.");
  }

  if (
    !isFiniteNumber(location.openingYear) ||
    location.openingYear < 2008 ||
    (isValidCurrentYear && location.openingYear > currentYear)
  ) {
    const upperBound = isValidCurrentYear ? String(currentYear) : "un año de referencia válido";
    errors.push(
      `El año de apertura debe ser un número finito entre 2008 y ${upperBound}, inclusive.`
    );
  }

  if (!isFiniteNumber(location.seatingCapacity) || location.seatingCapacity <= 0) {
    errors.push("La capacidad de asientos debe ser un número finito mayor que 0.");
  }

  if (!isFiniteNumber(location.staffCount) || location.staffCount <= 0) {
    errors.push("La cantidad de empleados debe ser un número finito mayor que 0.");
  }

  addPositivePriceErrors(location.monthlyRentCost, "El alquiler mensual", errors);
  addPositivePriceErrors(
    location.averageMonthlyUtilities,
    "Los servicios públicos mensuales",
    errors
  );

  if (!isOneOf(location.status, locationStatuses)) {
    errors.push("El estado de la locación no es válido.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}