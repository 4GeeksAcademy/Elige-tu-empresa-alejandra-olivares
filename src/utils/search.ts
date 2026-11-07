import type { Location, MenuItem } from "../types/models";
import {
  assertArrayOf,
  assertFiniteNumber,
  assertString,
  isLocation,
  isMenuItem,
} from "./inputGuards";

export function findLocationById(
  locations: Location[],
  id: string
): Location | null {
  assertArrayOf(locations, "locations", isLocation);
  assertString(id, "id");
  for (const location of locations) {
    if (location.id === id) {
      return location;
    }
  }

  return null;
}

export function findMenuItemByName(
  items: MenuItem[],
  name: string
): MenuItem | null {
  assertArrayOf(items, "items", isMenuItem);
  assertString(name, "name");
  const normalizedName = name.toLowerCase();

  for (const item of items) {
    if (item.name.toLowerCase() === normalizedName) {
      return item;
    }
  }

  return null;
}

export function binarySearchLocationByCapacity(
  sortedLocations: Location[],
  targetCapacity: number
): number {
  assertArrayOf(sortedLocations, "sortedLocations", isLocation);
  assertFiniteNumber(targetCapacity, "targetCapacity");
  let left = 0;
  let right = sortedLocations.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const middleCapacity = sortedLocations[middle].seatingCapacity;

    if (middleCapacity === targetCapacity) {
      return middle;
    }

    if (targetCapacity > middleCapacity) {
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  return -1;
}