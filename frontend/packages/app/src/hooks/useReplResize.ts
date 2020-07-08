import {
  ResizeReplMutationResult,
  useResizeReplMutation
} from '../generated/graphql'
import { useCallback } from 'react'

type UseReplResizeResult = [
  (rows: number, cols: number) => void,
  ResizeReplMutationResult
]

const useReplResize = (id: string): UseReplResizeResult => {
  const [resizeShell, results] = useResizeReplMutation()
  const resize = useCallback(
    (rows: number, cols: number) =>
      resizeShell({ variables: { id, cols, rows } }),
    [resizeShell, id]
  )

  return [resize, results]
}

export default useReplResize
