import { fillMissingPaths, listToTreeByPath } from './paths'
import { TreeNode } from './common'

interface PathItem {
  path: string
}

type PathTreeItem = PathItem & TreeNode<PathItem> & { children: PathTreeItem[] }

const TEST_PATH_LIST: PathItem[] = [
  { path: '/' },
  { path: '/a' },
  { path: '/a/a' },
  { path: '/a/b' },
  { path: '/a/b/a' },
  { path: '/b' },
  { path: '/b/a' }
]

describe('listToTreeByPath', () => {
  it('creates tree by using parent path', () => {
    const root: PathTreeItem = {
      ...TEST_PATH_LIST[0],
      key: '/',
      children: []
    }
    const a: PathTreeItem = {
      ...TEST_PATH_LIST[1],
      key: '/a',
      children: [],
      parent: root
    }
    root.children.push(a)
    const aa: PathTreeItem = {
      ...TEST_PATH_LIST[2],
      key: '/a/a',
      children: [],
      parent: a
    }
    a.children.push(aa)
    const ab: PathTreeItem = {
      ...TEST_PATH_LIST[3],
      key: '/a/b',
      children: [],
      parent: a
    }
    a.children.push(ab)
    const aba: PathTreeItem = {
      ...TEST_PATH_LIST[4],
      key: '/a/b/a',
      children: [],
      parent: ab
    }
    ab.children.push(aba)
    const b: PathTreeItem = {
      ...TEST_PATH_LIST[5],
      key: '/b',
      children: [],
      parent: root
    }
    root.children.push(b)
    const ba: PathTreeItem = {
      ...TEST_PATH_LIST[6],
      key: '/b/a',
      children: [],
      parent: b
    }
    b.children.push(ba)
    expect(listToTreeByPath(TEST_PATH_LIST, 'path')).toEqual([root])
  })
})

describe('fillMissingPaths', () => {
  it('adds missing paths', () => {
    expect(
      fillMissingPaths(
        [
          {
            path: '/a/b/c'
          },
          {
            path: '/b/c/c'
          }
        ],
        'path'
      )
    ).toEqual([
      {
        path: '/a/b/c'
      },
      {
        path: '/b/c/c'
      },
      {
        path: '/a/b'
      },
      {
        path: '/a'
      },
      {
        path: '/'
      },
      {
        path: '/b/c'
      },
      {
        path: '/b'
      }
    ])
  })
})
