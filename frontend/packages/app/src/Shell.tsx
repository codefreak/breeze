import React, { useEffect, useState } from 'react'
import { Terminal } from 'xterm'
import useReplWriteData from './hooks/useReplWriteData'
import XTerm from './components/XTerm'
import useReplOutput from './hooks/useReplOutput'
import useReplExit from './hooks/useReplExit'
import useTerminalBuffer from './hooks/useTerminalBuffer'
import withConfig, { WithConfigProps } from './util/withConfig'

export interface ShellProps extends WithConfigProps {
  replId: string
  onExit?: (
    terminal: Terminal,
    exitCode: number,
    purgeBuffer: () => void
  ) => void
}

const Shell: React.FC<ShellProps> = ({ config, replId, onExit }) => {
  const [exitCode, setExitCode] = useState<number>()
  const [terminal, setTerminal] = useState<Terminal>()
  const { buffer, appendBuffer, purgeBuffer } = useTerminalBuffer(
    config.instanceId + ':' + replId
  )
  const [initialized, setInitialized] = useState<boolean>(false)
  const [writeData] = useReplWriteData(replId)

  useReplOutput(
    replId,
    data => {
      if (terminal && exitCode === undefined) {
        terminal.write(data)
        appendBuffer(data)
      }
    },
    { skip: !terminal }
  )

  useReplExit(replId, setExitCode, { skip: !terminal })

  useEffect(() => {
    if (exitCode !== undefined && terminal && onExit) {
      onExit(terminal, exitCode, purgeBuffer)
    }
  }, [terminal, exitCode, onExit, purgeBuffer])

  useEffect(() => {
    if (terminal) {
      // TODO: make resize work again
      //resize(terminal.cols, terminal.rows);
      const event = terminal.onData((data: string) => {
        writeData(data)
      })
      return () => event.dispose()
    }
  }, [terminal, writeData])

  //
  useEffect(() => {
    if (!initialized && terminal) {
      terminal.write(buffer)
      setInitialized(true)
    }
  }, [terminal, buffer, setInitialized, initialized])

  // TODO: "key" is used to force re-render
  return <XTerm key={replId} onReady={setTerminal} />
}

export default withConfig<typeof Shell, ShellProps>(Shell)
