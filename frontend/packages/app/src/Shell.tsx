import React, { useEffect, useState } from 'react'
import { Terminal } from 'xterm'
import useReplWriteData from './hooks/useReplWriteData'
import XTerm from './components/XTerm'
import useReplOutput from './hooks/useReplOutput'
import useReplExit from './hooks/useReplExit'
import useTerminalBuffer from './hooks/useTerminalBuffer'
import withConfig, { WithConfigProps } from './util/withConfig'
import useReplResize from './hooks/useReplResize'

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
  const [resize] = useReplResize(replId)
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
  return <XTerm key={replId} onReady={setTerminal} onResize={resize} />
}

export default withConfig<typeof Shell, ShellProps>(Shell)
