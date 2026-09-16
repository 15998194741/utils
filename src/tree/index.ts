export type TreeNode<T> = T & { children: TreeNode<T>[] }
export interface TreeOptions<T, K> {
  getId: (value: T) => K
  getParentId: (value: T) => K | null | undefined
}

/** Missing parents become roots. Duplicate IDs and parent cycles are rejected.
 * Copies nodes shallowly; input children properties are replaced.
 */
export function listToTree<T extends object, K>(values: readonly T[], options: TreeOptions<T, K>): TreeNode<T>[] {
  const nodes = new Map<K, TreeNode<T>>()
  const parents = new Map<K, K | null | undefined>()
  for (const value of values) {
    const id = options.getId(value)
    if (id === null || id === undefined) throw new TypeError('Tree ID cannot be null or undefined')
    if (nodes.has(id)) throw new TypeError('Duplicate tree ID')
    nodes.set(id, { ...value, children: [] })
    parents.set(id, options.getParentId(value))
  }
  const done = new Set<K>()
  for (const id of nodes.keys()) {
    const visiting = new Set<K>()
    let current: K | null | undefined = id
    while (current !== null && current !== undefined && nodes.has(current) && !done.has(current)) {
      if (visiting.has(current)) throw new TypeError('Cyclic tree parent relationship')
      visiting.add(current)
      current = parents.get(current)
    }
    visiting.forEach(key => done.add(key))
  }
  const roots: TreeNode<T>[] = []
  for (const [id, node] of nodes) {
    const parentId = parents.get(id)
    const parent = parentId === null || parentId === undefined ? undefined : nodes.get(parentId)
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

/** Iterative preorder traversal. Rejects cycles and repeated node references. */
export function treeToList<T>(roots: readonly T[], getChildren: (node: T) => readonly T[]): T[] {
  const stack = roots.slice().reverse()
  const seen = new Set<T>()
  const result: T[] = []
  while (stack.length) {
    const node = stack.pop()!
    if (seen.has(node)) throw new TypeError('Tree contains a cycle or repeated node')
    seen.add(node)
    result.push(node)
    const children = getChildren(node)
    for (let i = children.length - 1; i >= 0; i--) stack.push(children[i])
  }
  return result
}

/** Returns the first preorder match. Does not visit children of a matching node. */
export function findTreeNode<T>(roots: readonly T[], predicate: (node: T) => boolean, getChildren: (node: T) => readonly T[]): T | undefined {
  const stack = roots.slice().reverse()
  const seen = new Set<T>()
  while (stack.length) {
    const node = stack.pop()!
    if (seen.has(node)) throw new TypeError('Tree contains a cycle or repeated node')
    seen.add(node)
    if (predicate(node)) return node
    const children = getChildren(node)
    for (let i = children.length - 1; i >= 0; i--) stack.push(children[i])
  }
  return undefined
}
