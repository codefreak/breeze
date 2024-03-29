import React, { useCallback, useState } from 'react'
import { Col, Row, Tabs } from 'antd'
import FileTree, { FileTreeProps, NodeType } from './FileTree'
import Monaco from './Monaco'
import { BreezeComponent } from '../App'
import { basename, dirname, join } from 'path'
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
import { getCanonicalPath } from '../util/path'

interface EditorProps extends WithConfigProps {
  defaultFile?: string
}

const Editor: React.FC<EditorProps> = ({ config: { mainFile } }) => {
  const [fileStack, setFileStack] = useState<string[]>(
    mainFile ? [getCanonicalPath(mainFile)] : []
  )
  const [currentFile, setCurrentFile] = useState<string | undefined>(
    fileStack.length ? fileStack[0] : undefined
  )
  const [selectedPath, setSelectedPath] = useState<string>('/')
  const [createFile] = useCreateFileMutation()
  const [createDirectory] = useCreateDirectoryMutation()
  const [moveFile] = useMoveFileMutation()
  const [deleteFile] = useDeleteFileMutation()

  const setOpenFile = useCallback(
    (path: string) => {
      const normalizedPath = getCanonicalPath(path)
      // insert after current opened file
      if (fileStack.indexOf(normalizedPath) === -1) {
        setFileStack(insertAfter(fileStack, normalizedPath, currentFile))
      }
      setCurrentFile(normalizedPath)
    },
    [fileStack, setFileStack, setCurrentFile, currentFile]
  )

  const closeFileTab = useCallback(
    path => {
      const normalizedPath = getCanonicalPath(path)
      const newFileStack = remove(fileStack, normalizedPath)
      // select another file if current one is closed
      if (currentFile && currentFile === normalizedPath) {
        if (newFileStack.length) {
          // set the current file to the next or last one
          const newFileIndex = Math.min(
            fileStack.indexOf(currentFile),
            newFileStack.length - 1
          )
          setCurrentFile(newFileStack[newFileIndex])
        } else {
          // if there is no file left simply close the tab
          setCurrentFile(undefined)
        }
      }
      setFileStack(newFileStack)
      return newFileStack
    },
    [currentFile, fileStack, setFileStack]
  )

  const onEditTab: TabsProps['onEdit'] = useCallback(
    (targetKey, action) => {
      if (action === 'remove') {
        const path = targetKey.toString()
        closeFileTab(path)
      }
    },
    [closeFileTab]
  )

  const onFileClick: FileTreeProps['onFileClick'] = useCallback(
    async (path, nodeType) => {
      if (nodeType === NodeType.DIRECTORY) {
        setSelectedPath(path)
        return
      }
      setOpenFile(path)
    },
    [setSelectedPath, setOpenFile]
  )

  const onCreateFile: FileTreeProps['onCreate'] = useCallback(
    async (name, type) => {
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

  const onFileRename: FileTreeProps['onRename'] = async (oldPath, newName) => {
    closeFileTab(oldPath)
    const newPath = join(dirname(oldPath), newName)
    await moveFile({
      variables: { oldPath, newPath }
    })
  }

  const onDeleteFile: FileTreeProps['onDelete'] = async path => {
    closeFileTab(path)
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

export default withConfig(Editor)
