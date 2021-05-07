import { Tree, Input, Menu, Dropdown, Modal } from 'antd'
import React, {
  KeyboardEventHandler,
  useEffect,
  useMemo,
  useState
} from 'react'
import './FileTree.less'
import { listToTreeByPath, sortTree, walkTree } from '@codefreak/tree-utils'
import { basename, dirname, join } from 'path'
import {
  FileOutlined,
  FolderOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import useFiles from '../hooks/useFiles'
import { TreeProps } from 'antd/lib/tree'
import LoadingIndicator from './LoadingIndicator'
import { InputProps } from 'antd/es/input'
import { getCanonicalPath } from '../util/path'

// special key for the tree node containing the input field (creating, renaming files)
const NODE_CREATE_KEY = '\0'

export enum NodeType {
  FILE = 'file',
  DIRECTORY = 'directory'
}

interface TreeAddInputProps extends InputProps {
  onCancel?: () => void
  onConfirm?: (name: string) => Promise<void>
}

const TreeInput: React.FC<TreeAddInputProps> = props => {
  const { onConfirm, onCancel, ...inputProps } = props

  const onKeyPress: KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.keyCode === 27) {
      // ESC
      onCancel && onCancel()
    } else if (e.keyCode === 13) {
      // Enter
      onConfirm && onConfirm(e.currentTarget.value)
    }
  }

  return <Input size="small" autoFocus {...inputProps} onKeyDown={onKeyPress} />
}

export interface FileTreeProps extends TreeProps {
  onCreate?: (name: string, type: NodeType) => Promise<void>
  onRename?: (oldName: string, newName: string, type: NodeType) => Promise<void>
  onFileClick?: (name: string, type: NodeType) => Promise<void>
  onDelete?: (path: string, type: NodeType) => Promise<void>
  onMove?: (path: string, target: string, type: NodeType) => Promise<void>
}

