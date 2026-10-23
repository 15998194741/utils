/**
 * Default ascending comparator used by {@link binarySearch} and {@link sortedIndex}.
 *
 * Compares two values with the `<` and `>` operators.
 *
 * @param left - Left operand.
 * @param right - Right operand.
 * @returns A negative number when `left` comes first, a positive number when `right` comes first, `0` when both are equal.
 */
const defaultComparator = (left: any, right: any): number => (left < right ? -1 : left > right ? 1 : 0)

/**
 * Searches a sorted array for a target with the binary search algorithm.
 *
 * The array must already be sorted ascending by the comparator. The input array
 * is never modified.
 *
 * @param values - Array sorted ascending by `comparator`.
 * @param target - Value to look for.
 * @param comparator - Optional comparison function; returns a negative number when `left` comes first, a positive number when `right` comes first, `0` when both are equal. Defaults to the `<` / `>` operators.
 * @returns The index of the target when it is found, otherwise `-(insertionPoint + 1)` where `insertionPoint` is the index the target should be inserted at. An empty array yields `-1`.
 *
 * @example
 * ```ts
 * binarySearch([1, 3, 5, 7], 5);  // 2
 * binarySearch([1, 3, 5, 7], 4);  // -3 — insert at index 2
 * binarySearch([], 1);            // -1
 * ```
 */
export function binarySearch<T>(values: readonly T[], target: T, comparator?: (left: T, right: T) => number): number {
  const compare = comparator ?? defaultComparator
  let low = 0
  let high = values.length - 1
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2)
    const result = compare(values[mid], target)
    if (result === 0) return mid
    if (result < 0) low = mid + 1
    else high = mid - 1
  }
  return -(low + 1)
}

/**
 * Returns the position at which a target belongs in a sorted array.
 *
 * The array must already be sorted ascending by the comparator. The input array
 * is never modified.
 *
 * @param values - Array sorted ascending by `comparator`.
 * @param target - Value to locate.
 * @param comparator - Optional comparison function; returns a negative number when `left` comes first, a positive number when `right` comes first, `0` when both are equal. Defaults to the `<` / `>` operators.
 * @returns The index of the target when an equal element exists, otherwise the index the target should be inserted at to keep the array sorted. An empty array yields `0`.
 *
 * @example
 * ```ts
 * sortedIndex([1, 3, 5, 7], 5); // 2 — an equal element exists
 * sortedIndex([1, 3, 5, 7], 4); // 2 — insert before 5
 * sortedIndex([], 1);           // 0
 * ```
 */
export function sortedIndex<T>(values: readonly T[], target: T, comparator?: (left: T, right: T) => number): number {
  const compare = comparator ?? defaultComparator
  let low = 0
  let high = values.length
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2)
    if (compare(values[mid], target) < 0) low = mid + 1
    else high = mid
  }
  return low
}
