import {
  ReplOutputSubscription,
  ReplOutputSubscriptionVariables,
  useReplOutputSubscription
} from '../generated/graphql'
import * as ApolloReactHooks from '@apollo/react-hooks'

const useReplOutput = (
  id: string,
  onData: (data: string) => void,
  additionalOptions?: ApolloReactHooks.SubscriptionHookOptions<
    ReplOutputSubscription,
    ReplOutputSubscriptionVariables
  >
) => {
  useReplOutputSubscription({
    ...additionalOptions,
    variables: { id },
    onSubscriptionData: sub => {
      if (sub.subscriptionData.data?.replOutput) {
        onData(sub.subscriptionData.data?.replOutput)
      }
    }
  })
}

export default useReplOutput
