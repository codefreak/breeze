import { fillMissingPaths, listToTreeByPath } from "./paths";
import {TreeNode} from "./common";

interface PathItem {
  path: string;
}

const TEST_PATH_LIST: PathItem[] = [
  { path: "/" },
  { path: "/a" },
  { path: "/a/a" },
  { path: "/a/b" },
  { path: "/a/b/a" },
  { path: "/b" },
  { path: "/b/a" },
];

describe("listToTreeByPath", () => {
  it("creates tree by using parent path", () => {
    const root: TreeNode<PathItem> = {
      key: "/",
      node: TEST_PATH_LIST[0],
      children: [],
    };
    const a: TreeNode<PathItem> = {
      key: "/a",
      node: TEST_PATH_LIST[1],
      children: [],
      parent: root,
    };
    root.children.push(a);
    const aa: TreeNode<PathItem> = {
      key: "/a/a",
      node: TEST_PATH_LIST[2],
      children: [],
      parent: a,
    };
    a.children.push(aa);
    const ab: TreeNode<PathItem> = {
      key: "/a/b",
      node: TEST_PATH_LIST[3],
      children: [],
      parent: a,
    };
    a.children.push(ab);
    const aba: TreeNode<PathItem> = {
      key: "/a/b/a",
      node: TEST_PATH_LIST[4],
      children: [],
      parent: ab,
    };
    ab.children.push(aba);
    const b: TreeNode<PathItem> = {
      key: "/b",
      node: TEST_PATH_LIST[5],
      children: [],
      parent: root,
    };
    root.children.push(b);
    const ba: TreeNode<PathItem> = {
      key: "/b/a",
      node: TEST_PATH_LIST[6],
      children: [],
      parent: b,
    };
    b.children.push(ba);
    expect(listToTreeByPath(TEST_PATH_LIST, "path")).toEqual([root]);
  });
});

describe("fillMissingPaths", () => {
  it("adds missing paths", () => {
    expect(
      fillMissingPaths(
        [
          {
            path: "/a/b/c",
          },
          {
            path: "/b/c/c",
          },
        ],
        "path"
      )
    ).toEqual([
      {
        path: "/a/b/c",
      },
      {
        path: "/b/c/c",
      },
      {
        path: "/a/b",
      },
      {
        path: "/a",
      },
      {
        path: "/",
      },
      {
        path: "/b/c",
      },
      {
        path: "/b",
      },
    ]);
  });
});
