import { useCallback, useEffect, useState } from 'react'

const getStorageKey = (name: string) => `breeze-buffer:${name}`

const useTerminalBuffer = (name: string) => {
  const [buffer, setBuffer] = useState<string>('')

  const appendBuffer = useCallback(
    (data: string) => {
      const newBuffer = buffer + data
      setBuffer(newBuffer)
      sessionStorage.setItem(getStorageKey(name), newBuffer)
    },
    [buffer, setBuffer, name]
  )

  const purgeBuffer = useCallback(() => {
    sessionStorage.removeItem(getStorageKey(name))
  }, [name])

  useEffect(() => {
    // handle name change
    setBuffer(sessionStorage[getStorageKey(name)] || '')
  }, [name])

  return { appendBuffer, buffer, setBuffer, purgeBuffer }
}

export default useTerminalBuffer
