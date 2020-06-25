import { Spin, Tree, Button, Input } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
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

enum NodeType {
  FILE = 'file',
  DIRECTORY = 'directory'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FileTreeFooter: React.FC = () => {
  const [nodeAddType, setNodeAddType] = useState<NodeType>()
  const inputRef = useRef<Input>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [inputRef, nodeAddType])

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
            placeholder={`Enter name for new ${nodeAddType}…`}
            size="small"
            ref={inputRef}
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

interface FileTreeProps extends TreeProps {
  onClickFile?: (path: string) => void
}

const FileTree: React.FC<FileTreeProps> = ({ onClickFile }) => {
  const { loading, data } = useFiles()

  if (loading || data === undefined) {
    return <Spin />
  }

  const tree = sortTree(listToTreeByPath(data.files, 'path'))
  return (
    <div className="breeze-file-tree">
      <Tree
        defaultExpandedKeys={['/']}
        showIcon={true}
        className=""
        onClick={(_, node) => {
          if (onClickFile && node.isLeaf) {
            onClickFile(node.key.toString())
          }
        }}
      >
        {renderTreeRecursive(tree[0].children)}
      </Tree>
      {/* <FileTreeFooter /> */}
    </div>
  )
}

export default FileTree
