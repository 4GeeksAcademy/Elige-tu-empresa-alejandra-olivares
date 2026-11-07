import "../styles/demo.css";
import "./panel.css";
import type { MenuCategory } from "./types/models";
import {
  demoDateRange,
  demoReferenceDate,
  sampleLocations,
  sampleMenuItems,
  sampleSales,
  sampleWasteRecords,
} from "./data/sampleData";
import {
  filterMenuItemsByCategory,
  filterSalesByDateRange,
  filterSalesByLocation,
  sortLocationsByCapacity,
  sortMenuItemsByPrice,
} from "./utils/collections";
import {
  binarySearchLocationByCapacity,
  findLocationById,
  findMenuItemByName,
} from "./utils/search";
import {
  calculateAverageTicket,
  calculateCountryComparison,
  calculateDailyRevenue,
  findTopSellingItems,
  rankLocationsByPerformance,
} from "./utils/transformations";

const usdFormat = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const copFormat = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const dateFormat = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`No se encontró el elemento requerido: ${id}`);
  }
  return found as T;
}

const locationFilter = element<HTMLSelectElement>("sales-location");
const dateFromInput = element<HTMLInputElement>("date-from");
const dateToInput = element<HTMLInputElement>("date-to");
const referenceDateInput = element<HTMLInputElement>("reference-date");
const salesBody = element<HTMLTableSectionElement>("sales-body");
const menuBody = element<HTMLTableSectionElement>("menu-body");
const locationsBody = element<HTMLTableSectionElement>("locations-body");
const topItemsBody = element<HTMLTableSectionElement>("top-items-body");
const countryBody = element<HTMLTableSectionElement>("country-body");
const rankingBody = element<HTMLTableSectionElement>("ranking-body");

function setNotice(id: string, message: string, isError = false): void {
  const notice = element<HTMLElement>(id);
  notice.textContent = message;
  notice.className = isError
    ? "mt-3 min-h-5 text-sm font-semibold text-[#a4382e]"
    : "mt-3 min-h-5 text-sm text-[#5b716a]";
}

function setResult(id: string, message: string, isError = false): void {
  const result = element<HTMLElement>(id);
  result.textContent = message;
  result.className = isError
    ? "min-h-5 text-sm font-semibold text-[#a4382e]"
    : "min-h-5 text-sm text-[#5b716a]";
}

function addTableRows(
  tbody: HTMLTableSectionElement,
  rows: string[][],
  emptyMessage: string
): void {
  tbody.replaceChildren();
  if (rows.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = tbody.closest("table")?.querySelectorAll("thead th").length ?? 1;
    cell.className = "px-4 py-6 text-center text-sm text-[#63766f]";
    cell.textContent = emptyMessage;
    row.append(cell);
    tbody.append(row);
    return;
  }

  for (const values of rows) {
    const row = document.createElement("tr");
    for (const value of values) {
      const cell = document.createElement("td");
      cell.className = "px-4 py-3 text-[#29483f]";
      cell.textContent = value;
      row.append(cell);
    }
    tbody.append(row);
  }
}

function parseUtcDate(value: string, endOfDay = false): Date {
  if (value.length === 0) {
    throw new Error("Completa todas las fechas para actualizar los reportes.");
  }
  const date = new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
  );
  if (Number.isNaN(date.getTime())) {
    throw new Error("Una de las fechas seleccionadas no es válida.");
  }
  return date;
}

function selectedSales(): ReturnType<typeof filterSalesByDateRange> {
  const start = parseUtcDate(dateFromInput.value);
  const end = parseUtcDate(dateToInput.value, true);
  if (start.getTime() > end.getTime()) {
    throw new Error("La fecha inicial debe ser anterior o igual a la fecha final.");
  }

  const salesInRange = filterSalesByDateRange(sampleSales, start, end);
  return locationFilter.value.length === 0
    ? salesInRange
    : filterSalesByLocation(salesInRange, locationFilter.value);
}

function renderSales(sales: ReturnType<typeof selectedSales>): void {
  const rows = sales.map((sale) => {
    const location = sampleLocations.find((item) => item.id === sale.locationId);
    const menuItem = sampleMenuItems.find((item) => item.id === sale.itemId);
    return [
      dateFormat.format(sale.timestamp),
      location?.name ?? "Sucursal desconocida",
      menuItem?.name ?? "Producto desconocido",
      String(sale.quantity),
      usdFormat.format(sale.totalPrice.USD),
    ];
  });
  addTableRows(salesBody, rows, "No hay ventas para esos filtros.");
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    Meat: "Plato principal",
    Side: "Acompañamiento",
    Beverage: "Bebida",
    Dessert: "Postre",
    Combo: "Combo",
  };
  return labels[category] ?? category;
}

function renderMenu(): void {
  const categoryValue = element<HTMLSelectElement>("menu-category").value;
  const currency = element<HTMLSelectElement>("menu-currency").value as "USD" | "COP";
  const order = element<HTMLSelectElement>("menu-order").value as "asc" | "desc";
  const categoryItems =
    categoryValue === "all"
      ? sampleMenuItems
      : filterMenuItemsByCategory(sampleMenuItems, categoryValue as MenuCategory);
  const sortedItems = sortMenuItemsByPrice(categoryItems, currency, order);

  addTableRows(
    menuBody,
    sortedItems.map((item) => [
      item.name,
      categoryLabel(item.category),
      usdFormat.format(item.basePrice.USD),
      copFormat.format(item.basePrice.COP),
      item.status === "Active"
        ? "Activo"
        : item.status === "Seasonal"
          ? "De temporada"
          : "Descontinuado",
    ]),
    "No hay productos en esta categoría."
  );
}

