import { useEffect, useState } from 'react'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { useApolloClient } from '@apollo/react-hooks'
import { WebSocketLink } from 'apollo-link-ws'

export enum ConnectionStatus {
  UNKNOWN = 'unknown',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting'
}

/**
 * Apollo's connection events are a bit weird at the moment.
 * See https://github.com/apollographql/subscriptions-transport-ws/issues/558
 */
export const useApolloConnectionStatus = (): ConnectionStatus => {
  const apollo = useApolloClient()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.UNKNOWN
  )

  useEffect(() => {
    if (apollo && apollo.link instanceof WebSocketLink) {
      // @ts-ignore
      const subClient = apollo.link.subscriptionClient as SubscriptionClient
      subClient.onConnected(() =>
        setConnectionStatus(ConnectionStatus.CONNECTED)
      )
      subClient.onReconnected(() =>
        setConnectionStatus(ConnectionStatus.CONNECTED)
      )
      subClient.onConnecting(() =>
        setConnectionStatus(ConnectionStatus.CONNECTING)
      )
      subClient.onDisconnected(() =>
        setConnectionStatus(ConnectionStatus.DISCONNECTED)
      )
      subClient.onReconnecting(() =>
        setConnectionStatus(ConnectionStatus.RECONNECTING)
      )
    }
  }, [apollo, setConnectionStatus])

  return connectionStatus
}

export default useApolloConnectionStatus
