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
  onCreate?: (name: string) => Promise<void>
}

const TreeAddInput: React.FC<TreeAddInputProps> = props => {
  const { onCreate, onCancel, ...inputProps } = props

  const onKeyPress: KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.keyCode === 27) {
      // ESC
      onCancel && onCancel()
    } else if (e.keyCode === 13) {
      // Enter
      onCreate && onCreate(e.currentTarget.value)
    }
  }

  return <Input {...inputProps} onKeyDown={onKeyPress} />
}

export interface FileTreeProps extends TreeProps {
  onCreate?: (type: NodeType, name: string) => Promise<void>
}

const FileTree: React.FC<FileTreeProps> = ({ onCreate, ...treeProps }) => {
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
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

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
    setAdding({ parent: parentDir, type })
  }

  const rightMenu = (
    <Menu className="breeze-file-dropdown">
      <Menu.Item icon={<EditOutlined />}>
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
      data.files.map(e => ({
        path: e.path,
        isLeaf: e.__typename === 'File',
        title: basename(e.path),
        icon: e.__typename === 'File' ? <FileOutlined /> : <FolderOutlined />,
        disabled: adding !== undefined
      })),
      'path'
    )
  )
  const rootTreeNodes: TreeProps['treeData'] =
    (treeData[0].key === '/' ? treeData[0].children : treeData) || []

  if (adding !== undefined) {
    // insert adding node at right position
    const addTreeNode = {
      key: '__',
      icon:
        adding.type === NodeType.FILE ? (
          <FileAddOutlined />
        ) : (
          <FolderAddOutlined />
        ),
      title: (
        <TreeAddInput
          size="small"
          autoFocus
          onCancel={() => setAdding(undefined)}
          onCreate={async name => {
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

  const onItemRightClick: TreeProps['onRightClick'] = ({ node, event }) => {
    setRightClicked({
      isFile: node.isLeaf === true,
      path: node.key.toString()
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
            onExpand={(newExpandedKeys, info) => {
              console.log(newExpandedKeys)
              console.log(info)
              setExpandedKeys([...newExpandedKeys.map(e => e.toString())])
            }}
            showIcon={true}
            treeData={rootTreeNodes}
            {...treeProps}
          />
        </div>
      </Dropdown>
    </div>
  )
}

export default FileTree
