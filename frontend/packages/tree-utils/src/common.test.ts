import { common, listToTreeByProperty, sortTree, TreeNode } from "./common";

interface ListItemType {
  id: number;
  parentId: number | undefined;
}

const TEST_LIST: ListItemType[] = [
  { id: 0, parentId: undefined }, // 0
  { id: 1, parentId: 0 }, // 0-1
  { id: 2, parentId: 0 }, // 0-2
  { id: 3, parentId: 2 }, // 0-2-3
];

describe("listToTree", () => {
  it("returns empty tree for empty input", () => {
    expect(
      listToTreeByProperty([] as ListItemType[], "id", "parentId")
    ).toEqual([]);
  });

  it("nests children correctly", () => {
    const rootNode: TreeNode<ListItemType> = {
      key: 0,
      node: TEST_LIST[0],
      children: [],
    };
    const child01: TreeNode<ListItemType> = {
      key: 1,
      node: TEST_LIST[1],
      children: [],
      parent: rootNode,
    };
    const child02: TreeNode<ListItemType> = {
      key: 2,
      node: TEST_LIST[2],
      children: [],
      parent: rootNode,
    };
    const child023: TreeNode<ListItemType> = {
      key: 3,
      node: TEST_LIST[3],
      children: [],
      parent: child02,
    };
    rootNode.children.push(child01, child02);
    child02.children.push(child023);

    expect(listToTreeByProperty(TEST_LIST, "id", "parentId")).toStrictEqual([
      rootNode,
    ]);
  });
});
