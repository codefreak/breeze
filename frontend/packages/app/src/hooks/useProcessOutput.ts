import {
  ProcessOutputSubscription,
  ProcessOutputSubscriptionVariables,
  useProcessOutputSubscription
} from '../generated/graphql'
import * as ApolloReactHooks from '@apollo/react-hooks'

const useProcessOutput = (
  id: string,
  onData: (data: string) => void,
  additionalOptions?: ApolloReactHooks.SubscriptionHookOptions<
    ProcessOutputSubscription,
    ProcessOutputSubscriptionVariables
  >
): void => {
  useProcessOutputSubscription({
    ...additionalOptions,
    variables: { id },
    onSubscriptionData: sub => {
      if (sub.subscriptionData.data?.processOutput) {
        onData(sub.subscriptionData.data?.processOutput)
      }
    }
  })
}

export default useProcessOutput
