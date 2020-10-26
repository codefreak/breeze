import React, { useCallback, useState } from 'react'
import { Col, Row, Tabs } from 'antd'
import FileTree, { FileTreeProps, NodeType } from './FileTree'
import Monaco from './Monaco'
import { BreezeComponent } from '../App'
import { basename, join } from 'path'
import { insertAfter, remove } from '../util/array'
import { TabsProps } from 'antd/es/tabs'
import {
  useCreateDirectoryMutation,
  useCreateFileMutation,
  useDeleteFileMutation,
  useMoveFileMutation
} from '../generated/graphql'
import withConfig, { WithConfigProps } from '../util/withConfig'

import './Editor.less'
import useWorkspaceOption from '../hooks/useWorkspaceOption'

interface EditorProps extends WithConfigProps {
  defaultFile?: string
}

const Editor: React.FC<EditorProps> = ({ config: { mainFile } }) => {
  const [fileStack, setFileStack] = useWorkspaceOption<string[]>(
    'opened-files',
    mainFile ? [mainFile] : []
  )
  const [currentFile, setCurrentFile] = useWorkspaceOption<string>(
    'current-file',
    fileStack[0]
  )
  const [selectedPath, setSelectedPath] = useState<string>('/')
  const [createFile] = useCreateFileMutation()
  const [createDirectory] = useCreateDirectoryMutation()
  const [moveFile] = useMoveFileMutation()
  const [deleteFile] = useDeleteFileMutation()

  const setOpenFile = useCallback(
    (path: string) => {
      const normalizedPath = path.replace(/^\/+/, '')
      // insert after current opened file
      if (fileStack.indexOf(normalizedPath) === -1) {
        setFileStack(insertAfter(fileStack, normalizedPath, currentFile))
      }
      setCurrentFile(normalizedPath)
    },
    [fileStack, setFileStack, setCurrentFile, currentFile]
  )

  const onEditTab: TabsProps['onEdit'] = useCallback(
    (targetKey, action) => {
      if (action === 'remove') {
        const path = targetKey.toString()
        const newFileStack = remove(fileStack, path)
        // select another file if current one is closed
        if (currentFile === path) {
          const newFileIndex = Math.min(
            fileStack.indexOf(currentFile),
            newFileStack.length - 1
          )
          setCurrentFile(newFileStack[newFileIndex])
        }
        setFileStack(newFileStack)
      }
    },
    [fileStack, setFileStack, currentFile, setCurrentFile]
  )

  const onFileClick: FileTreeProps['onFileClick'] = useCallback(
    async (nodeType, path) => {
      if (nodeType === NodeType.DIRECTORY) {
        setSelectedPath(path)
        return
      }
      setOpenFile(path)
    },
    [setSelectedPath, setOpenFile]
  )

  const onCreateFile: FileTreeProps['onCreate'] = useCallback(
    async (type, name) => {
      const path = join(selectedPath, name)
      const commonOptions = { variables: { path } }
      if (type === NodeType.DIRECTORY) {
        await createDirectory(commonOptions)
      } else {
        await createFile(commonOptions)
        setOpenFile(path)
      }
    },
    [selectedPath, createFile, createDirectory, setOpenFile]
  )

  const onFileRename: FileTreeProps['onRename'] = async (oldPath, newPath) => {
    await moveFile({
      variables: { oldPath, newPath }
    })
  }

  const onDeleteFile: FileTreeProps['onDelete'] = async (_, path) => {
    await deleteFile({
      variables: {
        path
      }
    })
  }

  return (
    <Row style={{ height: '100%' }}>
      <Col span={7}>
        <BreezeComponent title="Files">
          <FileTree
            onFileClick={onFileClick}
            onCreate={onCreateFile}
            onRename={onFileRename}
            onDelete={onDeleteFile}
            onMove={async (node, target) => {
              await moveFile({
                variables: {
                  oldPath: node,
                  newPath: join(target, basename(node))
                }
              })
            }}
          />
        </BreezeComponent>
      </Col>
      <Col span={17}>
        <div className="breeze-editor-wrapper">
          <Tabs
            size="small"
            animated={false}
            type="editable-card"
            hideAdd
            className="editor-tabs"
            activeKey={currentFile ? currentFile : undefined}
            onTabClick={setCurrentFile}
            onEdit={onEditTab}
          >
            {fileStack.map(file => (
              <Tabs.TabPane key={file} tab={basename(file)} />
            ))}
          </Tabs>
          <div className="breeze-editor-monaco">
            {currentFile ? (
              <Monaco path={currentFile} />
            ) : (
              <div className="editor-no-open-file">Please select a file</div>
            )}
          </div>
        </div>
      </Col>
    </Row>
  )
}

export default withConfig<typeof Editor, EditorProps>(Editor)
