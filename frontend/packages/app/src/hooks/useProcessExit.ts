import {
  ProcessWaitSubscription,
  ProcessWaitSubscriptionVariables,
  useProcessWaitSubscription
} from '../generated/graphql'
import * as ApolloReactHooks from '@apollo/react-hooks'
import { useEffect } from 'react'

const useProcessExit = (
  id: string,
  onExit: (exitCode: number) => void,
  additionalOptions: ApolloReactHooks.SubscriptionHookOptions<
    ProcessWaitSubscription,
    ProcessWaitSubscriptionVariables
  >
): void => {
  const { data } = useProcessWaitSubscription({
    ...additionalOptions,
    variables: { id }
  })

  useEffect(() => {
    if (data?.processWait !== undefined) {
      onExit(data.processWait)
    }
  }, [data, onExit])
}

export default useProcessExit