function renderLocations(): void {
  const order = element<HTMLSelectElement>("location-order").value as "asc" | "desc";
  const sortedLocations = sortLocationsByCapacity(sampleLocations, order);
  addTableRows(
    locationsBody,
    sortedLocations.map((location) => [
      location.name,
      location.city,
      location.country === "USA" ? "Estados Unidos" : location.country,
      String(location.seatingCapacity),
      location.status === "Active"
        ? "Activa"
        : location.status === "Temporarily closed"
          ? "Cierre temporal"
          : "En remodelación",
    ]),
    "No hay sucursales para mostrar."
  );
}

function renderReports(sales: ReturnType<typeof selectedSales>): void {
  const referenceDate = parseUtcDate(referenceDateInput.value);
  element<HTMLElement>("daily-revenue").textContent = usdFormat.format(
    calculateDailyRevenue(sales, referenceDate, "USD")
  );
  element<HTMLElement>("average-ticket").textContent = usdFormat.format(
    calculateAverageTicket(sales, "USD")
  );
  element<HTMLElement>("sales-count").textContent = String(sales.length);

  const topItems = findTopSellingItems(sales, sampleMenuItems, 5);
  addTableRows(
    topItemsBody,
    topItems.map(({ item, totalSold }) => [
      item.name,
      categoryLabel(item.category),
      String(totalSold),
    ]),
    "No hay productos vendidos con estos filtros."
  );

  const comparison = calculateCountryComparison(
    sampleSales,
    sampleLocations,
    sampleMenuItems
  );
  addTableRows(
    countryBody,
    (["Colombia", "USA"] as const).map((country) => [
      country === "USA" ? "Estados Unidos" : country,
      usdFormat.format(comparison[country].totalRevenue.USD),
      copFormat.format(comparison[country].totalRevenue.COP),
      String(comparison[country].totalSales),
    ]),
    "No hay datos para comparar países."
  );

  const ranking = rankLocationsByPerformance(
    sampleLocations,
    sampleSales,
    sampleWasteRecords,
    sampleMenuItems,
    referenceDate
  );
  addTableRows(
    rankingBody,
    ranking.map(({ location, score }, index) => [
      String(index + 1),
      location.name,
      location.country === "USA" ? "Estados Unidos" : location.country,
      score.toFixed(2),
    ]),
    "No hay sucursales para ordenar."
  );
}

function updatePanel(): void {
  try {
    const sales = selectedSales();
    renderSales(sales);
    renderReports(sales);
    setNotice(
      "sales-notice",
      `${sales.length} transacciones encontradas. El reporte diario usa la fecha de referencia.`
    );
    setNotice(
      "reports-notice",
      "Comparación y ranking calculados con todos los datos de muestra."
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ocurrió un error inesperado.";
    renderSales([]);
    addTableRows(topItemsBody, [], message);
    addTableRows(countryBody, [], message);
    addTableRows(rankingBody, [], message);
    element<HTMLElement>("daily-revenue").textContent = "—";
    element<HTMLElement>("average-ticket").textContent = "—";
    element<HTMLElement>("sales-count").textContent = "—";
    setNotice("sales-notice", message, true);
    setNotice("reports-notice", message, true);
  }
}

for (const location of sampleLocations) {
  const option = document.createElement("option");
  option.value = location.id;
  option.textContent = `${location.name} · ${location.city}`;
  locationFilter.append(option);
}

dateFromInput.value = demoDateRange.from;
dateToInput.value = demoDateRange.to;
referenceDateInput.value = demoReferenceDate.toISOString().slice(0, 10);

element<HTMLFormElement>("sales-filters").addEventListener("submit", (event) => {
  event.preventDefault();
  updatePanel();
});
locationFilter.addEventListener("change", updatePanel);
dateFromInput.addEventListener("change", updatePanel);
dateToInput.addEventListener("change", updatePanel);
referenceDateInput.addEventListener("change", updatePanel);
element<HTMLSelectElement>("menu-category").addEventListener("change", renderMenu);
element<HTMLSelectElement>("menu-currency").addEventListener("change", renderMenu);
element<HTMLSelectElement>("menu-order").addEventListener("change", renderMenu);
element<HTMLSelectElement>("location-order").addEventListener("change", renderLocations);

element<HTMLFormElement>("search-location-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const id = element<HTMLInputElement>("search-location-id").value.trim();
  const found = id.length > 0 ? findLocationById(sampleLocations, id) : null;
  setResult(
    "location-search-result",
    found
      ? `${found.name} · ${found.city}, ${found.country}`
      : "No se encontró una sucursal con ese ID."
  );
});

element<HTMLFormElement>("search-menu-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = element<HTMLInputElement>("search-menu-name").value.trim();
  const found = name.length > 0 ? findMenuItemByName(sampleMenuItems, name) : null;
  setResult(
    "menu-search-result",
    found
      ? `${found.name} · ${categoryLabel(found.category)} · ${usdFormat.format(found.basePrice.USD)}`
      : "No se encontró un producto con ese nombre."
  );
});

element<HTMLFormElement>("search-capacity-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const target = Number(element<HTMLInputElement>("search-capacity").value);
  if (!Number.isFinite(target) || target <= 0) {
    setResult("capacity-search-result", "Ingresa una capacidad mayor que cero.", true);
    return;
  }
  const sortedLocations = sortLocationsByCapacity(sampleLocations, "asc");
  const index = binarySearchLocationByCapacity(sortedLocations, target);
  const found = index >= 0 ? sortedLocations[index] : null;
  setResult(
    "capacity-search-result",
    found
      ? `${found.name} · ${found.seatingCapacity} puestos (posición ${index + 1} tras ordenar ascendente)`
      : "No se encontró una sucursal con esa capacidad exacta."
  );
});

renderMenu();
renderLocations();
updatePanel();