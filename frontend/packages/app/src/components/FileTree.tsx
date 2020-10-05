import { Tree, Input, Menu, Dropdown } from 'antd'
import React, { KeyboardEventHandler, useEffect, useState } from 'react'
import './FileTree.less'
import { listToTreeByPath, sortTree, walkTree } from '@codefreak/tree-utils'
import { basename, dirname, join } from 'path'
import {
  FileOutlined,
  FolderOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import useFiles from '../hooks/useFiles'
import { TreeProps } from 'antd/lib/tree'
import LoadingIndicator from './LoadingIndicator'
import { InputProps } from 'antd/es/input'

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
  onCreate?: (type: NodeType, name: string) => Promise<void>
  onRename?: (oldName: string, newName: string) => Promise<void>
  onFileClick?: (type: NodeType, name: string) => Promise<void>
}

const FileTree: React.FC<FileTreeProps> = props => {
  const { onCreate, onRename, onFileClick, ...treeProps } = props
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

  const onAddClick = (type: NodeType) => () => {
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

  const rightMenu = (
    <Menu className="breeze-file-dropdown">
      <Menu.Item
        icon={<EditOutlined />}
        onClick={() => {
          setAdding(undefined)
          setRenaming(rightClicked?.path?.replace(/^\/+/, ''))
        }}
      >
        Rename {rightClicked?.isFile ? 'File' : 'Directory'}
      </Menu.Item>
      <Menu.Item
        icon={<DeleteOutlined />}
        style={{
          color: 'red'
        }}
      >
        Delete {rightClicked?.isFile ? 'File' : 'Directory'}
      </Menu.Item>
      <Menu.Item icon={<FileAddOutlined />} onClick={onAddClick(NodeType.FILE)}>
        New file
      </Menu.Item>
      <Menu.Item
        icon={<FolderAddOutlined />}
        onClick={onAddClick(NodeType.DIRECTORY)}
      >
        New directory
      </Menu.Item>
    </Menu>
  )

  if (loading || data === undefined) {
    return <LoadingIndicator />
  }

  const treeData = sortTree(
    listToTreeByPath(
      data.files.map(e => {
        let title: React.ReactElement | string = basename(e.path)
        const isRenameTarget = renaming === e.path
        if (renaming && isRenameTarget) {
          title = (
            <TreeInput
              defaultValue={basename(renaming)}
              onConfirm={async (newName: string) => {
                if (onRename) {
                  await onRename(renaming, newName)
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
  )
  const rootTreeNodes: TreeProps['treeData'] =
    (treeData[0].key === '/' ? treeData[0].children : treeData) || []

  if (adding !== undefined) {
    // insert adding node at right position
    const addTreeNode = {
      key: '\0',
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
            onCreate && (await onCreate(adding.type, path))
            setAdding(undefined)
          }}
        />
      ),
      className: 'breeze-file-tree-adder'
    }
    if (adding.parent === '/') {
      rootTreeNodes.push(addTreeNode)
    } else {
      walkTree(rootTreeNodes, node => {
        if (node.key === adding.parent) {
          node.children = [addTreeNode, ...(node.children || [])]
        }
      })
    }
  }

  const onItemRightClick: TreeProps['onRightClick'] = ({ node }) => {
    const path = node.key.toString()
    if (path.indexOf('\0') !== -1) {
      return
    }
    setRightClicked({
      isFile: node.isLeaf === true,
      path
    })
  }

  return (
    <div className="breeze-file-tree">
      <Dropdown overlay={rightMenu} trigger={['contextMenu']}>
        <div className="breeze-file-tree-trigger">
          <Tree
            draggable={true}
            onRightClick={onItemRightClick}
            blockNode
            expandedKeys={expandedKeys}
            onExpand={newExpandedKeys => {
              setExpandedKeys([...newExpandedKeys.map(e => e.toString())])
            }}
            showIcon={true}
            treeData={rootTreeNodes}
            onClick={async (e, treeNode) => {
              const path = treeNode.key.toString()
              if (path === '\0' || !onFileClick) {
                return
              }
              await onFileClick(
                treeNode.isLeaf ? NodeType.FILE : NodeType.DIRECTORY,
                path.replace(/^\/+/, '')
              )
            }}
            {...treeProps}
          />
        </div>
      </Dropdown>
    </div>
  )
}

export default FileTree
