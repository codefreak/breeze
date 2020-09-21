import { Tree, Button, Input, Menu, Dropdown } from 'antd'
import React, {
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import './FileTree.less'
import { listToTreeByPath, sortTree } from '@codefreak/tree-utils'
import { basename } from 'path'
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
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons/lib'
import LoadingIndicator from './LoadingIndicator'

export enum NodeType {
  FILE = 'file',
  DIRECTORY = 'directory'
}

export interface FileTreeAdderProps {
  onCreate?: (type: NodeType, name: string) => Promise<void>
}

const FileTreeAdder: React.FC<FileTreeAdderProps> = ({ onCreate }) => {
  const [nodeAddType, setNodeAddType] = useState<NodeType>()
  const inputRef = useRef<Input>(null)
  const [name, setName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const reset = useCallback(() => {
    setName('')
    setNodeAddType(undefined)
    setLoading(false)
  }, [setName, setLoading, setNodeAddType])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [inputRef, nodeAddType])

  const create = useCallback(() => {
    if (onCreate && nodeAddType && name.trim()) {
      setLoading(true)
      onCreate(nodeAddType, name)
        .then(reset)
        .catch(() => {
          setLoading(false)
        })
    } else {
      reset()
    }
  }, [onCreate, setLoading, reset, nodeAddType, name])

  const onKeyPress = useCallback<KeyboardEventHandler>(
    e => {
      if (e.keyCode === 27) {
        // ESC
        reset()
      } else if (e.keyCode === 13) {
        // Enter
        create()
      }
    },
    [reset, create]
  )

  return (
    <div className="file-tree-footer">
      {nodeAddType && (
        <div className="file-tree-footer-adding">
          <Input
            prefix={
              nodeAddType === NodeType.FILE ? (
                <FileOutlined />
              ) : (
                <FolderOutlined />
              )
            }
            suffix={
              loading ? (
                <LoadingOutlined />
              ) : (
                <CheckOutlined onClick={name.trim() ? create : undefined} />
              )
            }
            placeholder={`Enter name for new ${nodeAddType}…`}
            size="small"
            ref={inputRef}
            onKeyDown={onKeyPress}
            value={name}
            onChange={event => setName(event.target.value)}
          />
        </div>
      )}
      <div>
        <Button
          onClick={() => setNodeAddType(NodeType.FILE)}
          icon={<FileAddOutlined />}
        />
        <Button
          onClick={() => setNodeAddType(NodeType.DIRECTORY)}
          icon={<FolderAddOutlined />}
        />
      </div>
    </div>
  )
}

export interface FileTreeProps extends TreeProps {
  onCreate?: FileTreeAdderProps['onCreate']
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
      <Menu.Item icon={<FileAddOutlined />}>New file</Menu.Item>
      <Menu.Item icon={<FolderAddOutlined />}>New directory</Menu.Item>
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
        icon: e.__typename === 'File' ? <FileOutlined /> : <FolderOutlined />
      })),
      'path'
    )
  )
  const rootTreeNode = treeData[0].key === '/' ? treeData[0].children : treeData

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
            defaultExpandedKeys={['/']}
            blockNode
            showIcon={true}
            treeData={rootTreeNode}
            {...treeProps}
          />
        </div>
      </Dropdown>
      <FileTreeAdder onCreate={onCreate} />
    </div>
  )
}

export default FileTree
