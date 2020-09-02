import React, { useCallback, useEffect, useState } from 'react'
import { ITheme, Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { debounce } from 'ts-debounce'
import './XTerm.less'

export interface XTermProps {
  onReady?: (terminal: Terminal) => void
  onResize?: (rows: number, cols: number) => void
}

const XTermThemeLight: ITheme = {
  foreground: '#303030',
  background: '#f5f5f5',
  cursor: '#303030',
  cursorAccent: '#505050',
  selection: '#f5f5f5',
  black: '#151515',
  red: '#ac4142',
  green: '#90a959',
  yellow: '#f4bf75',
  blue: '#6a9fb5',
  magenta: '#aa759f',
  cyan: '#75b5aa',
  white: '#d0d0d0',
  brightBlack: '#505050',
  brightRed: '#ac4142',
  brightGreen: '#90a959',
  brightYellow: '#f4bf75',
  brightBlue: '#6a9fb5',
  brightMagenta: '#aa759f',
  brightCyan: '#75b5aa',
  brightWhite: '#f5f5f5'
}

const XTerm: React.FC<XTermProps> = ({ onReady, onResize }) => {
  const [shellRootRef, setShellRootRef] = useState<HTMLDivElement>()
  const [terminal, setTerminal] = useState<Terminal>()

  useEffect(() => {
    if (shellRootRef && !terminal) {
      const newTerminal = new Terminal({
        theme: XTermThemeLight
      })
      newTerminal.open(shellRootRef)
      setTerminal(newTerminal)
    } else if (!shellRootRef) {
      setTerminal(undefined)
    }
  }, [setTerminal, shellRootRef, terminal])

  useEffect(() => {
    if (terminal) {
      const fitAddon = new FitAddon()
      terminal.loadAddon(fitAddon)
      fitAddon.fit()
      const resizeHandler = debounce(() => {
        fitAddon.fit()
        if (onResize) {
          onResize(terminal.rows, terminal.cols)
        }
      }, 100)
      window.addEventListener('resize', resizeHandler)

      if (onReady) {
        onReady(terminal)
      }

      return () => {
        window.removeEventListener('resize', resizeHandler)
      }
    }
  }, [terminal, onReady, onResize])

  const createShellRootRef = useCallback((ref: any) => {
    setShellRootRef(ref)
  }, [])

  return (
    <div
      className="shell-root"
      ref={createShellRootRef}
      style={{ width: '100%', height: '100%' }}
    />
  )
}

export default XTerm
