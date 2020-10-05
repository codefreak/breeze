// allowed object index types
export type IndexType = string | number
export type PropertiesOfType<T, S> = {
  [K in keyof T]: T[K] extends S ? K : never
}[keyof T]

export interface TreeNode<T> {
  key: IndexType
  children?: (T & TreeNode<T>)[]
  parent?: T & TreeNode<T>
}

// to extract path from parent or child
export interface Supplier<T, S> {
  (parent: T): S
}

export const objectListToTree = <T>(
  list: T[],
  keyExtractor: Supplier<T, IndexType>,
  parentKeyExtractor: Supplier<T, IndexType | undefined>
): (T & TreeNode<T>)[] => {
  if (list.length === 0) {
    return []
  }

  // create a map of paths to tree nodes for each element
  const parentMap: Record<IndexType, T & TreeNode<T>> = {}
  list.forEach(node => {
    const key = keyExtractor(node)
    parentMap[key] = {
      ...node,
      key,
      children: []
    }
  })

  const rootNodes: (T & TreeNode<T>)[] = []
  const treeNodes = Object.entries(parentMap)
  // add children to their parents
  treeNodes.forEach(([_, child]) => {
    const parentKey = parentKeyExtractor(child)
    const parent =
      parentKey !== undefined && parentKey in parentMap
        ? parentMap[parentKey]
        : undefined

    if (parent !== undefined && parent !== child) {
      // there is a parent node for this item
      if (parent.children) {
        parent.children.push(child)
      } else {
        parent.children = [child]
      }
      child.parent = parent
    } else {
      // is a root node (or orphan)
      rootNodes.push(child)
    }
  })

  return rootNodes
}

/**
 * Convert a list to using properties from each element
 *
 * @param list
 * @param keyProperty
 * @param parentKeyProperty
 */
export const listToTreeByProperty = <
  T extends { [key in S]: IndexType },
  S extends PropertiesOfType<T, IndexType>,
  Q extends PropertiesOfType<T, IndexType | undefined>
>(
  list: T[],
  keyProperty: S,
  parentKeyProperty: Q
) =>
  objectListToTree(
    list,
    (item: T) => item[keyProperty],
    (item: T) => item[parentKeyProperty]
  )

export type TreeSortFunction<T> = (a: TreeNode<T>, b: TreeNode<T>) => number

/**
 * Default tree sorting function that compares TreeNodes by key alphabetically
 */
export const treeKeySorter = <T>(a: TreeNode<T>, b: TreeNode<T>) => {
  return a.key.toString().localeCompare(b.key.toString())
}

/**
 * Sort a tree and its children recursively.
 * Sorts by path alphabetically be default
 *
 * @param nodes The children of the root node
 * @param sortFunction Optional custom function
 */
export const sortTree = <T>(
  nodes: Array<T & TreeNode<T>>,
  sortFunction: TreeSortFunction<T> = treeKeySorter
): Array<T & TreeNode<T>> => {
  return nodes
    .map(node => {
      if (!node.children) {
        return node
      } else {
        return {
          ...node,
          children: sortTree(node.children, sortFunction)
        }
      }
    })
    .sort(sortFunction)
}

export type TreeNodeWalkFunction<T> = (node: T & TreeNode<T>) => void

export const walkTree = <T>(
  nodes: Array<T & TreeNode<T>>,
  walkFunction: TreeNodeWalkFunction<T>
): void => {
  return nodes.forEach(node => {
    if (node.children) {
      walkTree(node.children, walkFunction)
    }
    walkFunction(node)
  })
}
