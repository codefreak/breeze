import React, { useCallback, useEffect, useState } from 'react'
import { Terminal } from 'xterm'
import useProcessWriteData from '../hooks/useProcessWriteData'
import XTerm from './XTerm'
import useProcessOutput from '../hooks/useProcessOutput'
import useProcessExit from '../hooks/useProcessExit'
import useProcessResize from '../hooks/useProcessResize'

export interface ShellProps {
  processId: string
  onExit?: (terminal: Terminal, exitCode: number) => void
}

const Shell: React.FC<ShellProps> = ({ processId, onExit }) => {
  const [exitCode, setExitCode] = useState<number>()
  const [resize] = useProcessResize(processId)
  const [terminal, setTerminal] = useState<Terminal>()
  const [initialized, setInitialized] = useState<boolean>(false)
  const [writeData] = useProcessWriteData(processId)

  useProcessOutput(
    processId,
    data => {
      if (terminal && exitCode === undefined) {
        terminal.write(data)
      }
    },
    { skip: !terminal }
  )

  useProcessExit(processId, setExitCode, {
    skip: !terminal
  })

  useEffect(() => {
    if (exitCode !== undefined && terminal && onExit) {
      onExit(terminal, exitCode)
    }
  }, [terminal, exitCode, onExit])

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
      setInitialized(true)
    }
  }, [terminal, setInitialized, initialized, resize])

  // TODO: "key" is used to force re-render
  return <XTerm key={processId} onReady={setTerminal} onResize={resize} />
}

export default Shell
