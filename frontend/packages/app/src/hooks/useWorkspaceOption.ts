import { useStorageState } from 'react-storage-hooks'
import { Dispatch, SetStateAction } from 'react'

const useWorkspaceOption = <T>(
  key: string,
  defaultState: T
): [T, Dispatch<SetStateAction<T>>, Error | undefined] => {
  return useStorageState(sessionStorage, key, defaultState)
}

export default useWorkspaceOption
