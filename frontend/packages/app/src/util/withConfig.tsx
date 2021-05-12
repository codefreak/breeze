import { Config, useUseConfigQuery } from '../generated/graphql'
import React from 'react'
import LoadingIndicator from '../components/LoadingIndicator'

export interface WithConfigProps {
  config: Config
}

const withConfig = (
  ChildComponent: React.ComponentType<WithConfigProps>
): React.FC => {
  return props => {
    const config = useUseConfigQuery()

    if (config.loading || !config.data?.config) {
      return <LoadingIndicator />
    }

    return <ChildComponent {...props} config={config.data.config} />
  }
}

export default withConfig
