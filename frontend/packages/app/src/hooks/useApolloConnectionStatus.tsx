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
 * https://developer.mozilla.org/de/docs/Web/API/WebSocket/readyState
 * @param readyState
 */
const getConnectionStatusFromReadyState = (
  readyState: number
): ConnectionStatus => {
  switch (readyState) {
    case 0:
      return ConnectionStatus.CONNECTING
    case 1:
      return ConnectionStatus.CONNECTED
    case 2:
    case 3:
      return ConnectionStatus.DISCONNECTED
    default:
      return ConnectionStatus.UNKNOWN
  }
}

/**
 * Apollo's connection events are a bit weird at the moment.
 * See https://github.com/apollographql/subscriptions-transport-ws/issues/558
 */
export const useApolloConnectionStatus = (): ConnectionStatus => {
  const apollo = useApolloClient()
  // @ts-ignore
  const subClient = apollo.link.subscriptionClient as SubscriptionClient
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    getConnectionStatusFromReadyState(subClient.status)
  )

  useEffect(() => {
    if (apollo && apollo.link instanceof WebSocketLink) {
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
  }, [apollo, setConnectionStatus, subClient])

  return connectionStatus
}

export default useApolloConnectionStatus
