import {
  ProcessWaitSubscription,
  ProcessWaitSubscriptionVariables,
  useProcessWaitSubscription
} from '../generated/graphql'
import * as ApolloReactHooks from '@apollo/react-hooks'

const useProcessExit = (
  id: string,
  onExit: (exitCode: number) => void,
  additionalOptions: ApolloReactHooks.SubscriptionHookOptions<
    ProcessWaitSubscription,
    ProcessWaitSubscriptionVariables
  >
) => {
  useProcessWaitSubscription({
    ...additionalOptions,
    variables: { id },
    onSubscriptionData: sub => {
      if (sub.subscriptionData.data?.processWait !== undefined) {
        onExit(sub.subscriptionData.data?.processWait)
      }
    }
  })
}

export default useProcessExit
