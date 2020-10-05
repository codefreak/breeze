import { listToTreeByProperty, TreeNode } from './common'

interface ListItemType {
  id: number
  parentId: number | undefined
}

const TEST_LIST: ListItemType[] = [
  { id: 0, parentId: undefined }, // 0
  { id: 1, parentId: 0 }, // 0-1
  { id: 2, parentId: 0 }, // 0-2
  { id: 3, parentId: 2 } // 0-2-3
]

type TreeItem = ListItemType & TreeNode<ListItemType> & { children: TreeItem[] }

describe('listToTreeByProperty', () => {
  it('returns empty tree for empty input', () => {
    expect(
      listToTreeByProperty([] as ListItemType[], 'id', 'parentId')
    ).toEqual([])
  })

  it('nests children correctly', () => {
    const rootNode: TreeItem = {
      ...TEST_LIST[0],
      key: 0,
      children: []
    }
    const child01: TreeItem = {
      ...TEST_LIST[1],
      key: 1,
      children: [],
      parent: rootNode
    }
    const child02: TreeItem = {
      ...TEST_LIST[2],
      key: 2,
      children: [],
      parent: rootNode
    }
    const child023: TreeItem = {
      ...TEST_LIST[3],
      key: 3,
      children: [],
      parent: child02
    }
    rootNode.children.push(child01, child02)
    child02.children.push(child023)

    expect(listToTreeByProperty(TEST_LIST, 'id', 'parentId')).toStrictEqual([
      rootNode
    ])
  })
})
