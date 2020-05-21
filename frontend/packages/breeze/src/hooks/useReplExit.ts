import {
  ReplWaitSubscription,
  ReplWaitSubscriptionVariables,
  useReplWaitSubscription,
} from "../generated/graphql";
import * as ApolloReactHooks from "@apollo/react-hooks";

const useReplExit = (
  id: string,
  onExit: (exitCode: number) => void,
  additionalOptions: ApolloReactHooks.SubscriptionHookOptions<
    ReplWaitSubscription,
    ReplWaitSubscriptionVariables
  >
) => {
  useReplWaitSubscription({
    ...additionalOptions,
    variables: { id },
    onSubscriptionData: (sub) => {
      if (sub.subscriptionData.data?.replWait !== undefined) {
        onExit(sub.subscriptionData.data?.replWait);
      }
    }
  });
};

export default useReplExit;
