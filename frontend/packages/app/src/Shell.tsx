import React, { useEffect, useState } from 'react'
import { Terminal } from 'xterm'
import useProcessWriteData from './hooks/useProcessWriteData'
import XTerm from './components/XTerm'
import useProcessOutput from './hooks/useProcessOutput'
import useProcessExit from './hooks/useProcessExit'
import useTerminalBuffer from './hooks/useTerminalBuffer'
import withConfig, { WithConfigProps } from './util/withConfig'
import useProcessResize from './hooks/useProcessResize'

export interface ShellProps extends WithConfigProps {
  processId: string
  onExit?: (
    terminal: Terminal,
    exitCode: number,
    purgeBuffer: () => void
  ) => void
}

const Shell: React.FC<ShellProps> = ({ config, processId, onExit }) => {
  const [exitCode, setExitCode] = useState<number>()
  const [resize] = useProcessResize(processId)
  const [terminal, setTerminal] = useState<Terminal>()
  const { buffer, appendBuffer, purgeBuffer } = useTerminalBuffer(
    config.instanceId + ':' + processId
  )
  const [initialized, setInitialized] = useState<boolean>(false)
  const [writeData] = useProcessWriteData(processId)

  useProcessOutput(
    processId,
    data => {
      if (terminal && exitCode === undefined) {
        terminal.write(data)
        appendBuffer(data)
      }
    },
    { skip: !terminal }
  )

  useProcessExit(processId, setExitCode, { skip: !terminal })

  useEffect(() => {
    if (exitCode !== undefined && terminal && onExit) {
      onExit(terminal, exitCode, purgeBuffer)
    }
  }, [terminal, exitCode, onExit, purgeBuffer])

  useEffect(() => {
    if (terminal) {
      const event = terminal.onData((data: string) => {
        writeData(data)
      })
      return () => event.dispose()
    }
  }, [terminal, writeData])

  useEffect(() => {
    if (!initialized && terminal) {
      // trigger initial resize
      if (resize) resize(terminal.rows, terminal.cols)
      // writing local stored buffer into terminal
      terminal.write(buffer)
      setInitialized(true)
    }
  }, [terminal, buffer, setInitialized, initialized, resize])

  // TODO: "key" is used to force re-render
  return <XTerm key={processId} onReady={setTerminal} onResize={resize} />
}

export default withConfig<typeof Shell, ShellProps>(Shell)
