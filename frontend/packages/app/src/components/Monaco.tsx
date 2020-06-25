import React, { useEffect, useState } from 'react'
import { debounce } from 'ts-debounce'
import MonacoComp, { Monaco as IMonaco } from '@monaco-editor/react'
import { useGetFileQuery, useWriteFileMutation } from '../generated/graphql'
import { useMonaco } from '../hooks/useMonaco'
import { editor } from 'monaco-editor'
import { Spin } from 'antd'

interface MonacoProps {
  path: string
  monaco: IMonaco
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
      options={{ automaticLayout: true }}
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
