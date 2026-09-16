/** Negative: left precedes right; zero: equal; positive: left follows right. */
export type Comparator<T> = (left: T, right: T) => number

type SortArguments<T> = [T] extends [number] ? [compare?: Comparator<T>] : [compare: Comparator<T>]

function getComparator<T>(compare?: Comparator<T>): Comparator<T> {
  return compare ?? ((left, right) => (left as unknown as number) - (right as unknown as number))
}

/** Stable bubble sort. Returns a new array. */
export function bubbleSort<T>(values: readonly T[], ...args: SortArguments<T>): T[] {
  const result = values.slice()
  const compare = getComparator(args[0])
  for (let end = result.length - 1; end > 0; end--) {
    let changed = false
    for (let i = 0; i < end; i++) {
      if (compare(result[i], result[i + 1]) > 0) {
        [result[i], result[i + 1]] = [result[i + 1], result[i]]
        changed = true
      }
    }
    if (!changed) break
  }
  return result
}

/** Selection sort. Returns a new array. */
export function selectionSort<T>(values: readonly T[], ...args: SortArguments<T>): T[] {
  const result = values.slice()
  const compare = getComparator(args[0])
  for (let i = 0; i < result.length - 1; i++) {
    let smallest = i
    for (let j = i + 1; j < result.length; j++) {
      if (compare(result[j], result[smallest]) < 0) smallest = j
    }
    if (smallest !== i) [result[i], result[smallest]] = [result[smallest], result[i]]
  }
  return result
}

/** Stable insertion sort. Returns a new array. */
export function insertionSort<T>(values: readonly T[], ...args: SortArguments<T>): T[] {
  const result = values.slice()
  const compare = getComparator(args[0])
  for (let i = 1; i < result.length; i++) {
    const value = result[i]
    let j = i - 1
    while (j >= 0 && compare(result[j], value) > 0) {
      result[j + 1] = result[j]
      j--
    }
    result[j + 1] = value
  }
  return result
}

/** Shell sort using halving gaps. Returns a new array. */
export function shellSort<T>(values: readonly T[], ...args: SortArguments<T>): T[] {
  const result = values.slice()
  const compare = getComparator(args[0])
  for (let gap = Math.floor(result.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < result.length; i++) {
      const value = result[i]
      let j = i
      while (j >= gap && compare(result[j - gap], value) > 0) {
        result[j] = result[j - gap]
        j -= gap
      }
      result[j] = value
    }
  }
  return result
}

/** Stable bottom-up merge sort. Returns a new array. */
export function mergeSort<T>(values: readonly T[], ...args: SortArguments<T>): T[] {
  let result = values.slice()
  let buffer = new Array<T>(result.length)
  const compare = getComparator(args[0])
  for (let width = 1; width < result.length; width *= 2) {
    for (let start = 0; start < result.length; start += width * 2) {
      const middle = Math.min(start + width, result.length)
      const end = Math.min(start + width * 2, result.length)
      let left = start
      let right = middle
      for (let i = start; i < end; i++) {
        if (left < middle && (right >= end || compare(result[left], result[right]) <= 0)) {
          buffer[i] = result[left++]
        } else {
          buffer[i] = result[right++]
        }
      }
    }
    [result, buffer] = [buffer, result]
  }
  return result
}

/** Iterative three-way quick sort. Returns a new array. */
export function quickSort<T>(values: readonly T[], ...args: SortArguments<T>): T[] {
  const result = values.slice()
  const compare = getComparator(args[0])
  const ranges: [number, number][] = [[0, result.length - 1]]
  while (ranges.length > 0) {
    const [start, end] = ranges.pop()!
    if (start >= end) continue
    const pivot = result[Math.floor((start + end) / 2)]
    let lower = start
    let upper = end
    let i = start
    while (i <= upper) {
      const order = compare(result[i], pivot)
      if (order < 0) {
        [result[i], result[lower]] = [result[lower], result[i]]
        lower++
        i++
      } else if (order > 0) {
        [result[i], result[upper]] = [result[upper], result[i]]
        upper--
      } else {
        i++
      }
    }
    ranges.push([start, lower - 1], [upper + 1, end])
  }
  return result
}

/** Heap sort. Returns a new array. */
export function heapSort<T>(values: readonly T[], ...args: SortArguments<T>): T[] {
  const result = values.slice()
  const compare = getComparator(args[0])
  function siftDown(root: number, size: number): void {
    while (root * 2 + 1 < size) {
      let child = root * 2 + 1
      if (child + 1 < size && compare(result[child + 1], result[child]) > 0) child++
      if (compare(result[root], result[child]) >= 0) return
      [result[root], result[child]] = [result[child], result[root]]
      root = child
    }
  }
  for (let root = Math.floor(result.length / 2) - 1; root >= 0; root--) siftDown(root, result.length)
  for (let end = result.length - 1; end > 0; end--) {
    [result[0], result[end]] = [result[end], result[0]]
    siftDown(0, end)
  }
  return result
}
