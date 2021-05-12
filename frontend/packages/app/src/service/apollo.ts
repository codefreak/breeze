import { SubscriptionClient } from 'subscriptions-transport-ws'
import { ApolloClient, InMemoryCache } from 'apollo-boost'
import { WebSocketLink } from 'apollo-link-ws'

export const createSubscriptionClient = (): SubscriptionClient => {
  const { protocol, host, pathname } = window.location
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:'
  // remove trailing slashes from path
  const path = pathname.replace(/\/*$/, '')

  return new SubscriptionClient(`${wsProtocol}//${host}${path}/graphql`, {
    reconnect: true,
    timeout: 30000,
    inactivityTimeout: 0,
    lazy: true
  })
}

export const createApolloClient = (
  subClient: SubscriptionClient
): ApolloClient<unknown> => {
  return new ApolloClient({
    link: new WebSocketLink(subClient),
    cache: new InMemoryCache()
  })
}
