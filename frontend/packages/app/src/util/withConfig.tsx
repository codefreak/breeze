import { Config, useUseConfigQuery } from '../generated/graphql'
import React from 'react'
import { Spin } from 'antd'

export interface WithConfigProps {
  config: Config
}

const withConfig = <
  T extends React.ComponentType<P>,
  P extends WithConfigProps,
  PP = Omit<P, 'config'>
>(
  // TODO: should be T instead of any, but does not work
  TheComp: any
): React.FunctionComponent<PP> => {
  return (props: PP) => {
    const config = useUseConfigQuery()

    if (config.loading || !config.data?.config) {
      return <Spin />
    }

    return <TheComp config={config.data.config} {...props} />
  }
}

export default withConfig
