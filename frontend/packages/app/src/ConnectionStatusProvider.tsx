import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useState
} from 'react'
import { SubscriptionClient } from 'subscriptions-transport-ws'

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting'
}

export const ConnectionStatusContext = React.createContext(
  ConnectionStatus.DISCONNECTED
)

export const useConnectionStatus = () => useContext(ConnectionStatusContext)

interface ConnectionStatusProviderProps {
  subClient: SubscriptionClient
}

/**
 * Apollo's connection events are a bit weird at the moment.
 * See https://github.com/apollographql/subscriptions-transport-ws/issues/558
 *
 * @param children
 * @param subClient
 * @constructor
 */
const ConnectionStatusProvider: React.FC<PropsWithChildren<
  ConnectionStatusProviderProps
>> = ({ children, subClient }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  )
  useEffect(() => {
    subClient.onConnected(() => setConnectionStatus(ConnectionStatus.CONNECTED))
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
  }, [subClient])

  return (
    <ConnectionStatusContext.Provider
      value={connectionStatus}
      children={children}
    />
  )
}

export default ConnectionStatusProvider
