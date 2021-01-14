import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import * as serviceWorker from './serviceWorker'
import { ApolloProvider } from '@apollo/react-hooks'
import { createApolloClient, createSubscriptionClient } from './service/apollo'
import SplashScreen from './SplashScreen'

const subscriptionClient = createSubscriptionClient()
const apolloClient = createApolloClient(subscriptionClient)

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <SplashScreen />
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById('root')
)

serviceWorker.unregister()
