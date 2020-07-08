import { SubscriptionClient } from 'subscriptions-transport-ws'
import { ApolloClient, InMemoryCache } from 'apollo-boost'
import { WebSocketLink } from 'apollo-link-ws'

export const createSubscriptionClient = () => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

  return new SubscriptionClient(
    `${wsProtocol}//${window.location.host}/graphql`,
    {
      reconnect: true,
      timeout: 30000,
      inactivityTimeout: 0,
      lazy: true
    }
  )
}

export const createApolloClient = (subClient: SubscriptionClient) => {
  return new ApolloClient({
    link: new WebSocketLink(subClient),
    cache: new InMemoryCache()
  })
}
