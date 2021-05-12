import {
  FileChangedDocument,
  GetFilesQuery,
  useGetFilesQuery
} from '../generated/graphql'
import { useEffect } from 'react'

export interface UseFilesReturn {
  loading: boolean
  data: GetFilesQuery | undefined
}

const useFiles = (): UseFilesReturn => {
  const { subscribeToMore, refetch, loading, data } = useGetFilesQuery({
    fetchPolicy: 'network-only'
  })
  useEffect(() => {
    subscribeToMore({
      document: FileChangedDocument,
      updateQuery: (prev, { subscriptionData }) => {
        refetch()
        return prev
      }
    })
  }, [subscribeToMore, refetch])
  return { loading, data }
}

export default useFiles
