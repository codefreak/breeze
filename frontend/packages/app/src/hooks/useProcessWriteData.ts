import {
  useWriteProcessDataMutation,
  WriteProcessDataMutationResult
} from '../generated/graphql'
import { useCallback } from 'react'

interface MutationWriter {
  (data: string): void
}

const useProcessWriteData = (
  id: string
): [MutationWriter, WriteProcessDataMutationResult] => {
  const [writeShellData, result] = useWriteProcessDataMutation()

  const writer = useCallback(
    (data: string) => {
      return writeShellData({ variables: { id, data } })
    },
    [id, writeShellData]
  )

  return [writer, result]
}

export default useProcessWriteData
