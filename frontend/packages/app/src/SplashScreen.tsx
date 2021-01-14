import React from 'react'
import {
  useWorkspaceStatusSubscription,
  WorkspaceStatus
} from './generated/graphql'
import { Result } from 'antd'
import Centering from './Centering'
import { LoadingOutlined } from '@ant-design/icons'
import App from './App'

const SplashScreen: React.FC = () => {
  const { data } = useWorkspaceStatusSubscription()

  const status = data?.workspaceStatus || WorkspaceStatus.Undefined
  if (status !== WorkspaceStatus.Running) {
    return (
      <Centering>
        <Result
          icon={<LoadingOutlined />}
          title="Preparing your workspace…"
          subTitle={`Current status: ${status}`}
        />
      </Centering>
    )
  }
  return <App />
}

export default SplashScreen