const FileTree: React.FC<FileTreeProps> = props => {
  const {
    onCreate,
    onRename,
    onFileClick,
    onDelete,
    onMove,
    ...treeProps
  } = props
  const { loading, data } = useFiles()
  const [rightClicked, setRightClicked] = useState<
    | {
        isFile: boolean
        path: string
      }
    | undefined
  >(undefined)
  const [adding, setAdding] = useState<
    | {
        parent: string
        type: NodeType
      }
    | undefined
  >()
  const [renaming, setRenaming] = useState<string | undefined>()
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  // expand subtree if we are creating a file/dir in it
  useEffect(() => {
    if (adding && expandedKeys.indexOf(adding.parent) === -1) {
      setExpandedKeys([adding.parent, ...expandedKeys])
    }
  }, [expandedKeys, adding])

  const buildOnAddClick = (type: NodeType) => () => {
    let parentDir
    if (rightClicked?.isFile === false) {
      // if you add something on a folder add a child
      parentDir = rightClicked.path
    } else {
      // if you add something on a file add a sibling
      parentDir = rightClicked?.path ? dirname(rightClicked.path) : '/'
    }
    setRenaming(undefined)
    setAdding({ parent: parentDir, type })
  }

  const onDeleteClick = () => {
    const path = rightClicked?.path
    if (!path) {
      return
    }
    Modal.confirm({
      icon: <ExclamationCircleOutlined />,
      title: `Really delete ${basename(path)}?`,
      content: 'This action cannot be undone!',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        if (onDelete) {
          await onDelete(
            path,
            rightClicked?.isFile === false ? NodeType.DIRECTORY : NodeType.FILE
          )
        }
      }
    })
  }

  const rightMenu = (
    <Menu className="breeze-file-dropdown">
      <Menu.Item
        icon={<EditOutlined />}
        onClick={() => {
          setAdding(undefined)
          setRenaming(rightClicked?.path)
        }}
      >
        Rename {rightClicked?.isFile ? 'File' : 'Directory'}
      </Menu.Item>
      <Menu.Item
        icon={<DeleteOutlined />}
        style={{
          color: 'red'
        }}
        onClick={onDeleteClick}
      >
        Delete {rightClicked?.isFile ? 'File' : 'Directory'}
      </Menu.Item>
      <Menu.Item
        icon={<FileAddOutlined />}
        onClick={buildOnAddClick(NodeType.FILE)}
      >
        New file
      </Menu.Item>
      <Menu.Item
        icon={<FolderAddOutlined />}
        onClick={buildOnAddClick(NodeType.DIRECTORY)}
      >
        New directory
      </Menu.Item>
    </Menu>
  )

  const treeData = useMemo(() => {
    if (data === undefined) {
      return undefined
    }
    const tree = listToTreeByPath(
      data.files.map(e => {
        let title: React.ReactNode = basename(e.path)
        const isRenameTarget = renaming === getCanonicalPath(e.path)
        if (renaming && isRenameTarget) {
          title = (
            <TreeInput
              defaultValue={basename(renaming)}
              onConfirm={async (newName: string) => {
                if (onRename) {
                  await onRename(
                    renaming,
                    newName,
                    e.__typename === 'File' ? NodeType.FILE : NodeType.DIRECTORY
                  )
                }
                setRenaming(undefined)
              }}
              onCancel={() => {
                setRenaming(undefined)
              }}
            />
          )
        }
        return {
          path: e.path,
          isLeaf: e.__typename === 'File',
          title,
          icon: e.__typename === 'File' ? <FileOutlined /> : <FolderOutlined />,
          disabled:
            !isRenameTarget && (adding !== undefined || renaming !== undefined)
        }
      }),
      'path'
    )

    const sortedTree = sortTree(tree)

    let rootTreeNodes: TreeProps['treeData'] =
      (sortedTree[0].key === '/' ? sortedTree[0].children : sortedTree) || []

    if (adding !== undefined) {
      // insert adding node at right position
      const addTreeNode = {
        key: NODE_CREATE_KEY,
        icon:
          adding.type === NodeType.FILE ? (
            <FileAddOutlined />
          ) : (
            <FolderAddOutlined />
          ),
        title: (
          <TreeInput
            onCancel={() => setAdding(undefined)}
            onConfirm={async name => {
              const path = join(adding.parent, name)
              onCreate && (await onCreate(path, adding.type))
              setAdding(undefined)
            }}
          />
        ),
        className: 'breeze-file-tree-adder'
      }
      if (adding.parent === '/') {
        rootTreeNodes = [addTreeNode, ...rootTreeNodes]
      } else {
        walkTree(rootTreeNodes, node => {
          if (node.key === adding.parent) {
            node.children = [addTreeNode, ...(node.children || [])]
          }
        })
      }
    }

    return rootTreeNodes
  }, [data, setRenaming, renaming, onRename, adding, onCreate])

  if (loading || treeData === undefined) {
    return <LoadingIndicator />
  }

  const onItemRightClick: TreeProps['onRightClick'] = ({ node }) => {
    const path = node.key.toString()
    if (path.indexOf(NODE_CREATE_KEY) !== -1) {
      return
    }
    setRightClicked({
      isFile: node.isLeaf === true,
      path
    })
  }

  const onDrop: FileTreeProps['onDrop'] = async ({
    dragNode,
    node,
    dropToGap
  }) => {
    if (!onMove) {
      return
    }
    if (!dropToGap && node.isLeaf) {
      // cannot drop onto files
      return
    }
    const path = dragNode.key.toString()
    const target = dropToGap
      ? dirname(node.key.toString())
      : node.key.toString()
    if (path === target) {
      return
    }
    await onMove(path, target, node.isLeaf ? NodeType.FILE : NodeType.DIRECTORY)
  }

  const onClick: FileTreeProps['onClick'] = async (e, treeNode) => {
    const path = treeNode.key.toString()
    if (path === NODE_CREATE_KEY || !onFileClick) {
      return
    }
    await onFileClick(
      path,
      treeNode.isLeaf ? NodeType.FILE : NodeType.DIRECTORY
    )
  }

  // we manage the expanded props manually so we can expand directories if new nodes are created inside it
  const onExpand: FileTreeProps['onExpand'] = newExpandedKeys => {
    setExpandedKeys([...newExpandedKeys.map(e => e.toString())])
  }

  return (
    <div className="breeze-file-tree">
      <Dropdown overlay={rightMenu} trigger={['contextMenu']}>
        <div className="breeze-file-tree-trigger">
          <Tree
            blockNode
            showIcon={true}
            {...treeProps}
            treeData={treeData}
            expandedKeys={expandedKeys}
            onExpand={onExpand}
            onClick={onClick}
            onRightClick={onItemRightClick}
            draggable={onMove !== undefined}
            onDrop={onDrop}
          />
        </div>
      </Dropdown>
    </div>
  )
}

export default FileTree
