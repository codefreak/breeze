import useConnectionStatus, {
  ConnectionStatus
} from '../hooks/useApolloConnectionStatus'
import React from 'react'
import { Tag } from 'antd'

const connectionStatusLabels = {
  [ConnectionStatus.UNKNOWN]: '???',
  [ConnectionStatus.DISCONNECTED]: 'Disconnected!',
  [ConnectionStatus.CONNECTING]: 'Connecting…',
  [ConnectionStatus.CONNECTED]: 'Connected',
  [ConnectionStatus.RECONNECTING]: 'Reconnecting…'
}

const connectionStatusColors = {
  [ConnectionStatus.UNKNOWN]: 'default',
  [ConnectionStatus.DISCONNECTED]: 'red',
  [ConnectionStatus.CONNECTING]: 'orange',
  [ConnectionStatus.CONNECTED]: 'green',
  [ConnectionStatus.RECONNECTING]: 'orange'
}

const ConnectionStatusBadge: React.FC = () => {
  const status = useConnectionStatus()
  const label = connectionStatusLabels[status] || 'Unknown'
  const color = connectionStatusColors[status] || 'default'
  return <Tag color={color}>{label}</Tag>
}

export default ConnectionStatusBadge
