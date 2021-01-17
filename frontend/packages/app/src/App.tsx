import React, { useCallback, useEffect, useState } from 'react'
import { Button, Col, Layout, Row } from 'antd'
import { PlayCircleFilled, StopFilled } from '@ant-design/icons'
import Shell from './components/Shell'
import {
  ProcessType,
  useCreateProcessMutation,
  useStopProcessMutation
} from './generated/graphql'
import { Terminal } from 'xterm'

import './App.less'
import Editor from './components/Editor'
import ConnectionStatusBadge from './components/ConnectionStatusBadge'
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
  const [runExited, setRunExited] = useState<boolean>(false)
  const [runCode, { loading: runLoading }] = useCreateProcessMutation({
    variables: { type: ProcessType.Run }
  })
  const [stopRun, { loading: stopLoading }] = useStopProcessMutation()
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

  const exitRunMode = useCallback(() => {
    setRunId(undefined)
    setRunExited(false)
  }, [setRunId, setRunExited])

  const onRunToggleClick = useCallback(() => {
    // if the terminal is in "Run exited with XYZ" mode simply exit this state
    if (runExited) {
      exitRunMode()
      return
    }

    // if we are in a run session stop it
    if (runId && !stopLoading) {
      // server will trigger a process exit event so no need to handle the response here
      stopRun({ variables: { id: runId } })
      return
    }

    // start a run instance if nothing has been triggered yet
    if (!runLoading && !runId) {
      runCode().then(resp => {
        if (resp.data) {
          setRunId(resp.data.createProcess)
        }
      })
    }
  }, [
    runId,
    stopRun,
    runLoading,
    runCode,
    setRunId,
    runExited,
    exitRunMode,
    stopLoading
  ])

  const onRunExit = useCallback(
    (terminal: Terminal, exitCode: number) => {
      if (exitCode === -1) {
        // premature exit (aka. stopped/killed)
        setRunId(undefined)
        return
      }
      setRunExited(true)
      terminal.writeln(`\nProcess finished with exit code ${exitCode}`)
      terminal.writeln('Press any key to continue...')
      terminal.onData(() => {
        exitRunMode()
      })
    },
    [setRunId, setRunExited, exitRunMode]
  )

  const onProcessExit = (terminal: Terminal, exitCode: number) => {
    // force process re-creation but throttle reconnection by 100ms
    setTimeout(() => {
      setProcessId(undefined)
    }, 100)
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
            </h1>
          </Col>
          <Col span={10}>
            <Button
              loading={runLoading || stopLoading}
              icon={runId ? <StopFilled /> : <PlayCircleFilled />}
              onClick={onRunToggleClick}
              type={'primary'}
              danger={!!runId}
              color={'red'}
            >
              {runId ? 'Stop run' : 'Run code'}
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
