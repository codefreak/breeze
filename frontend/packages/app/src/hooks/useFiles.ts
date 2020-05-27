import {
    FileChangedDocument,
    useGetFilesQuery
} from "../generated/graphql"
import {useEffect} from "react"

const useFiles = () => {
    const {subscribeToMore, refetch, loading, data} = useGetFilesQuery({
        fetchPolicy: "network-only"
    })
    useEffect(() => {
        subscribeToMore({
            document: FileChangedDocument,
            updateQuery: (prev, {subscriptionData}) => {
                refetch()
                return prev
            }
        })
    }, [subscribeToMore, refetch])
    return {loading, data}
}

export default useFiles