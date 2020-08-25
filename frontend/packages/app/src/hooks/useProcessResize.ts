import {
  ResizeProcessMutationResult,
  useResizeProcessMutation
} from '../generated/graphql'
import { useCallback } from 'react'

type UseProcessResizeResult = [
  (rows: number, cols: number) => void,
  ResizeProcessMutationResult
]

const useProcessResize = (id: string): UseProcessResizeResult => {
  const [resizeShell, results] = useResizeProcessMutation()
  const resize = useCallback(
    (rows: number, cols: number) =>
      resizeShell({ variables: { id, cols, rows } }),
    [resizeShell, id]
  )

  return [resize, results]
}

export default useProcessResize
