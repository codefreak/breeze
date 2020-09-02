import React, { useEffect, useState } from 'react'
import { Button, Col, Layout, Row } from 'antd'
import { PlaySquareFilled } from '@ant-design/icons'
import Shell from './Shell'
import { ProcessType, useCreateProcessMutation } from './generated/graphql'
import { Terminal } from 'xterm'

import './App.less'
import Editor from './components/Editor'
import ConnectionStatusBadge from './ConnectionStatusBadge'
import LoadingIndicator from './components/LoadingIndicator'

const { Header, Content, Footer } = Layout

export const BreezeComponent: React.FC<{ title: string }> = props => {
  return (
    <div className="component">
      <div className="component-header">{props.title}</div>
      <div className="component-body">{props.children}</div>
    </div>
  )
}

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const [processId, setProcessId] = useState<string>()
  const [runId, setRunId] = useState<string>()
  const [runCode, { loading: runLoading }] = useCreateProcessMutation({
    variables: { type: ProcessType.Run }
  })
  const [createDefaultProcess] = useCreateProcessMutation({
    variables: { type: ProcessType.Default }
  })
  useEffect(() => {
    if (!processId) {
      createDefaultProcess().then(resp => {
        if (resp.data) {
          setProcessId(resp.data.createProcess)
        }
      })
    }
  }, [processId, createDefaultProcess])

  const onRunClick = () => {
    runCode().then(resp => {
      if (resp.data) {
        setRunId(resp.data.createProcess)
      }
    })
  }

  const onRunExit = (terminal: Terminal, exitCode: number) => {
    terminal.writeln(`\nProcess finished with exit code ${exitCode}`)
    terminal.writeln('Press any key to continue...')
    terminal.onData(() => {
      setRunId(undefined)
    })
  }

  const onProcessExit = (terminal: Terminal, exitCode: number) => {
    // force process re-creation
    setProcessId(undefined)
  }

  return (
    <Layout style={{ height: '100%', overflow: 'hidden' }}>
      <Header
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          borderBottom: '1px solid white'
        }}
      >
        <Row>
          <Col span={14}>
            <h1 style={{ color: 'white' }}>
              <img
                src={process.env.PUBLIC_URL + '/breeze-logo.svg'}
                alt="Breeze Logo"
                height={24}
                style={{ marginRight: '.5em' }}
              />
              breeze
            </h1>
          </Col>
          <Col span={10}>
            <Button
              icon={<PlaySquareFilled />}
              onClick={onRunClick}
              loading={runLoading || runId !== undefined}
              type="primary"
            >
              Run Code
            </Button>
          </Col>
        </Row>
      </Header>
      <Content>
        <Row style={{ height: '100%', overflow: 'hidden' }}>
          <Col span={14} style={{ height: '100%' }}>
            <Editor />
          </Col>
          <Col span={10}>
            <BreezeComponent title="Run Output">
              {runId ? (
                <Shell processId={runId} onExit={onRunExit} />
              ) : processId ? (
                <Shell processId={processId} onExit={onProcessExit} />
              ) : (
                <LoadingIndicator />
              )}
            </BreezeComponent>
          </Col>
        </Row>
      </Content>
      <Footer className="footer">
        <div className="footer-item">
          <ConnectionStatusBadge />
        </div>
      </Footer>
    </Layout>
  )
}

export default App
