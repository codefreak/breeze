import React, { useCallback, useEffect, useState } from 'react'
import { debounce } from 'ts-debounce'
import MonacoComp, {
  EditorProps,
  Monaco as IMonaco
} from '@monaco-editor/react'
import { useGetFileQuery, useWriteFileMutation } from '../generated/graphql'
import { useMonaco } from '../hooks/useMonaco'
import { editor } from 'monaco-editor'
import { Spin } from 'antd'

interface MonacoProps {
  path: string
  monaco: IMonaco
}

const preventUnload = () => {
  const e = (e: BeforeUnloadEvent) => {
    e.preventDefault()
  }
  window.addEventListener('beforeunload', e)
  return () => window.removeEventListener('beforeunload', e)
}

const DEFAULT_MONACO_OPTIONS: EditorProps['options'] = {
  automaticLayout: true,
  minimap: { enabled: false },
  contextmenu: false,
  lineNumbersMinChars: 2,
  scrollBeyondLastLine: false,
  renderLineHighlight: 'all',
  scrollbar: {
    vertical: 'auto',
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10
  }
}

const Monaco: React.FC<MonacoProps> = ({ path, monaco }) => {
  const model =
    monaco.editor.getModel(monaco.Uri.file(path)) ||
    monaco.editor.createModel('', undefined, monaco.Uri.file(path))
  const { data } = useGetFileQuery({
    variables: { path },
    fetchPolicy: 'network-only'
  })
  const [writeFile] = useWriteFileMutation()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)
  const [monacoInstance, setMonacoInstance] =
    useState<editor.IStandaloneCodeEditor>()

  // only writes after a delay of 250ms to server
  const debouncedWrite = useCallback(
    debounce((cb?: () => void) => {
      writeFile({
        variables: {
          path,
          contents: model.getValue()
        }
      }).then(() => {
        if (cb) cb()
      })
    }, 250),
    [model, path]
  )

  useEffect(() => {
    if (monacoInstance) {
      monacoInstance.setModel(model)
    }
  }, [model, monacoInstance])

  useEffect(() => {
    if (data?.file?.__typename === 'File') {
      model.setValue(data.file.contents)
    }
  }, [model, data])

  useEffect(() => {
    if (hasUnsavedChanges) {
      return preventUnload()
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    const offDidChangeContent = model.onDidChangeContent(() => {
      setHasUnsavedChanges(true)
      debouncedWrite(() => {
        setHasUnsavedChanges(false)
      })
    })
    return () => offDidChangeContent.dispose()
  }, [model, setHasUnsavedChanges, debouncedWrite])

  return (
    <MonacoComp
      theme="light"
      options={DEFAULT_MONACO_OPTIONS}
      editorDidMount={(_, monaco) => {
        setMonacoInstance(monaco)
      }}
    />
  )
}

const MonacoInitWrapper: React.FC<Omit<MonacoProps, 'monaco'>> = props => {
  const monaco = useMonaco()

  return monaco ? <Monaco monaco={monaco} {...props} /> : <Spin />
}

export default MonacoInitWrapper
