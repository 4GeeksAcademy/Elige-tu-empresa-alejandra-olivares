import type {
  Country,
  Location,
  LocationStatus,
  MenuCategory,
  MenuItem,
  MenuItemStatus,
  PaymentMethod,
  SaleTransaction,
  WasteReason,
  WasteRecord,
} from "../types/models";

const menuCategories: readonly MenuCategory[] = [
  "Meat",
  "Side",
  "Beverage",
  "Dessert",
  "Combo",
];
const menuItemStatuses: readonly MenuItemStatus[] = [
  "Active",
  "Seasonal",
  "Discontinued",
];
const paymentMethods: readonly PaymentMethod[] = [
  "Cash",
  "Credit card",
  "Debit card",
  "Digital wallet",
];
const countries: readonly Country[] = ["Colombia", "USA"];
const locationStatuses: readonly LocationStatus[] = [
  "Active",
  "Temporarily closed",
  "Under renovation",
];
const wasteReasons: readonly WasteReason[] = [
  "Expired",
  "Cooking error",
  "Customer return",
  "Damage",
  "Other",
];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isEnumValue<T extends string>(
  value: unknown,
  values: readonly T[]
): value is T {
  return typeof value === "string" && values.some((entry) => entry === value);
}

export function isCurrency(value: unknown): value is "USD" | "COP" {
  return value === "USD" || value === "COP";
}

export function isSortOrder(value: unknown): value is "asc" | "desc" {
  return value === "asc" || value === "desc";
}

function isPrice(value: unknown): boolean {
  return (
    isRecord(value) &&
    isFiniteNumber(value.USD) &&
    isFiniteNumber(value.COP)
  );
}

export function isMenuItem(value: unknown): value is MenuItem {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isEnumValue(value.category, menuCategories) &&
    isPrice(value.basePrice) &&
    isPrice(value.ingredientCost) &&
    isFiniteNumber(value.prepTimeMinutes) &&
    typeof value.isAvailableInColombia === "boolean" &&
    typeof value.isAvailableInUSA === "boolean" &&
    Array.isArray(value.allergens) &&
    value.allergens.every((allergen: unknown) => isString(allergen)) &&
    isEnumValue(value.status, menuItemStatuses)
  );
}

export function isSaleTransaction(value: unknown): value is SaleTransaction {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.locationId) &&
    isString(value.itemId) &&
    isFiniteNumber(value.quantity) &&
    isPrice(value.totalPrice) &&
    isEnumValue(value.paymentMethod, paymentMethods) &&
    value.timestamp instanceof Date &&
    isString(value.waiterName)
  );
}

export function isLocation(value: unknown): value is Location {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.city) &&
    isEnumValue(value.country, countries) &&
    isFiniteNumber(value.openingYear) &&
    isFiniteNumber(value.seatingCapacity) &&
    isFiniteNumber(value.staffCount) &&
    isPrice(value.monthlyRentCost) &&
    isPrice(value.averageMonthlyUtilities) &&
    isString(value.manager) &&
    isEnumValue(value.status, locationStatuses)
  );
}

export function isWasteRecord(value: unknown): value is WasteRecord {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.locationId) &&
    isString(value.itemId) &&
    isFiniteNumber(value.quantity) &&
    isEnumValue(value.reason, wasteReasons) &&
    isPrice(value.cost) &&
    value.timestamp instanceof Date &&
    isString(value.reportedBy)
  );
}

export function assertArrayOf<T>(
  value: unknown,
  name: string,
  isItem: (item: unknown) => item is T
): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new Error(`${name} debe ser un arreglo.`);
  }

  for (let index = 0; index < value.length; index += 1) {
    const item: unknown = value[index];
    if (!isItem(item)) {
      throw new Error(`${name}[${index}] no es un elemento válido.`);
    }
  }
}

export function assertValue<T>(
  value: unknown,
  name: string,
  isValid: (candidate: unknown) => candidate is T
): asserts value is T {
  if (!isValid(value)) {
    throw new Error(`${name} tiene un valor fuera del contrato esperado.`);
  }
}

export function assertDate(value: unknown, name: string): asserts value is Date {
  if (!(value instanceof Date)) {
    throw new Error(`${name} debe ser una instancia de Date.`);
  }
}

export function assertString(value: unknown, name: string): asserts value is string {
  if (!isString(value)) {
    throw new Error(`${name} debe ser una cadena de texto.`);
  }
}

export function assertFiniteNumber(
  value: unknown,
  name: string
): asserts value is number {
  if (!isFiniteNumber(value)) {
    throw new Error(`${name} debe ser un número finito.`);
  }
}