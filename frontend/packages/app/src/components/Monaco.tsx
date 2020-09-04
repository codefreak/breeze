import React, { useEffect, useState } from 'react'
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
  const { data } = useGetFileQuery({ variables: { path } })
  const [writeFile] = useWriteFileMutation()
  const [monacoInstance, setMonacoInstance] = useState<
    editor.IStandaloneCodeEditor
  >()

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
    model.onDidChangeContent(
      debounce(() => {
        writeFile({
          variables: {
            path,
            contents: model.getValue()
          }
        })
      }, 1000)
    )
  }, [writeFile, model, path])

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
