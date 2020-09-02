import { Tree, Button, Input } from 'antd'
import React, {
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import './FileTree.less'
import {
  listToTreeByPath,
  sortTree,
  TreeNode as TreeNodeModel
} from '@codefreak/tree-utils'
import { Directory, File } from '../generated/graphql'
import { basename } from 'path'
import {
  FileOutlined,
  FolderOutlined,
  FileAddOutlined,
  FolderAddOutlined
} from '@ant-design/icons'
import useFiles from '../hooks/useFiles'
import { TreeProps } from 'antd/lib/tree'
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons/lib'
import LoadingIndicator from "./LoadingIndicator";

const { TreeNode } = Tree

type Fileish = File | Directory
const renderTreeRecursive = (nodes: TreeNodeModel<Fileish>[]) => {
  return nodes.map(node => {
    const filename = basename(node.node.path) || '/'
    const isFile = node.node.__typename === 'File'
    const icon = isFile ? <FileOutlined /> : <FolderOutlined />
    return (
      <TreeNode key={node.key} icon={icon} title={filename} isLeaf={isFile}>
        {node.children.length > 0 ? renderTreeRecursive(node.children) : null}
      </TreeNode>
    )
  })
}

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

  if (loading || data === undefined) {
    return <LoadingIndicator />
  }

  const tree = sortTree(listToTreeByPath(data.files, 'path'))
  return (
    <div className="breeze-file-tree">
      <Tree
        defaultExpandedKeys={['/']}
        blockNode
        showIcon={true}
        className=""
        {...treeProps}
      >
        {renderTreeRecursive(tree[0].children)}
      </Tree>
      <FileTreeAdder onCreate={onCreate} />
    </div>
  )
}

export default FileTree
